import axios from 'axios'
import { localStorageKey } from '@/shared/config/local-storage-key.ts'

export const api = axios.create({
    baseURL: import.meta.env.VITE_MY_BACKEND_URL
        ? `${import.meta.env.VITE_MY_BACKEND_URL}/api`
        : 'http://localhost:5000/api',
})

// Автоматически цепляем токен из localStorageKey.accessToken к каждому запросу
api.interceptors.request.use((config) => {
    const token = localStorage.getItem(localStorageKey.accessToken)

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})