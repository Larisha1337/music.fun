export type FormValues = {
    title: string;
    description: string;
    file?: FileList | null;
};

export type Props = {
    playlistId: string;
    initialTitle?: string;
    initialDescription?: string;
    initialCoverUrl?: string | null;
    onSuccess?: () => void;
    onCancel?: () => void;
};