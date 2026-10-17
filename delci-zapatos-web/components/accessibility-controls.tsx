'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { Dialog } from '@base-ui/react/dialog'
import { ALargeSmall, Minus, Plus, RotateCcw, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const FONT_SIZE_KEY = 'delci-font-size'
const FONT_SIZE_EVENT = 'delci-font-size-change'
const MIN_FONT_SIZE = 100
const MAX_FONT_SIZE = 150
const FONT_SIZE_STEP = 5
let sessionFontSize: number | undefined

function getFontSize(): number {
    if (sessionFontSize !== undefined) return sessionFontSize
    try {
        const stored = Number(window.localStorage.getItem(FONT_SIZE_KEY))
        if ([100, 125, 150].includes(stored)) return stored
    } catch { /* La preferencia funciona también si el almacenamiento está bloqueado. */ }
    return MIN_FONT_SIZE
}

function subscribe(onChange: () => void) {
    function onStorage(event: StorageEvent) {
        if (event.key === FONT_SIZE_KEY || event.key === null) {
            sessionFontSize = undefined
            onChange()
        }
    }
    window.addEventListener(FONT_SIZE_EVENT, onChange)
    window.addEventListener('storage', onStorage)
    return () => {
        window.removeEventListener(FONT_SIZE_EVENT, onChange)
        window.removeEventListener('storage', onStorage)
    }
}

function changeFontSize(size: number) {
    sessionFontSize = size
    try {
        window.localStorage.setItem(FONT_SIZE_KEY, String(size))
    } catch { /* Se conserva el tamaño durante la sesión. */ }
    window.dispatchEvent(new Event(FONT_SIZE_EVENT))
}

function getServerFontSize() { return MIN_FONT_SIZE }

export function AccessibilityControls() {
    const pathname = usePathname()
    const fontSize = useSyncExternalStore(subscribe, getFontSize, getServerFontSize)

    useEffect(() => {
        document.documentElement.style.fontSize = `${fontSize}%`
    }, [fontSize])

    return <Dialog.Root>
        <Dialog.Trigger render={<Button variant="outline" size="icon-lg" />} aria-label="Accesibilidad: tamaño de letra" title="Cambiar tamaño de letra" className={cn('fixed right-5 z-30 size-12 rounded-full shadow-lg sm:hidden', pathname === '/' ? 'bottom-28' : 'bottom-10')}>
            <ALargeSmall className="size-5" />
        </Dialog.Trigger>
        <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/45" />
            <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
                <Dialog.Popup className="max-h-[90dvh] w-full max-w-sm overflow-y-auto rounded-2xl border bg-card p-5 shadow-xl outline-none">
                    <div className="flex items-center justify-between gap-3">
                        <Dialog.Title className="text-lg font-semibold">Tamaño de letra</Dialog.Title>
                        <Dialog.Close aria-label="Cerrar accesibilidad" className={buttonVariants({ variant: 'ghost', size: 'icon' })}><X /></Dialog.Close>
                    </div>
                    <Dialog.Description className="mt-2 text-sm text-muted-foreground">Ajusta la letra de todas las páginas. Tu preferencia se guardará en este dispositivo.</Dialog.Description>
                    <div className="mt-5 flex items-center justify-between gap-2">
                        <Button type="button" variant="outline" size="icon-lg" className="size-10" aria-label="Reducir tamaño de letra" disabled={fontSize === MIN_FONT_SIZE} onClick={() => changeFontSize(fontSize - FONT_SIZE_STEP)}><Minus /></Button>
                        <output aria-live="polite" aria-label="Tamaño actual de letra" className="text-lg font-semibold">{fontSize}%</output>
                        <Button type="button" variant="outline" size="icon-lg" className="size-10" aria-label="Aumentar tamaño de letra" disabled={fontSize === MAX_FONT_SIZE} onClick={() => changeFontSize(fontSize + FONT_SIZE_STEP)}><Plus /></Button>
                    </div>
                    <Button type="button" variant="outline" className="mt-4 h-auto min-h-9 w-full py-2 whitespace-normal" disabled={fontSize === MIN_FONT_SIZE} onClick={() => changeFontSize(MIN_FONT_SIZE)}><RotateCcw data-icon="inline-start" /> Restablecer tamaño</Button>
                </Dialog.Popup>
            </Dialog.Viewport>
        </Dialog.Portal>
    </Dialog.Root>
}
