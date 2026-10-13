import { Suspense } from 'react'
import { AccountsDashboard, AccountsDashboardLoading } from '@/components/dashboard/accounts-dashboard'

export default function Home() {
  return <Suspense fallback={<AccountsDashboardLoading />}><AccountsDashboard /></Suspense>
}
