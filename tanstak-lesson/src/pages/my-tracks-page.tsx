import { useMeQuery } from "../hooks/useMeQuery.ts";
import { Navigate } from "@tanstack/react-router";
import { UploadTrackModal } from "../features/tracks/ui/upload/upload-track-modal.tsx";
import { MyTrackList } from "@/features/tracks/ui/my-track-list.tsx";

const MyTracksPage = () => {
    const { data, isPending } = useMeQuery();

    if (isPending) {
        return (
            <div className="w-full py-20 flex justify-center text-sm text-zinc-500 animate-pulse">
                Loading...
            </div>
        );
    }
    if (!data) return <Navigate to="/" replace />;

    return (
        <div className="w-full px-3 sm:px-6 py-4 sm:py-6 text-zinc-100 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white">My Tracks</h2>
                <hr className="border-zinc-800" />

                <div className="flex justify-center">
                    <UploadTrackModal />
                </div>

                <MyTrackList />
            </div>
        </div>
    );
};

export default MyTracksPage;