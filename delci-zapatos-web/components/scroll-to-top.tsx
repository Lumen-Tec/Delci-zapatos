'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export function ScrollToTop() {
    const pathname = usePathname()
    const page = useSearchParams().get('page')

    useEffect(() => {
        const previous = window.history.scrollRestoration
        window.history.scrollRestoration = 'manual'
        return () => { window.history.scrollRestoration = previous }
    }, [])

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }))
        return () => window.cancelAnimationFrame(frame)
    }, [pathname, page])

    return null
}
