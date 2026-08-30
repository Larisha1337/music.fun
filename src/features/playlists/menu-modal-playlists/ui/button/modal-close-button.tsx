type Props = {
    onClick: () => void;
};

export const ModalCloseButton = ({ onClick }: Props) => {
    return (
        <button
            onClick={onClick}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold cursor-pointer transition-colors"
        >
            ✕
        </button>
    );
};