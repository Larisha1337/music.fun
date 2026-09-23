import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
})

/**
 * Загрузить файл в R2
 * @param {Express.Multer.File} file - файл из req.file
 * @param {string} folder - папка внутри бакета ('avatars', 'tracks', 'track-covers')
 */
export const uploadToR2 = async (file, folder = 'misc') => {
    const extension = file.originalname.split('.').pop()
    const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`

    await r2Client.send(
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        })
    )

    return `${process.env.R2_PUBLIC_DOMAIN}/${key}`
}

/**
 * Удалить файл из R2 по его публичному URL
 * @param {string} fileUrl
 */
export const deleteFromR2 = async (fileUrl) => {
    if (!fileUrl || !fileUrl.startsWith(process.env.R2_PUBLIC_DOMAIN)) return

    const key = fileUrl.replace(`${process.env.R2_PUBLIC_DOMAIN}/`, '')

    try {
        await r2Client.send(
            new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
            })
        )
    } catch (error) {
        console.error('[R2 Delete Error]:', error)
    }
}