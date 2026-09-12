import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";
import { uploadPlaylistCover } from "./upload-playlists-cover.ts";
import { checkImageDimensions } from "./check-images-dimensions.ts"
import { playlistsKeys } from "../../../../shared/api/keys-factories/playlists-keys-factory.ts";

export type CreatePlaylistFormValues = {
    title: string;
    description?: string;
    file?: FileList | null;
};

export const useCreatePlaylistMutation = (onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: CreatePlaylistFormValues) => {
            const imageFile = formData.file?.[0];

            // 1. Проверяем картинку ДО создания плейлиста
            if (imageFile) {
                const { isValid, error } = await checkImageDimensions(imageFile);
                if (!isValid) {
                    throw new Error(error || "Невалидный файл");
                }
            }

            // 2. Создаем плейлист
            const createRes = await client.POST('/playlists', {
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

            if (createRes.error) throw createRes.error;
            const playlistId = createRes.data?.data?.id;
            if (!playlistId) throw new Error("Не удалось получить ID плейлиста");

            // 3. Загружаем обложку (БЕЗ try/catch — если упадёт, вся мутация выбросит ошибку)
            if (imageFile) {
                await uploadPlaylistCover(playlistId, imageFile);
            }

            return createRes.data;
        },
        onSuccess: () => {
            onSuccessCallback?.(); // Закрывает модалку ТОЛЬКО при полном успехе
        },
        onError: (err) => {
            console.error("Ошибка при создании плейлиста:", err);
        },
        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: playlistsKeys.all,
                refetchType: "all"
            });
        }
    });
};