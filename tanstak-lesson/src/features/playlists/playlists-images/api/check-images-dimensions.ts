export const checkImageDimensions = (file: File): Promise<{ isValid: boolean; error?: string }> => {
    return new Promise((resolve) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            if (img.width !== img.height) {
                resolve({ isValid: false, error: "Изображение должно быть квадратным (1:1)" });
            } else if (img.width < 500 || img.height < 500) {
                resolve({ isValid: false, error: "Размер изображения должен быть не менее 500x500 px" });
            } else {
                resolve({ isValid: true });
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve({ isValid: false, error: "Ошибка чтения файла изображения" });
        };

        img.src = objectUrl;
    });
};