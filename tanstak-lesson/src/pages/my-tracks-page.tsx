import { useMeQuery } from "../hooks/useMeQuery.ts";
import { Navigate } from "@tanstack/react-router";
import { UploadTrackModal } from "../features/tracks/ui/upload/upload-track-modal.tsx";
import { TrackList } from "../features/tracks/ui/track-list.tsx";

const MyTracksPage = () => {
    const { data, isPending } = useMeQuery();

    if (isPending) return <div>Loading...</div>;
    if (!data) return <Navigate to="/" replace />;

    return (
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-100">
            <h2 className="text-2xl font-bold text-white">My Tracks</h2>
            <hr className="border-zinc-800" />

            <div className="flex justify-center">
                <UploadTrackModal />
            </div>

            <TrackList />
        </div>
    );
};

export default MyTracksPage;