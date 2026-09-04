import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../../shared/api/client.ts";
import type { FormValues, Props } from "./type/edit-type.ts";
import {playlistsKeys} from "../../../../../shared/api/keys-factories/playlists-keys-factory.ts";

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

        // ⚡️ 1. Срабатывает МОМЕНТАЛЬНО при нажатии на кнопку "Save Changes"
        onMutate: async (variables) => {
            // Отменяем текущие запросы за плейлистами, чтобы они не перетерли наши оптимистичные данные
            await queryClient.cancelQueries({ queryKey: playlistsKeys.all });

            // Делаем "слепок" (snapshot) старых данных на случай ошибки
            const previousPlaylists = queryClient.getQueryData(['playlists']);

            const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
            const previousDescription = saved[playlistId];

            // 🚀 ОПТИМИСТИЧНО ОБНОВЛЯЕМ КЭШ СРАЗУ ЖЕ
            queryClient.setQueriesData({ queryKey: playlistsKeys.all }, (oldData: any) => {
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

            // 🚀 ОПТИМИСТИЧНО ОБНОВЛЯЕМ LOCALSTORAGE
            saved[playlistId] = variables.description;
            localStorage.setItem('playlist_descriptions', JSON.stringify(saved));

            // 💡 ВАЖНО: Закрываем модалку прямо сейчас! Не ждем сервера.
            // Пользователь мгновенно увидит результат.
            onSuccess?.();

            // Возвращаем слепок старых данных, чтобы передать его в onError
            return { previousPlaylists, previousDescription };
        },

        // 🚑 2. Если что-то пошло не так (нет инета, сервер упал)
        onError: (err, _variables, context) => {
            // Откатываем кэш реакта к старым данным
            if (context?.previousPlaylists) {
                queryClient.setQueriesData({ queryKey: playlistsKeys.all }, context.previousPlaylists);
            }

            // Откатываем localStorage
            if (context !== undefined) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                if (context.previousDescription) {
                    saved[playlistId] = context.previousDescription;
                } else {
                    delete saved[playlistId];
                }
                localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
            }

            // Тут в идеале показать тост: toast.error("Ошибка сохранения")
            console.error("Ошибка обновления плейлиста", err);
        },

        onSettled: () => {
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
            className="max-w-2xl mx-auto p-10 bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl space-y-6 text-zinc-100"
        >
            <h2 className="w-full text-4xl font-extrabold text-white">
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
                // Кнопка все равно будет disabled на долю секунды, но модалка закроется мгновенно
                disabled={isPending}
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-500"
            >
                {isPending ? "Изменения..." : "Сохранить изменения"}
            </button>
        </form>
    );
};