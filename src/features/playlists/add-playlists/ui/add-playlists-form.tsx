import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";
// 💡 Импортируем нашу фабрику (проверь путь импорта для твоего проекта)
import { playlistsKeys } from "../../../../shared/api/keys-factories/playlists-keys-factory.ts";

type FormValues = {
    title: string;
    description: string;
};

export const AddPlaylistForm = () => {
    const { handleSubmit, register, reset } = useForm<FormValues>();
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: async (formData: FormValues) => {
            const response = await client.POST('/playlists', {
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

        // ⚡️ 1. Мгновенное добавление в кэш до ответа сервера
        onMutate: async (formData) => {
            // ✅ Меняем на фабрику
            await queryClient.cancelQueries({ queryKey: playlistsKeys.all });

            // ✅ Меняем на фабрику
            const previousPlaylists = queryClient.getQueryData(playlistsKeys.all);

            const tempId = `temp-${Date.now()}`;

            const newPlaylist = {
                id: tempId,
                type: 'playlists',
                attributes: {
                    title: formData.title,
                    description: formData.description || null,
                }
            };

            // ✅ Меняем на фабрику
            queryClient.setQueriesData({ queryKey: playlistsKeys.all }, (oldData: any) => {
                if (!oldData) return oldData;

                if (Array.isArray(oldData)) {
                    return [newPlaylist, ...oldData];
                }

                if (oldData.data && Array.isArray(oldData.data)) {
                    return {
                        ...oldData,
                        data: [newPlaylist, ...oldData.data]
                    };
                }

                return oldData;
            });

            if (formData.description) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                saved[tempId] = formData.description;
                localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
            }

            reset();

            return { previousPlaylists, tempId };
        },

        // 🚑 2. Откат при ошибке сети
        onError: (err, _variables, context) => {
            if (context?.previousPlaylists) {
                // ✅ Меняем на фабрику
                queryClient.setQueriesData({ queryKey: playlistsKeys.all }, context.previousPlaylists);
            }
            if (context?.tempId) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                delete saved[context.tempId];
                localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
            }
            console.error("Ошибка создания плейлиста", err);
        },

        // ✨ Подменяем временный ID на реальный, когда сервер ответил
        onSuccess: (data: any, _variables, context) => {
            const realId = data?.data?.id || data?.id;
            const tempId = context?.tempId;

            if (realId && tempId) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                if (saved[tempId]) {
                    saved[realId] = saved[tempId];
                    delete saved[tempId];
                    localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
                }

                // ✅ Меняем на фабрику
                queryClient.setQueriesData({ queryKey: playlistsKeys.all }, (oldData: any) => {
                    if (!oldData) return oldData;

                    const updateList = (list: any[]) =>
                        list.map(item => item?.id === tempId ? { ...item, id: realId } : item);

                    if (Array.isArray(oldData)) {
                        return updateList(oldData);
                    }
                    if (oldData.data && Array.isArray(oldData.data)) {
                        return {
                            ...oldData,
                            data: updateList(oldData.data)
                        };
                    }
                    return oldData;
                });
            }
        },

        onSettled: () => {
            // ✅ Меняем на фабрику
            queryClient.invalidateQueries({
                queryKey: playlistsKeys.all,
                refetchType: "all"
            });
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
            <h2 className="text-4xl font-extrabold text-white w-[450px]">
                Add New Playlist
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
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50"
            >
                {isPending ? "Создание..." : "Create"}
            </button>
        </form>
    );
};