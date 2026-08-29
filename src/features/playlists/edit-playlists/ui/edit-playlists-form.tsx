import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";

type FormValues = {
    title: string;
    description: string;
};

type Props = {
    playlistId: string;
    initialTitle?: string;
    initialDescription?: string;
    onSuccess?: () => void;
};

export const EditPlaylistForm = ({
                                     playlistId,
                                     initialTitle = '',
                                     initialDescription = '',
                                     onSuccess
                                 }: Props) => {
    const { handleSubmit, register } = useForm<FormValues>({
        defaultValues: {
            title: initialTitle,
            description: initialDescription,
        }
    });

    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: async (formData: FormValues) => {
            const response = await client.PUT('/playlists/{playlistId}', {
                params: {
                    path: { playlistId }
                },
                body: {
                    data: {
                        type: 'playlists',
                        attributes: {
                            title: formData.title,
                            description: formData.description || null,
                            tagIds: []
                        }
                    }
                }
            });

            if (response.error) throw response.error;
            return response.data;
        },
        onSuccess: (_, variables) => {
            // 1. Достаем старые сохраненные описания из localStorage
            const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');

            // 2. Записываем новое описание для конкретного плейлиста
            saved[playlistId] = variables.description;
            localStorage.setItem('playlist_descriptions', JSON.stringify(saved));

            // 3. Обновляем кэш TanStack Query (как делали до этого)
            queryClient.setQueriesData({ queryKey: ['playlists'] }, (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    data: oldData.data.map((playlist: any) =>
                        playlist.id === playlistId
                            ? {
                                ...playlist,
                                attributes: {
                                    ...playlist.attributes,
                                    title: variables.title,
                                    description: variables.description
                                }
                            }
                            : playlist
                    )
                };
            });

            onSuccess?.();
        }
    });

    const onSubmit = (formData: FormValues) => {
        mutate(formData);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            style={{ marginTop: '10px', marginBottom: '15px' }}
            className="max-w-2xl w-full mx-auto p-10 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl space-y-6 text-zinc-100"
        >
            <h2 className="text-4xl font-extrabold text-white">
                Edit Playlist
            </h2>

            <div className="space-y-2">
                <label htmlFor="playlist-title" className="block text-base font-medium text-zinc-300">
                    Title
                </label>
                <input
                    {...register('title', { required: true })}
                    id="playlist-title"
                    type="text"
                    placeholder="e.g. Favorite Songs 2026"
                    className="w-full px-5 py-3.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-xl text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
            </div>

            <div className="space-y-2">
                <label htmlFor="playlist-desc" className="block text-base font-medium text-zinc-300">
                    Description
                </label>
                <textarea
                    {...register('description')}
                    id="playlist-desc"
                    rows={4}
                    placeholder="Add an optional description..."
                    className="w-full px-5 py-3.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-xl text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                />
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
                {isPending ? "Saving..." : "Save Changes"}
            </button>
        </form>
    );
};