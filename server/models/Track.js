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
    deezerId: { type: String, default: null, index: true },
    // Для копий-обрезков: из какого трека вырезано и какой отрезок
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', default: null, index: true },
    // Для сборок из отрезков: из чего склеен трек
    sources: {
        type: [{
            _id: false,
            trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track' },
            start: Number,
            end: Number,
        }],
        default: undefined,
    },
    trimStart: { type: Number, default: null },
    trimEnd: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
    bpm: { type: Number, default: null },
    musicalKey: { type: String, default: null },
    // Огибающая громкости для волны в плеере. В списках не отдаётся (select: false)
    peaks: { type: [Number], default: undefined, select: false },
    analyzedAt: { type: Date, default: null },
})

trackSchema.index({ userId: 1, createdAt: -1 })
trackSchema.index({ title: 1, artist: 1 })

export default mongoose.model('Track', trackSchema)