import 'dotenv/config'
import mongoose from 'mongoose'
import Track from '../models/Track.js'

await mongoose.connect(process.env.MONGO_URI)

const res = await Track.updateMany(
    { fileUrl: /googlevideo\.com|youtube\.com/ },
    { $set: { fileUrl: '', isStreamed: true } }
)

console.log(`Исправлено треков: ${res.modifiedCount}`)
process.exit(0)