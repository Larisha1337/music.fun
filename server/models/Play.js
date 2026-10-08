import mongoose from 'mongoose'

const playSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    playedAt: { type: Date, default: Date.now },
})

playSchema.index({ userId: 1, playedAt: -1 })
// История хранится 90 дней, потом Mongo удаляет записи сам
playSchema.index({ playedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

export default mongoose.model('Play', playSchema)