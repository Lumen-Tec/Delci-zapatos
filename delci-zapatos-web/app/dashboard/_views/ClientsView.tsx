'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useDashboard } from '@/app/dashboard/DashboardContext';
import { ClientsTable } from '@/app/components/clients/ClientsTable';
import { ClientProfileModal } from '@/app/components/clients/ClientProfileModal';
import { Button } from '@/app/components/commons/Button';
import { Plus } from 'lucide-react';
import { CreateClientModal } from '@/app/components/clients/CreateClientModal';
import type { Client } from '@/models/client';

export function ClientsView() {
  const { setView } = useDashboard();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clients from API
  React.useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/clients');
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || 'Error al cargar clientes');
          return;
        }
        
        setClients(data.clients || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError('Error de conexión al servidor');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClients();
  }, []);

  const handleViewProfile = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
    }
  };

  const handleClientCreated = (newClient: Client) => {
    setClients((prevClients) => [...prevClients, newClient]);
    setIsCreateModalOpen(false);
  };

  const handleClientUpdated = (updatedClient: Client) => {
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
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-16 rounded-t-2xl border border-gray-100 bg-gray-50"></div>
            <div className="h-96 rounded-b-2xl border-x border-b border-gray-100 bg-white">
              <div className="space-y-3 p-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-10 rounded-lg bg-gray-100" />
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 animate-content-fade-in">
            <p className="text-red-600">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="animate-content-fade-in">
            <ClientsTable
              clients={clients}
              onViewProfile={handleViewProfile}
              className="mb-6 sm:mb-8"
            />
          </div>
        )}
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
      />
    </div>
  );
}

export default ClientsView;
