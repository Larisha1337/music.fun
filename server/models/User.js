import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('User', userSchema)