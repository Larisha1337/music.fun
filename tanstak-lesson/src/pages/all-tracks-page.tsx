import { GlobalTrackList } from "../features/tracks/ui/global-track-list.tsx";

const AllTracksPage = () => {
    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-100">
            <h2 className="text-2xl font-bold text-white">All Tracks</h2>
            <hr className="border-zinc-800" />

            <GlobalTrackList />
        </div>
    );
};

export default AllTracksPage;