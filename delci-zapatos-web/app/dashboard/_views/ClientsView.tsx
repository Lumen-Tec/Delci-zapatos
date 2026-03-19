'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ClientsTable } from '@/app/components/clients/ClientsTable';
import { ClientProfileModal } from '@/app/components/clients/ClientProfileModal';
import { Button } from '@/app/components/commons/Button';
import { Plus } from 'lucide-react';
import { CreateClientModal } from '@/app/components/clients/CreateClientModal';
import type { Client } from '@/models/client';

export function ClientsView() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  // TODO: Load clients from API
  // React.useEffect(() => {
  //   const fetchClients = async () => {
  //     try {
  //       const response = await fetch('/api/clients');
  //       const data = await response.json();
  //       setClients(data);
  //     } catch (error) {
  //       console.error('Error fetching clients:', error);
  //     }
  //   };
  //   fetchClients();
  // }, []);

  const handleViewProfile = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
    }
  };

  const handleClientCreated = (newClient: Client) => {
    // TODO: Save client to API
    // const saveClient = async () => {
    //   try {
    //     const response = await fetch('/api/clients', {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify(newClient)
    //     });
    //     const savedClient = await response.json();
    //     setClients((prevClients) => [...prevClients, savedClient]);
    //   } catch (error) {
    //     console.error('Error saving client:', error);
    //   }
    // };
    // saveClient();
    
    setClients((prevClients) => [...prevClients, newClient]);
    setIsCreateModalOpen(false);
  };

  const handleViewAccount = (clientId: string) => {
    // TODO: Fetch accounts from API
    // const fetchAccounts = async () => {
    //   try {
    //     const response = await fetch('/api/accounts');
    //     const accounts = await response.json();
    //     const account = accounts.find(a => a.clientId === clientId);
    //     if (account) {
    //       setSelectedClient(null);
    //       router.push(`/cuentas/${account.id}`);
    //     } else {
    //       setSelectedClient(null);
    //       router.push('/cuentas/nueva');
    //     }
    //   } catch (error) {
    //     console.error('Error fetching accounts:', error);
    //   }
    // };
    // fetchAccounts();
    
    // For now, redirect to create new account
    setSelectedClient(null);
    router.push('/cuentas/nueva');
  };

  const handleClientUpdated = (updatedClient: Client) => {
    // TODO: Update client in API
    // const updateClient = async () => {
    //   try {
    //     const response = await fetch(`/api/clients/${updatedClient.id}`, {
    //       method: 'PUT',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify(updatedClient)
    //     });
    //     const savedClient = await response.json();
    //     setClients(prevClients =>
    //       prevClients.map(client =>
    //         client.id === savedClient.id ? savedClient : client
    //       )
    //     );
    //   } catch (error) {
    //     console.error('Error updating client:', error);
    //   }
    // };
    // updateClient();
    
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === updatedClient.id ? updatedClient : client
      )
    );
  };

  return (
    <div className="w-full">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                <Image
                  src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/clientes_t9s3kf.svg"
                  alt="Clientes"
                  width={24}
                  height={24}
                  className="w-6 h-6 text-white"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Clientes</h1>
                <p className="text-sm text-gray-600 mt-1">Gestiona y visualiza la información de todos tus clientes</p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-fit self-end flex items-center justify-center gap-2 py-3 px-6 sm:py-2 sm:px-4 text-base sm:text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all"
              size="lg"
            >
              <Plus className="w-6 h-6 sm:w-5 sm:h-5" />
              Crear Cliente
            </Button>
          </div>
        </div>

        {/* Clients Table */}
        <ClientsTable
          clients={clients}
          onViewProfile={handleViewProfile}
          className="mb-6 sm:mb-8"
        />
      </div>

      {/* Create Client Modal */}
      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onClientCreated={handleClientCreated}
      />

      {/* Client Profile Modal */}
      <ClientProfileModal
        isOpen={!!selectedClient}
        onClose={() => setSelectedClient(null)}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
        onViewAccount={handleViewAccount}
      />
    </div>
  );
}

export default ClientsView;
