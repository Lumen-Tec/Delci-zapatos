'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, Search } from 'lucide-react';
import { useDashboardOptional } from '@/app/dashboard/DashboardContext';
import { Button } from '@/app/components/commons/Button';
import type { Client } from '@/models/client';
import type { AccountItem } from '@/models/account';
import { getNearestUpcomingPaymentDate, todayISO } from '@/lib/accountUtils';

type Draft = {
  clientId: string;
  biweeklyAmount: number;
  nextPaymentDate: string;
  initialPendingAmount: number;
  items: AccountItem[];
};

const DRAFT_KEY = 'delci_account_draft';

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export default function AccountsAddClientView() {
  const dashboard = useDashboardOptional();
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    // TODO: Cargar clientes desde API.
    // const response = await fetch('/api/clients', { cache: 'no-store' });
    // const data = (await response.json()) as Client[];
    // setClients(data);
    setClients([]);
  }, []);

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;

    return clients.filter(
      (client) => client.name.toLowerCase().includes(q) || client.phone.replace(/[-\s]/g, '').includes(q.replace(/[-\s]/g, ''))
    );
  }, [clients, query]);

  const handleSelect = (clientId: string) => {
    const stored = safeParse<Draft>(window.localStorage.getItem(DRAFT_KEY));
    const baseDraft: Draft =
      stored ?? {
        clientId: '',
        biweeklyAmount: 0,
        nextPaymentDate: getNearestUpcomingPaymentDate(todayISO()),
        initialPendingAmount: 0,
        items: [],
      };

    const nextDraft: Draft = { ...baseDraft, clientId };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));
    dashboard?.setView({ key: 'accounts_new' });
  };

  return (
    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 md:pb-8 w-full">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => dashboard?.setView({ key: 'accounts_new' })}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/80 border border-rose-200 text-rose-700 shadow-sm hover:bg-white transition-all"
              title="Volver"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Image
                src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg"
                alt="Cuentas"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Seleccionar cliente</h1>
              <p className="text-sm text-gray-600 mt-1">Busca y selecciona un cliente para la cuenta</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3 text-xs text-rose-700 mb-4">
        TODO: Integrar listado de clientes desde API.
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o telefono..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm"
            />
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          {filteredClients.length === 0 ? (
            <div className="text-sm text-gray-600">No se encontraron clientes.</div>
          ) : (
            filteredClients.map((client) => (
              <div key={client.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{client.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{client.phone}</div>
                </div>
                <Button type="button" size="sm" onClick={() => handleSelect(client.id)}>
                  Seleccionar
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
