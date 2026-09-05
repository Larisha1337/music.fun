import {useMeQuery} from "../hooks/useMeQuery.ts";
import {Navigate} from "@tanstack/react-router";
import {Playlist} from "../widget/playlists/ui/playlists.tsx";
import {AddPlaylistForm} from "../features/playlists/add-playlists/ui/add-playlists-form.tsx";

const MyPlaylistsPage = () => {
    const { data, isPending } = useMeQuery()

    if (isPending) return (
        <div>Loading...</div>
    )

    if (!data) {
        return <Navigate to="/" replace />
    }

    return (
        <div>
            <h2>My Playlists </h2>
            <hr/>
            <AddPlaylistForm />  
            <hr/>
               <Playlist userId={data.userId} />
        </div>
    )
}

export default MyPlaylistsPage
