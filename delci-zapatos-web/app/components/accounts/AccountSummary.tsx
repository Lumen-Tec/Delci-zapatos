'use client';

import React from 'react';
import { formatCurrency } from '@/app/lib/accountUtils';
import type { Account } from '@/app/models/account';

interface AccountSummaryProps {
  account: Account;
}

export const AccountSummary: React.FC<AccountSummaryProps> = ({ account }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Resumen</h2>
      </div>
      <div className="p-6 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold text-gray-900">{formatCurrency(account.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Pagado</span>
          <span className="font-semibold text-gray-900">{formatCurrency(account.totalPaid)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Pendiente</span>
          <span className="font-semibold text-gray-900">{formatCurrency(account.remainingAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Próximo pago</span>
          <span className="font-semibold text-gray-900">{account.nextPaymentDate ?? '-'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Último pago</span>
          <span className="font-semibold text-gray-900">{account.lastPaymentDate ?? '-'}</span>
        </div>
      </div>
    </div>
  );
};
