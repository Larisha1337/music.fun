import mongoose from 'mongoose'

const playlistSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverUrl: { type: String, default: null },

    // Ссылки на твои треки
    tracks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],

    // Привязываем к конкретному юзеру
    ownerId: { type: String, required: true }
}, { timestamps: true })

export default mongoose.model('Playlist', playlistSchema)