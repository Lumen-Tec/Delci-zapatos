import { Suspense } from 'react'
import { AccountDetails, AccountDetailsLoading } from '@/components/accounts/account-details'

export default function AccountDetailsPage() {
    return <Suspense fallback={<AccountDetailsLoading />}><AccountDetails /></Suspense>
}
