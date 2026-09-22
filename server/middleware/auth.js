import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Нет токена' })
    }

    const token = authHeader.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // 👈 Извлекаем ID из любого возможного поля токена
        const extractedId = decoded.userId || decoded.id || decoded._id

        if (!extractedId) {
            console.error('[authMiddleware Error] Токен не содержит ID пользователя:', decoded)
            return res.status(401).json({ message: 'Некорректная структура токена' })
        }

        // Гарантируем, что req.userId — это всегда строка
        req.userId = extractedId.toString()
        next()
    } catch (error) {
        res.status(401).json({ message: 'Невалидный токен' })
    }
}

export default authMiddleware