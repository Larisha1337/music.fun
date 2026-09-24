import mongoose from 'mongoose'

const trackSchema = new mongoose.Schema({
    userId: { type: String, required: false, default: 'system' }, // 👈 false, чтобы у сида не требовался ID юзера
    title: { type: String, required: true },
    artist: { type: String, default: '' },
    fileUrl: { type: String, required: true },
    coverUrl: { type: String, default: null },
    fileSize: { type: Number },
    isSeed: { type: Boolean, default: false }, // 👈 true для массовой загрузки
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Track', trackSchema)