import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';

export default function Dashboard() {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <Navbar />
      <NavButton />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>
    </div>
  );
}