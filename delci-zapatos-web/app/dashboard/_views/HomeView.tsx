'use client';

import Image from 'next/image';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { WelcomeSection } from '@/app/components/dashboard/WelcomeSection';
import { StatCard } from '@/app/components/dashboard/StatCard';
import { DashboardAccountsTable } from '@/app/components/dashboard/DashboardAccountsTable';
import { SupportPanel } from '@/app/components/dashboard/SupportPanel';

// TODO: Replace with API calls
// TODO: Add state for stats and accounts data
// const [stats, setStats] = useState({
//   inventory: { total: 0, description: 'productos en inventario/bodega' },
//   pendingAccounts: { total: 0, description: 'cuentas con saldos pendientes' },
//   clients: { total: 0, description: 'Total de clientes' },
//   paymentAlerts: { total: 0, description: 'cuentas con pagos proximos a vencer' }
// });
// const [accounts, setAccounts] = useState([]);

export default function Dashboard() {
  const { setView } = useDashboard();

  // TODO: Fetch dashboard stats from API
  // React.useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       const response = await fetch('/api/dashboard/stats');
  //       const data = await response.json();
  //       setStats(data);
  //     } catch (error) {
  //       console.error('Error fetching stats:', error);
  //     }
  //   };
  //   fetchStats();
  // }, []);

  // TODO: Fetch accounts from API
  // React.useEffect(() => {
  //   const fetchAccounts = async () => {
  //     try {
  //       const response = await fetch('/api/accounts');
  //       const data = await response.json();
  //       setAccounts(data);
  //     } catch (error) {
  //       console.error('Error fetching accounts:', error);
  //     }
  //   };
  //   fetchAccounts();
  // }, []);

  const handleCardAction = (action: string) => {
    console.log(`Action: ${action}`);
    switch (action) {
      case 'view-clients':
        setView({ key: 'clients' });
        break;
      case 'add-product':
        setView({ key: 'products_list' });
        break;
      case 'view-accounts':
        setView({ key: 'accounts' });
        break;
      case 'view-alerts':
        setView({ key: 'accounts' });
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleViewDetail = (accountId: string) => {
    setView({ key: 'accounts_detail', accountId });
  };

  // Icons for cards - using same icons as navbar
  const inventoryIcon = (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717761/inventario_sdhozi.svg"
      alt="Inventario"
      width={24}
      height={24}
      className="w-6 h-6"
    />
  );

  const accountsIcon = (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg"
      alt="Cuentas"
      width={24}
      height={24}
      className="w-6 h-6"
    />
  );

  const clientsIcon = (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/clientes_t9s3kf.svg"
      alt="Clientes"
      width={24}
      height={24}
      className="w-6 h-6"
    />
  );

  return (
    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        {/* Welcome Section */}
        <WelcomeSection />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Mi inventario"
            // TODO: Use API data: value={stats.inventory.total}
            value={0}
            // TODO: Use API data: description={stats.inventory.description}
            description="productos en inventario/bodega"
            icon={inventoryIcon}
            buttonText="Ver inventario"
            color="blue"
            onButtonClick={() => handleCardAction('add-product')}
          />

          <StatCard
            title="Saldos pendientes"
            // TODO: Use API data: value={stats.pendingAccounts.total}
            value={0}
            // TODO: Use API data: description={stats.pendingAccounts.description}
            description="cuentas con saldos pendientes"
            icon={accountsIcon}
            buttonText="Ver cuentas"
            color="orange"
            onButtonClick={() => handleCardAction('view-accounts')}
          />

          <StatCard
            title="Mis clientes"
            // TODO: Use API data: value={stats.clients.total}
            value={0}
            // TODO: Use API data: description={stats.clients.description}
            description="Total de clientes"
            icon={clientsIcon}
            buttonText="Ver clientes"
            color="green"
            onButtonClick={() => handleCardAction('view-clients')}
          />
        </div>

        {/* Accounts Table with Filters */}
        {/* TODO: Replace with API data: accounts={accounts} */}
        <DashboardAccountsTable
          accounts={[]}
          onViewAccount={handleViewDetail}
          className="mb-6 sm:mb-8"
        />

        {/* Support Panel */}
        <SupportPanel />
    </div>
  );
}