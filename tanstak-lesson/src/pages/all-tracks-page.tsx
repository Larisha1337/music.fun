import { GlobalTrackList } from "../features/tracks/ui/global-track-list.tsx";

const AllTracksPage = () => {
    return (
        <div className="w-full px-6 py-6 text-zinc-100 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-6">
                <h2 className="text-2xl font-bold text-white">All Tracks</h2>
                <hr className="border-zinc-800" />

                <GlobalTrackList />
            </div>
        </div>
    );
};

export default AllTracksPage;