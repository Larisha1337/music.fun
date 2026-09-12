const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: 'Нет токена' })
    }

    const token = authHeader.split(' ')[1]
    console.log('1. Токен:', token)
    console.log('🔑 Мой API ключ:', process.env.INCUBATOR_API_KEY)

    // ДОБАВЬ ЭТОТ ЛОГ: посмотрим, как выглядит токен
    console.log('1. Токен, который пришел на бэк:', token)

    try {
        const response = await fetch('https://musicfun.it-incubator.app/api/1.0/auth/me', {
            headers: {
                Authorization: `Bearer ${token}`,
                // Притворяемся браузером:
                'Origin': 'http://localhost:5173', // Укажи тут порт своего фронтенда!
                'Referer': 'http://localhost:5173/',
                'Api-key': 'a03aefd6-d7fb-49bc-96e8-93041c87a1a7'
            }
        })

        // ДОБАВЬ ЭТИ ЛОГИ: посмотрим, что ответил musicfun
        console.log('2. Статус от musicfun:', response.status)
        const textResponse = await response.text() // читаем ответ как текст
        console.log('3. Тело ответа от musicfun:', textResponse)

        if (!response.ok) {
            return res.status(401).json({ message: 'Невалидный токен' })
        }

        const user = JSON.parse(textResponse)
        req.userId = user.userId
        next()
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Ошибка проверки токена' })
    }
}

export default authMiddleware