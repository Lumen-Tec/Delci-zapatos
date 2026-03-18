import { type NextRequest } from 'next/server'
import { updateSession } from '@/app/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Intercepta todas las rutas excepto archivos estáticos:
         * _next/static, _next/image, favicon.ico, imágenes
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
