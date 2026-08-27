import { useForm } from "react-hook-form";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import { client } from "../../../../shared/api/client.ts";

type FormValues = {
    title: string;
    description: string;
};

export const AddPlaylistForm = () => {
    const { handleSubmit, register, reset } = useForm<FormValues>();
    const queryClient = useQueryClient()

    const { mutate } = useMutation({
        mutationFn: async (formData: FormValues) => {
            const response = await client.POST('/playlists', {
                body: {
                    data: {
                        type: 'playlists',
                        attributes: {
                            title: formData.title,
                            description: formData.description || null
                        }
                    }
                }
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['playlists'],
                refetchType: 'all'
            })
            reset()
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
                className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white font-bold text-base rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
                Create
            </button>
        </form>
    );
};