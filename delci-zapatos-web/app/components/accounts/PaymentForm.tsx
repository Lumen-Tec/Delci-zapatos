'use client';

import React from 'react';
import { Bell, CreditCard } from 'lucide-react';
import { Button } from '@/app/components/shared/Button';
import { InputField } from '@/app/components/shared/InputField';
import type { Account } from '@/app/models/account';

interface PaymentFormProps {
  account: Account;
  paymentAmount: string;
  onPaymentAmountChange: (value: string) => void;
  onRegisterPayment: () => void;
  onNotifyClient?: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  account,
  paymentAmount,
  onPaymentAmountChange,
  onRegisterPayment,
  onNotifyClient,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Registrar pago</h2>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Fecha programada</label>
          <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm shadow-sm">
            {account.nextPaymentDate ?? '-'}
          </div>
        </div>

        <InputField
          label="Monto"
          type="number"
          value={paymentAmount}
          onChange={onPaymentAmountChange}
          placeholder={account.biweeklyAmount ? String(account.biweeklyAmount) : 'Monto'}
        />

        <div className="flex flex-col gap-2">
          <Button onClick={onRegisterPayment} variant="primary">
            <CreditCard className="w-5 h-5 mr-2" />
            Marcar pagado
          </Button>
          {onNotifyClient && (
            <Button onClick={onNotifyClient} variant="secondary">
              <Bell className="w-5 h-5 mr-2" />
              Notificar cliente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
