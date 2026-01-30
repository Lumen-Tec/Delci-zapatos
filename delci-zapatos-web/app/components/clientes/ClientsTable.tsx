'use client';

import React, { useState } from 'react';

export interface Client {
  id: string;
  name: string;
  phone: string;
  totalProducts: number;
}

export interface ClientFilterState {
  clientId: string;
  clientName: string;
  clientPhone: string;
}

interface ClientsTableProps {
  clients: Client[];
  onViewProfile?: (clientId: string) => void;
  className?: string;
}

// Search icon component
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export const ClientsTable = React.memo<ClientsTableProps>(({
  clients,
  onViewProfile,
  className = '',
}) => {
  const [filters, setFilters] = useState<ClientFilterState>({
    clientId: '',
    clientName: '',
    clientPhone: '',
  });

  // Filter clients based on filters
  const filteredClients = clients.filter(client => {
    const matchesId = !filters.clientId || client.id.includes(filters.clientId);
    const matchesName = !filters.clientName || client.name.toLowerCase().includes(filters.clientName.toLowerCase());
    const matchesPhone = !filters.clientPhone || client.phone.replace(/[-\s]/g, '').includes(filters.clientPhone.replace(/[-\s]/g, ''));

    return matchesId && matchesName && matchesPhone;
  });

  const handleFilterChange = (field: keyof ClientFilterState, value: string) => {
    setFilters({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden ${className}`}>
      {/* Header with Filters */}
      <div className="px-4 sm:px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-pink-50/50 via-white to-rose-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              Clientes
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              <span className="font-medium text-pink-600">{filteredClients.length}</span> de {clients.length} clientes encontrados
            </p>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 lg:max-w-2xl">
            {/* ID Cliente */}
            <div>
              <label htmlFor="client-id" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  id="client-id"
                  type="text"
                  value={filters.clientId}
                  onChange={(e) => handleFilterChange('clientId', e.target.value)}
                  placeholder="Ej: 001"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* Nombre Cliente */}
            <div>
              <label htmlFor="client-name-filter" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Nombre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  id="client-name-filter"
                  type="text"
                  value={filters.clientName}
                  onChange={(e) => handleFilterChange('clientName', e.target.value)}
                  placeholder="Buscar cliente..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="client-phone-filter" className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Teléfono
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  id="client-phone-filter"
                  type="text"
                  value={filters.clientPhone}
                  onChange={(e) => handleFilterChange('clientPhone', e.target.value)}
                  placeholder="88881234"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 placeholder:text-gray-400 shadow-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-100">
            <tr>
              {/* ID - Hidden on mobile */}
              <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                ID
              </th>
              {/* Cliente - Always visible */}
              <th className="px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              {/* Teléfono - Hidden on mobile */}
              <th className="hidden lg:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Teléfono
              </th>
              {/* Total Productos - Hidden on mobile */}
              <th className="hidden md:table-cell px-4 sm:px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Productos
              </th>
              {/* Acción - Always visible */}
              <th className="px-4 sm:px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-50">
            {filteredClients.map((client, index) => (
              <tr
                key={client.id}
                className={`hover:bg-pink-50/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
              >
                {/* ID - Hidden on mobile */}
                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-100 text-sm font-mono font-medium text-gray-700">
                    #{client.id}
                  </span>
                </td>
                {/* Cliente - Always visible, shows more info on mobile */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">{client.name}</span>
                    {/* Show ID and phone on mobile as subtitle */}
                    <span className="md:hidden text-xs text-gray-500 mt-0.5">
                      #{client.id} · {client.phone}
                    </span>
                  </div>
                </td>
                {/* Teléfono - Hidden on mobile */}
                <td className="hidden lg:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-700">
                    {client.phone}
                  </span>
                </td>
                {/* Total Productos - Hidden on mobile */}
                <td className="hidden md:table-cell px-4 sm:px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-pink-50 text-sm font-semibold text-pink-700">
                    {client.totalProducts}
                  </span>
                </td>
                {/* Acción - Always visible */}
                <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => onViewProfile?.(client.id)}
                    className="inline-flex items-center justify-center px-3 py-2 rounded-xl text-pink-600 hover:text-white bg-pink-50 hover:bg-pink-500 transition-all duration-200 shadow-sm hover:shadow-md text-xs font-medium"
                    title="Ver perfil"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver perfil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div className="px-4 sm:px-6 py-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-4 shadow-sm">
            <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            No hay clientes
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            No se encontraron clientes con los filtros seleccionados. Intenta ajustar tus criterios de búsqueda.
          </p>
        </div>
      )}
    </div>
  );
});

ClientsTable.displayName = 'ClientsTable';
