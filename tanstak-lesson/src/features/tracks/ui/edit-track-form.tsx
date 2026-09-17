import { useForm } from "react-hook-form";
import { useUpdateTrackMutation } from "../api/use-update-track-mutation.ts";

type FormValues = {
    title: string;
};

type Props = {
    trackId: string;
    initialTitle: string;
    onSuccess: () => void;
    onCancel?: () => void;
};

export const EditTrackForm = ({ trackId, initialTitle, onSuccess, onCancel }: Props) => {
    const {
        handleSubmit,
        register,
        formState: { isSubmitting, errors }
    } = useForm<FormValues>({
        defaultValues: { title: initialTitle }
    });

    const { mutate, isPending } = useUpdateTrackMutation(onSuccess);
    const isLoading = isPending || isSubmitting;

    const onSubmit = (formData: FormValues) => {
        mutate({ trackId, title: formData.title });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <h2 className="w-full text-3xl font-extrabold text-white text-center">
                Edit Track
            </h2>

            <div className="space-y-2">
                <label htmlFor="track-title" className="block text-base font-medium text-zinc-300">
                    Title
                </label>
                <input
                    {...register('title', { required: true })}
                    id="track-title"
                    type="text"
                    disabled={isLoading}
                    className="w-full px-5 py-3.5 bg-[#27272a]/70 border border-[#3f3f46] rounded-xl text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                />
                {errors.title && (
                    <p className="text-red-400 text-xs font-medium mt-1">Название обязательно</p>
                )}
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-[#27272a] hover:bg-[#3f3f46] text-zinc-200 text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                        Отмена
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                    {isLoading ? "Сохранение..." : "Сохранить"}
                </button>
            </div>
        </form>
    );
};