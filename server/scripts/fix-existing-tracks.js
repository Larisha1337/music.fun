import 'dotenv/config'
import mongoose from 'mongoose'
import Track from '../models/Track.js'

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI)
    const tracks = await Track.find()

    for (const track of tracks) {
        if ((!track.artist || track.artist === '') && track.title.includes(' — ')) {
            const [title, artist] = track.title.split(' — ')
            track.title = title.trim()
            track.artist = artist.trim()
            await track.save()
            console.log(`Updated: ${track.title} | Artist: ${track.artist}`)
        }
    }

    console.log('Готово!')
    process.exit(0)
}

run()