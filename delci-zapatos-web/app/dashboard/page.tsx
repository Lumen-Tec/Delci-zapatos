'use client';

import { DashboardContent } from '@/app/dashboard/DashboardContent';
import { DashboardProvider } from '@/app/dashboard/DashboardContext';

export default function DashboardPage() {
	return (
		<DashboardProvider initialView={{ key: 'home' }}>
			<DashboardContent />
		</DashboardProvider>
	);
}
