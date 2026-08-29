export type FormValues = {
    title: string;
    description: string;
};

export type Props = {
    playlistId: string;
    initialTitle?: string;
    initialDescription?: string;
    onSuccess?: () => void;
};