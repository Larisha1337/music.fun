export const validateImageDimensions = (file: File, minSize: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(img.src);
            if (img.width !== img.height) {
                reject(new Error("Изображение должно быть квадратным"));
            } else if (img.width < minSize) {
                reject(new Error(`Минимальный размер изображения ${minSize}x${minSize}px`));
            } else {
                resolve();
            }
        };

        img.onerror = () => reject(new Error("Ошибка чтения файла изображения"));
    });
};