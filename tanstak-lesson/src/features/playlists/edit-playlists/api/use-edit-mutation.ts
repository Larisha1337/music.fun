import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";
import { playlistsKeys } from "../../../../shared/api/keys-factories/playlists-keys-factory.ts";
import { checkImageDimensions } from "./check-square-images.ts"; // Проверь правильность пути к утилите
import type { FormValues } from "../ui/form/type/edit-type.ts";

export const useEditPlaylistMutation = (playlistId: string, onSuccessCallback?: () => void) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (formData: FormValues) => {
            const imageFile = formData.file?.[0];

            // 1. ПРОВЕРКА КАРТИНКИ ДО ЛЮБЫХ ЗАПРОСОВ К БЭКЕНДУ
            if (imageFile) {
                const { isValid, error } = await checkImageDimensions(imageFile);
                if (!isValid) {
                    throw new Error(error || "Невалидный файл изображения");
                }
            }

            // 2. Обновляем текстовую информацию
            const response = await client.PUT('/playlists/{playlistId}', {
                params: { path: { playlistId } },
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
                const message = apiError?.errors?.[0]?.detail || apiError?.title || "Ошибка обновления плейлиста";
                throw new Error(message);
            }

            // 3. Загружаем обложку
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
                    const message = apiError?.errors?.[0]?.detail || apiError?.title || "Ошибка загрузки обложки";
                    throw new Error(message);
                }
            }

            return response.data;
        },

        onSuccess: (_data, variables) => {
            const saved = JSON.parse(localStorage.getItem('playlist_descriptions') || '{}');
            if (variables.description) {
                saved[playlistId] = variables.description;
            } else {
                delete saved[playlistId];
            }
            localStorage.setItem('playlist_descriptions', JSON.stringify(saved));

            onSuccessCallback?.();
        },

        onError: (err: Error) => {
            console.error("Ошибка обновления плейлиста:", err.message);
        },

        onSettled: () => {
            queryClient.invalidateQueries({
                queryKey: playlistsKeys.all,
                refetchType: "all"
            });
        }
    });
};