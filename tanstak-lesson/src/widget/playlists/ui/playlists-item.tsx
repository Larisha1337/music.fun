import {useState, useMemo, useEffect} from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Track = {
    id: string | number;
    title?: string;
    artist?: string;
    duration?: string | number;
    audioUrl?: string;
    attributes?: {
        title?: string;
        artist?: string;
        duration?: string | number;
        audioUrl?: string;
        file?: {
            url?: string;
        };
    };
};

type Props = {
    playlist: any;
    description: string;
    isOwner: boolean;
    onClick: () => void;
};

export const PlaylistItem = ({ playlist, description, isOwner, onClick }: Props) => {
    // 1. Текущий воспроизводимый трек
    const [playingTrackId, setPlayingTrackId] = useState<string | number | null>(null);

    // 1. Лог для проверки приходящих данных в Консоли (F12)
    useEffect(() => {
        console.log("Данные плейлиста:", playlist);
    }, [playlist]);

// 2. Расширенный поиск массива треков
    const tracks: Track[] = useMemo(() => {
        if (!playlist) return [];

        return (
            playlist.attributes?.tracks ||
            playlist.attributes?.songs ||
            playlist.attributes?.items ||
            playlist.tracks ||
            playlist.items ||
            []
        );
    }, [playlist]);

    // 2. Обложка плейлиста
    const mainImages = playlist.attributes?.images?.main;
    const imageObj = mainImages?.find((img: any) => img.type === "original") || mainImages?.[0];
    const rawUrl = imageObj?.url;

    const imageUrl = rawUrl
        ? rawUrl.startsWith("http") || rawUrl.startsWith("blob:")
            ? rawUrl
            : `${API_BASE_URL}${rawUrl}`
        : null;


    // Вспомогательная функция для получения полного URL аудиофайла
    const getAudioUrl = (track: Track) => {
        const rawAudio = track.audioUrl || track.attributes?.audioUrl || track.attributes?.file?.url;
        if (!rawAudio) return null;
        if (rawAudio.startsWith("http") || rawAudio.startsWith("blob:")) return rawAudio;
        return `${API_BASE_URL}${rawAudio}`;
    };

    const togglePlayTrack = (trackId: string | number) => {
        setPlayingTrackId((prev) => (prev === trackId ? null : trackId));
    };

    return (
        <li className="list-none">
            <div className="flex flex-col gap-6 p-5 bg-[#18181b]/60 border border-[#27272a] rounded-2xl transition-all hover:border-zinc-700">
                {/* Шапка плейлиста */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={playlist.attributes?.title || "Playlist cover"}
                                className="w-full sm:w-[160px] h-[160px] object-cover rounded-xl shrink-0 shadow-md"
                            />
                        ) : (
                            <div className="w-full sm:w-[160px] h-[160px] bg-zinc-800/80 rounded-xl flex items-center justify-center text-xs text-zinc-500 shrink-0 border border-zinc-700/50">
                                No cover
                            </div>
                        )}

                        {/* Название и описание плейлиста */}
                        <div
                            onClick={onClick}
                            className={`flex flex-col ${isOwner ? 'cursor-pointer group' : ''}`}
                        >
                            <span className={`text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight break-all ${isOwner ? 'group-hover:text-indigo-400 transition-colors' : ''}`}>
                                {playlist.attributes?.title}
                            </span>

                            {description && (
                                <span className="text-sm text-zinc-400 mt-1 break-all">
                                    {description}
                                </span>
                            )}

                            <span className="text-xs text-zinc-500 mt-3 font-medium">
                                Треков: {tracks.length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Блок музыки (Треки) */}
                <div className="w-full pt-4 border-t border-[#27272a]/80 space-y-2">
                    <h4 className="text-sm font-semibold text-zinc-400 mb-3 px-1">
                        Список треков
                    </h4>

                    {tracks.length > 0 ? (
                        <div className="space-y-2">
                            {tracks.map((track, index) => {
                                const trackId = track.id || index;
                                const title = track.title || track.attributes?.title || `Трек ${index + 1}`;
                                const artist = track.artist || track.attributes?.artist || "Неизвестный исполнитель";
                                const audioSrc = getAudioUrl(track);
                                const isPlaying = playingTrackId === trackId;

                                return (
                                    <div
                                        key={trackId}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#27272a]/40 hover:bg-[#27272a]/70 rounded-xl transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                                            <span className="text-xs font-mono text-zinc-500 w-5 text-center">
                                                {index + 1}
                                            </span>

                                            {/* Кнопка Play / Pause */}
                                            {audioSrc && (
                                                <button
                                                    type="button"
                                                    onClick={() => togglePlayTrack(trackId)}
                                                    className="w-8 h-8 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
                                                    title={isPlaying ? "Пауза" : "Воспроизвести"}
                                                >
                                                    {isPlaying ? (
                                                        <span className="text-xs">❚❚</span>
                                                    ) : (
                                                        <span className="text-xs translate-x-[1px]">▶</span>
                                                    )}
                                                </button>
                                            )}

                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-medium text-zinc-200 truncate">
                                                    {title}
                                                </span>
                                                <span className="text-xs text-zinc-400 truncate">
                                                    {artist}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Встроенный плеер при воспроизведении */}
                                        {audioSrc && isPlaying && (
                                            <div className="w-full sm:w-auto mt-2 sm:mt-0">
                                                <audio
                                                    src={audioSrc}
                                                    controls
                                                    autoPlay
                                                    onEnded={() => setPlayingTrackId(null)}
                                                    className="h-8 w-full sm:w-64 max-w-full rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-[#27272a]/20 rounded-xl border border-dashed border-zinc-800">
                            <p className="text-xs text-zinc-500">В этом плейлисте пока нет треков</p>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
};


// так как это загрузка буквально
// ждет ответа от сервера она слишком
// во первых замедляет весь плейлист из-за плохого апи
// а во вторых жрет все запросы

// import { useState } from "react";
// import { usePlaylistTracksQuery } from "../../../../../features/tracks/api/use-playlist-tracks-query.ts";
//
// const API_BASE_URL=import.meta.env.VITE_API_BASE_URL;
//
// type Props = {
//     playlist: any;
//     description: string;
//     isOwner: boolean;
//     onClick: () => void;
// };
//
// export const PlaylistItem = ({ playlist, description, isOwner, onClick }: Props) => {
//     const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
//
//     const playlistId = playlist.id;
//     const { data: tracks = [], isLoading: tracksLoading } = usePlaylistTracksQuery(playlistId);
//
//     const mainImages = playlist.attributes?.images?.main;
//     const imageObj = mainImages?.find((img: any) => img.type === "original") || mainImages?.[0];
//     const rawUrl = imageObj?.url;
//
//     const imageUrl = rawUrl
//         ? rawUrl.startsWith("http") || rawUrl.startsWith("blob:")
//             ? rawUrl
//             : `${API_BASE_URL}${rawUrl}`
//         : null;
//
//     // ⚠️ Проверь на реальном ответе, в каком именно attachment лежит сама аудиодорожка -
//     // тут беру первый attachment, но если их несколько (например ещё и обложка),
//     // возможно нужно фильтровать по contentType === 'audio/mpeg'
//     const getAudioUrl = (track: any) => {
//         const audioAttachment = track.attributes?.attachments?.find(
//             (a: any) => a.contentType?.startsWith('audio/')
//         ) || track.attributes?.attachments?.[0];
//         return audioAttachment?.url ?? null;
//     };
//
//     const togglePlayTrack = (trackId: string) => {
//         setPlayingTrackId((prev) => (prev === trackId ? null : trackId));
//     };
//
//     return (
//         <li className="list-none">
//             <div className="flex flex-col gap-6 p-5 bg-[#18181b]/60 border border-[#27272a] rounded-2xl transition-all hover:border-zinc-700">
//                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//                     <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
//                         {imageUrl ? (
//                             <img
//                                 src={imageUrl}
//                                 alt={playlist.attributes?.title || "Playlist cover"}
//                                 className="w-full sm:w-[160px] h-[160px] object-cover rounded-xl shrink-0 shadow-md"
//                             />
//                         ) : (
//                             <div className="w-full sm:w-[160px] h-[160px] bg-zinc-800/80 rounded-xl flex items-center justify-center text-xs text-zinc-500 shrink-0 border border-zinc-700/50">
//                                 No cover
//                             </div>
//                         )}
//
//                         <div
//                             onClick={onClick}
//                             className={`flex flex-col ${isOwner ? 'cursor-pointer group' : ''}`}
//                         >
//                             <span className={`text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight break-all ${isOwner ? 'group-hover:text-indigo-400 transition-colors' : ''}`}>
//                                 {playlist.attributes?.title}
//                             </span>
//
//                             {description && (
//                                 <span className="text-sm text-zinc-400 mt-1 break-all">
//                                     {description}
//                                 </span>
//                             )}
//
//                             <span className="text-xs text-zinc-500 mt-3 font-medium">
//                                 Треков: {tracks.length}
//                             </span>
//                         </div>
//                     </div>
//                 </div>
//
//                 <div className="w-full pt-4 border-t border-[#27272a]/80 space-y-2">
//                     <h4 className="text-sm font-semibold text-zinc-400 mb-3 px-1">
//                         Список треков
//                     </h4>
//
//                     {tracksLoading ? (
//                         <p className="text-xs text-zinc-500 text-center py-4">Загрузка треков...</p>
//                     ) : tracks.length > 0 ? (
//                         <div className="space-y-2">
//                             {tracks.map((track: any, index: number) => {
//                                 const trackId = track.id;
//                                 const title = track.attributes?.title || `Трек ${index + 1}`;
//                                 const artistNames = track.relationships?.artists?.data?.length
//                                     ? track.relationships.artists.data.map((a: any) => a.name).join(', ')
//                                     : 'Неизвестный исполнитель';
//                                 const audioSrc = getAudioUrl(track);
//                                 const isPlaying = playingTrackId === trackId;
//
//                                 return (
//                                     <div
//                                         key={trackId}
//                                         className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#27272a]/40 hover:bg-[#27272a]/70 rounded-xl transition-colors group"
//                                     >
//                                         <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
//                                             <span className="text-xs font-mono text-zinc-500 w-5 text-center">
//                                                 {index + 1}
//                                             </span>
//
//                                             {audioSrc && (
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => togglePlayTrack(trackId)}
//                                                     className="w-8 h-8 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer"
//                                                     title={isPlaying ? "Пауза" : "Воспроизвести"}
//                                                 >
//                                                     {isPlaying ? (
//                                                         <span className="text-xs">❚❚</span>
//                                                     ) : (
//                                                         <span className="text-xs translate-x-[1px]">▶</span>
//                                                     )}
//                                                 </button>
//                                             )}
//
//                                             <div className="flex flex-col min-w-0">
//                                                 <span className="text-sm font-medium text-zinc-200 truncate">
//                                                     {title}
//                                                 </span>
//                                                 <span className="text-xs text-zinc-400 truncate">
//                                                     {artistNames}
//                                                 </span>
//                                             </div>
//                                         </div>
//
//                                         {audioSrc && isPlaying && (
//                                             <div className="w-full sm:w-auto mt-2 sm:mt-0">
//                                                 <audio
//                                                     src={audioSrc}
//                                                     controls
//                                                     autoPlay
//                                                     onEnded={() => setPlayingTrackId(null)}
//                                                     className="h-8 w-full sm:w-64 max-w-full rounded-lg"
//                                                 />
//                                             </div>
//                                         )}
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     ) : (
//                         <div className="text-center py-6 bg-[#27272a]/20 rounded-xl border border-dashed border-zinc-800">
//                             <p className="text-xs text-zinc-500">В этом плейлисте пока нет треков</p>
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </li>
//     );
// };