import { GlobalTrackList } from "../features/tracks/ui/global-track-list.tsx";
import { DiscoverSections } from "../features/tracks/ui/discover-sections.tsx";
import { AddFromDeezerButton } from "../features/tracks/ui/deezer/add-from-deezer-modal.tsx";
import { useMeQuery } from "../hooks/useMeQuery.ts";

const AllTracksPage = () => {
    const { data: user } = useMeQuery();

    return (
        <div className="w-full px-3 sm:px-6 py-4 sm:py-6 text-zinc-100 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">All Tracks</h2>
                    {user && <AddFromDeezerButton />}
                </div>
                <hr className="border-zinc-800" />

                <DiscoverSections />

                {user && <h3 className="text-sm sm:text-base font-bold text-white px-1">Вся библиотека</h3>}

                <GlobalTrackList />
            </div>
        </div>
    );
};

export default AllTracksPage;