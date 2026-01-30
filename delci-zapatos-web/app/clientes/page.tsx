'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Navbar } from '@/app/components/shared/Navbar';
import { NavButton } from '@/app/components/shared/Navbutton';
import { ClientsTable } from '@/app/components/clientes/ClientsTable';
import { ClientProfileModal } from '@/app/components/clientes/ClientProfileModal';
import { Footer } from '@/app/components/shared/Footer';
import { mockClients } from '@/app/lib/mockData';
import { Button } from '@/app/components/shared/Button';
import { Plus } from 'lucide-react';
import { CreateClientModal } from '@/app/components/clientes/CreateClientModal';
import { Client } from '@/app/components/clientes/ClientsTable';

export default function ClientsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>(mockClients);

  const handleViewProfile = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
    }
  };

  const handleClientCreated = (newClient: any) => {
    console.log('New client created:', newClient);
    // TODO: Add client to state or refresh list
  };

  const handleViewAccount = (clientId: string) => {
    console.log(`View account for client: ${clientId}`);
    // TODO: Navigate to accounts page filtered by client
    // Por ahora, solo mostramos en consola
    // Más adelante se puede implementar la navegación a /cuentas?cliente=${clientId}
  };

  const handleClientUpdated = (updatedClient: Client) => {
    setClients(prevClients =>
      prevClients.map(client =>
        client.id === updatedClient.id ? updatedClient : client
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-100 via-pink-50 to-rose-100 relative">
      <Navbar />
      <NavButton />

      <div className="flex-grow relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
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
        </div>

        {/* Clients Table */}
        <ClientsTable
          clients={clients}
          onViewProfile={handleViewProfile}
          className="mb-6 sm:mb-8"
        />
      </div>

      <Footer />

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
