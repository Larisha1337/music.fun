import { useMyTracksQuery } from '../api/use-tracks-query'
import { TrackList } from './track-list'

export const MyTrackList = () => {
    const { data: tracks = [], isLoading } = useMyTracksQuery()

    return (
        <TrackList
            tracks={tracks}
            isLoading={isLoading}
            emptyMessage="Вы еще не добавили ни одного трека"
            enableActions={true} // Включаем клик по названию и модалку редактирования
            showAuthor={false}
        />
    )
}