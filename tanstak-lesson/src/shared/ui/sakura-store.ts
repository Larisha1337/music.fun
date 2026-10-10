import { useSyncExternalStore } from 'react'

const KEY = 'ui-sakura'

let enabled = (() => {
    try {
        return localStorage.getItem(KEY) !== 'off'
    } catch {
        return true
    }
})()

const listeners = new Set<() => void>()

export const setSakura = (value: boolean) => {
    enabled = value
    try {
        localStorage.setItem(KEY, value ? 'on' : 'off')
    } catch {
        // хранилище недоступно: настройка действует до перезагрузки
    }
    listeners.forEach((l) => l())
}

export const useSakuraEnabled = () =>
    useSyncExternalStore(
        (cb) => {
            listeners.add(cb)
            return () => {
                listeners.delete(cb)
            }
        },
        () => enabled
    )