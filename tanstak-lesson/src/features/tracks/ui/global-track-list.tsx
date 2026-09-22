import { TrackList } from './track-list'
import {useAllTracksQuery} from "@/features/tracks/public/api/use-all-tracks-query.ts";

export const GlobalTrackList = () => {
    const { data: tracks = [], isLoading } = useAllTracksQuery()

    return (
        <TrackList
            tracks={tracks}
            isLoading={isLoading}
            emptyMessage="В глобальной ленте пока нет треков"
            enableActions={false} // Выключаем редактирование чужих треков
            showAuthor={true}     // Показываем email загрузившего
        />
    )
}