import os
import tempfile
import traceback
from urllib.parse import urlparse

import librosa
import numpy as np
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

MAX_BYTES = 40 * 1024 * 1024  # не качаем файлы больше 40 МБ
MAX_SECONDS = 600             # дольше 10 минут не читаем
WINDOW_SECONDS = 60           # по этому куску считаем темп и тональность
PEAK_COUNT = 160              # столько столбиков в волне
KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

# Профили Крумхансла-Шмуклера для мажора и минора
MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])


class AnalyzeRequest(BaseModel):
    url: str


def detect_key(y, sr) -> str:
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    profile = chroma.mean(axis=1)

    best_score, best_key = -2.0, "C"
    for i in range(12):
        s_major = np.corrcoef(profile, np.roll(MAJOR, i))[0, 1]
        s_minor = np.corrcoef(profile, np.roll(MINOR, i))[0, 1]
        if s_major > best_score:
            best_score, best_key = s_major, KEYS[i]
        if s_minor > best_score:
            best_score, best_key = s_minor, KEYS[i] + "m"
    return best_key


def normalize_bpm(bpm: float) -> int:
    # Детекторы часто путают темп вдвое: приводим к привычному диапазону 70-180
    while bpm < 70:
        bpm *= 2
    while bpm > 180:
        bpm /= 2
    return int(round(bpm))


def middle_window(y, sr, seconds=WINDOW_SECONDS):
    size = seconds * sr
    if len(y) <= size:
        return y
    start = (len(y) - size) // 2
    return y[start:start + size]


def compute_peaks(y):
    """Огибающая громкости: PEAK_COUNT значений от 0 до 1 для рисования волны"""
    if y.size == 0:
        return []

    chunks = np.array_split(y.astype(np.float64), PEAK_COUNT)
    rms = np.array([np.sqrt(np.mean(c * c)) if c.size else 0.0 for c in chunks])

    ref = np.percentile(rms, 98)
    if ref <= 0:
        return [0.04] * PEAK_COUNT

    norm = np.clip(rms / ref, 0, 1) ** 0.8
    norm = np.maximum(norm, 0.04)
    return [round(float(v), 3) for v in norm]


def download_to_temp(url: str) -> str:
    ext = os.path.splitext(urlparse(url).path)[1].lower() or ".mp3"
    if ext not in (".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac", ".webm", ".mp4", ".opus"):
        ext = ".mp3"

    resp = requests.get(url, stream=True, timeout=20)
    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Не удалось скачать аудио: HTTP {resp.status_code}")

    fd, path = tempfile.mkstemp(suffix=ext)
    size = 0
    with os.fdopen(fd, "wb") as f:
        for chunk in resp.iter_content(chunk_size=1024 * 256):
            if not chunk:
                continue
            size += len(chunk)
            if size > MAX_BYTES:
                f.close()
                os.remove(path)
                raise HTTPException(status_code=400, detail="Файл слишком большой")
            f.write(chunk)
    return path


# Обычный def: FastAPI запустит его в потоке и не заблокирует сервис
@app.post("/analyze")
def analyze_track(data: AnalyzeRequest):
    path = None
    try:
        path = download_to_temp(data.url)

        y, sr = librosa.load(path, sr=22050, mono=True, duration=MAX_SECONDS)
        if y.size < sr * 3:
            raise HTTPException(status_code=400, detail="Трек слишком короткий для анализа")

        peaks = compute_peaks(y)

        window = middle_window(y, sr)
        tempo, _ = librosa.beat.beat_track(y=window, sr=sr)
        bpm = normalize_bpm(float(np.atleast_1d(tempo)[0]))
        key = detect_key(window, sr)

        return {"bpm": bpm, "key": key, "peaks": peaks}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if path and os.path.exists(path):
            os.remove(path)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)