import mongoose from 'mongoose'

const trackSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Track', trackSchema)