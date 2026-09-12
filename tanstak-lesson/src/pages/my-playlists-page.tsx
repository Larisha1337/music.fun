import { useMeQuery } from "../hooks/useMeQuery.ts";
import { Navigate } from "@tanstack/react-router";
import { Playlist } from "../widget/playlists/ui/playlists.tsx";
import { AddPlaylistModal } from "../features/playlists/add-playlists/ui/add-playlists-modal.tsx";
import {usePlaylistSearch} from "../widget/playlists/api/use-playlists-search.ts";
import {PlaylistSearch} from "../widget/playlists/ui/PlaylistSearch.tsx";

const MyPlaylistsPage = () => {
    const { data, isPending } = useMeQuery();
    const { search, handleSearchChange, page, setPage } = usePlaylistSearch();

    if (isPending) return (
        <div>Loading...</div>
    );

    if (!data) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-100">
            <h2 className="text-2xl font-bold text-white">My Playlists</h2>
            <hr className="border-zinc-800" />
            <br/>
            <PlaylistSearch search={search} onSearchChange={handleSearchChange} />
            <br/>

            {/* Кнопка добавления теперь находится здесь, прямо перед списком/поиском */}
            <div className="flex justify-center">
                <AddPlaylistModal />
            </div>

            <Playlist userId={data.userId} search={search} onSearchChange={handleSearchChange} page={page} setPage={setPage} />
        </div>
    );
};

export default MyPlaylistsPage;