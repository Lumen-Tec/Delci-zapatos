import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAccountById } from '@/repositories/accountsRepository'
import { getErrorMessage } from '@/utils/parsers/errors'

const SELECTED_ACCOUNT_COOKIE = 'delci_selected_account'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
    try {
        const body = await request.json() as { accountId?: unknown }
        if (typeof body.accountId !== 'string' || !UUID_PATTERN.test(body.accountId)) {
            return NextResponse.json({ ok: false, error: 'accountId inválido' }, { status: 400 })
        }

        const response = NextResponse.json({ ok: true })
        response.cookies.set(SELECTED_ACCOUNT_COOKIE, body.accountId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 30,
        })
        return response
    } catch (error: unknown) {
        return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}

export async function GET() {
    try {
        const accountId = (await cookies()).get(SELECTED_ACCOUNT_COOKIE)?.value
        if (!accountId || !UUID_PATTERN.test(accountId)) {
            return NextResponse.json({ ok: false, error: 'Selecciona una cuenta desde el dashboard.' }, { status: 404 })
        }
        const account = await getAccountById(accountId)
        return NextResponse.json({ ok: true, account })
    } catch (error: unknown) {
        return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status: 500 })
    }
}
