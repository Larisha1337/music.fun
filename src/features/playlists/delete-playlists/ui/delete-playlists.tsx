import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";
import {playlistsKeys} from "../../../../shared/api/keys-factories/playlists-keys-factory.ts";

type Props = {
    playlistId: string;
    title: string;
    onCancel: () => void;
    onSuccess: () => void;
};

export const DeletePlaylistView = ({ playlistId, title, onCancel, onSuccess }: Props) => {
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            const response = await client.DELETE('/playlists/{playlistId}', {
                params: {
                    path: { playlistId }
                }
            });

            if (response.error) throw response.error;
            return response.data;
        },

        // ⚡️ 1. Срабатывает МОМЕНТАЛЬНО при нажатии на "Удалить"
        onMutate: async () => {
            // Отменяем текущие запросы, чтобы они не перезаписали кэш
            await queryClient.cancelQueries({ queryKey: playlistsKeys.all });

            // Делаем слепок старых данных для отката в случае ошибки
            const previousPlaylists = queryClient.getQueryData(playlistsKeys.all);

            const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
            const previousDescription = saved[playlistId];

            // 🚀 ОПТИМИСТИЧНО УДАЛЯЕМ ПЛЕЙЛИСТ ИЗ КЭША
            queryClient.setQueriesData({ queryKey: playlistsKeys.all }, (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    data: oldData.data.filter((playlist: any) => playlist.id !== playlistId)
                };
            });

            // 🚀 УДАЛЯЕМ ОПИСАНИЕ ИЗ LOCALSTORAGE
            delete saved[playlistId];
            localStorage.setItem('playlist_descriptions', JSON.stringify(saved));

            // 💡 Моментально закрываем модалку, не дожидаясь ответа сервера
            onSuccess();

            return { previousPlaylists, previousDescription };
        },

        // 🚑 2. Если бэкенд упал — откатываем всё назад
        onError: (err, _variables, context) => {
            if (context?.previousPlaylists) {
                queryClient.setQueriesData({ queryKey: playlistsKeys.all }, context.previousPlaylists);
            }

            if (context !== undefined) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                if (context.previousDescription !== undefined) {
                    saved[playlistId] = context.previousDescription;
                    localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
                }
            }

            console.error("Ошибка удаления плейлиста", err);
        }
    });

    const handleDelete = () => {
        mutate();
    };

    return (
        <div className="space-y-5 text-center">
            <h3 className="text-2xl font-extrabold text-white">
                Удалить плейлист?
            </h3>

            <p className="text-zinc-400 text-sm leading-relaxed">
                Вы точно хотите удалить плейлист «<span className="text-white font-semibold">{title}</span>»? <br />
                Это действие нельзя будет отменить.
            </p>

            <div className="flex items-center justify-center gap-4 pt-2">
                <button
                    onClick={onCancel}
                    disabled={isPending}
                    className="px-6 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-200 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                    Назад
                </button>

                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                    {isPending ? "Удаление..." : "Удалить"}
                </button>
            </div>
        </div>
    );
}; 