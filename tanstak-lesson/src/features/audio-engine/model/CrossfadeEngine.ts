export class CrossfadeEngine {
    private audioCtx: AudioContext;
    private deckA: HTMLAudioElement;
    private deckB: HTMLAudioElement;

    private gainA: GainNode;
    private gainB: GainNode;

    private activeDeck: 'A' | 'B' = 'A';
    private crossfadeDuration: number = 2.5;

    // Принимаем audioCtx первым аргументом
    constructor(audioCtx: AudioContext, eqInputNode: BiquadFilterNode) {
        this.audioCtx = audioCtx;

        this.deckA = new Audio();
        this.deckB = new Audio();

        // Разрешаем CORS для аудио-элементов
        this.deckA.crossOrigin = 'anonymous';
        this.deckB.crossOrigin = 'anonymous';

        const sourceA = this.audioCtx.createMediaElementSource(this.deckA);
        const sourceB = this.audioCtx.createMediaElementSource(this.deckB);

        this.gainA = this.audioCtx.createGain();
        this.gainB = this.audioCtx.createGain();

        sourceA.connect(this.gainA).connect(eqInputNode);
        sourceB.connect(this.gainB).connect(eqInputNode);

        this.gainA.gain.value = 1;
        this.gainB.gain.value = 0;
    }

    public setCrossfadeDuration(seconds: number) {
        this.crossfadeDuration = seconds;
    }

    public async playNextTrack(nextTrackUrl: string, targetMasterVolume: number = 1) {
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        const isCurrentA = this.activeDeck === 'A';
        const currentDeck = isCurrentA ? this.deckA : this.deckB;
        const nextDeck = isCurrentA ? this.deckB : this.deckA;

        const currentGain = isCurrentA ? this.gainA : this.gainB;
        const nextGain = isCurrentA ? this.gainB : this.gainA;

        nextDeck.src = nextTrackUrl;
        nextDeck.load();

        try {
            await nextDeck.play();
        } catch (err) {
            console.warn("Autoplay blocked or play error:", err);
            return;
        }

        const now = this.audioCtx.currentTime;
        const fadeTime = this.crossfadeDuration;

        currentGain.gain.setValueAtTime(currentGain.gain.value, now);
        currentGain.gain.linearRampToValueAtTime(0, now + fadeTime);

        nextGain.gain.setValueAtTime(0, now);
        nextGain.gain.linearRampToValueAtTime(targetMasterVolume, now + fadeTime);

        setTimeout(() => {
            currentDeck.pause();
            currentDeck.currentTime = 0;
        }, fadeTime * 1000);

        this.activeDeck = isCurrentA ? 'B' : 'A';
    }
}