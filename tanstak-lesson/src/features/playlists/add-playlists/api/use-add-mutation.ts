import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";
import { playlistsKeys } from "../../../../shared/api/keys-factories/playlists-keys-factory.ts";
import { checkImageDimensions } from "../../playlists-images/api/check-images-dimensions.ts";

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

            // 1. Дополнительная валидация на сервере/перед отправкой
            if (imageFile) {
                const { isValid, error } = await checkImageDimensions(imageFile);
                if (!isValid) {
                    throw new Error(error || "Картинка должна быть квадратной (1:1)");
                }
            }

            // 2. Создание плейлиста
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

            if (response.error) {
                const apiError = response.error as any;
                const message = apiError?.errors?.[0]?.detail || apiError?.title || "Ошибка создания плейлиста";
                throw new Error(message);
            }

            const playlistId = response.data?.data?.id;
            if (!playlistId) {
                throw new Error("Не удалось получить ID созданного плейлиста");
            }

            // 3. Загрузка обложки
            if (imageFile) {
                const imageFormData = new FormData();
                imageFormData.append("file", imageFile);

                const imageResponse = await client.POST('/playlists/{playlistId}/images/main', {
                    params: { path: { playlistId } },
                    body: imageFormData as any,
                    bodySerializer: (body) => body as any,
                });

                if (imageResponse.error) {
                    const apiError = imageResponse.error as any;
                    const message = apiError?.errors?.[0]?.detail || apiError?.title || "Некорректный файл изображения";
                    throw new Error(message);
                }
            }

            return response.data;
        },

        onSuccess: (data: any, variables) => {
            const realId = data?.data?.id || data?.id;

            if (realId && variables.description) {
                const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
                saved[realId] = variables.description;
                localStorage.setItem('playlist_descriptions', JSON.stringify(saved));
            }

            // Обновляем списки ТОЛЬКО при успешном создании
            queryClient.invalidateQueries({
                queryKey: playlistsKeys.all,
                refetchType: "all"
            });

            onSuccessCallback?.();
        },

        onError: (err: Error) => {
            console.error("Ошибка создания плейлиста:", err.message);
        }
        // БЛОК onSettled УДАЛЕН!
    });
};