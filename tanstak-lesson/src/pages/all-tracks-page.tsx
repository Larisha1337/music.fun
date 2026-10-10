import { GlobalTrackList } from "../features/tracks/ui/global-track-list.tsx";
import { DiscoverSections } from "../features/tracks/ui/discover-sections.tsx";
import { AddFromDeezerButton } from "../features/tracks/ui/deezer/add-from-deezer-modal.tsx";
import { Hero } from "../features/tracks/ui/hero.tsx";
import { SectionTitle, IconLayers } from "@/shared/ui/section-title.tsx";
import { useMeQuery } from "../hooks/useMeQuery.ts";

const AllTracksPage = () => {
    const { data: user } = useMeQuery();

    return (
        <div className="w-full px-3 sm:px-6 py-4 sm:py-6 text-zinc-100 flex flex-col items-center">
            <div className="w-full max-w-4xl space-y-8 sm:space-y-10">
                <h1 className="sr-only">Треки</h1>

                <Hero />

                <DiscoverSections />

                <section className="space-y-4">
                    <SectionTitle icon={<IconLayers />} action={user ? <AddFromDeezerButton /> : undefined}>
                        Вся библиотека
                    </SectionTitle>
                    <GlobalTrackList />
                </section>
            </div>
        </div>
    );
};

export default AllTracksPage;