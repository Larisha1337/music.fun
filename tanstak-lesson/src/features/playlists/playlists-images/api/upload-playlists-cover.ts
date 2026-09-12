import { client } from "../../../../shared/api/client.ts";

export const uploadPlaylistCover = async (playlistId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await client.POST('/playlists/{playlistId}/images/main', {
        params: { path: { playlistId } },
        body: formData as any,
        bodySerializer: (body) => body as any,
    });

    if (response.error) throw response.error;
    return response.data;
};