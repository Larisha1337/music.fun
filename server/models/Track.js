import mongoose from 'mongoose'

const trackSchema = new mongoose.Schema({
    userId: { type: String, required: false, default: 'system' },
    title: { type: String, required: true },
    artist: { type: String, default: '' },
    fileUrl: { type: String, required: false, default: '' },
    coverUrl: { type: String, default: null },
    fileSize: { type: Number },
    isSeed: { type: Boolean, default: false },
    isStreamed: { type: Boolean, default: false },
    youtubeId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
    bpm: { type: Number, default: null },
    musicalKey: { type: String, default: null },
})

trackSchema.index({ userId: 1, createdAt: -1 })
trackSchema.index({ title: 1, artist: 1 })

export default mongoose.model('Track', trackSchema)