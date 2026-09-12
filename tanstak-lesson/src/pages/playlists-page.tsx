import {Playlist} from "../widget/playlists/ui/playlists.tsx";
import {PlaylistSearch} from "../widget/playlists/ui/PlaylistSearch.tsx";
import {usePlaylistSearch} from "../widget/playlists/api/use-playlists-search.ts";

function PlaylistsPage() {
    const { search, handleSearchChange, page, setPage } = usePlaylistSearch();

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-100">
            <PlaylistSearch search={search} onSearchChange={handleSearchChange} />
            <Playlist search={search} onSearchChange={handleSearchChange} page={page} setPage={setPage} />
        </div>
    );
}
export default PlaylistsPage
