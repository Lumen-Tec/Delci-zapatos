'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/app/components/shared/Button';
import { InputField } from '@/app/components/shared/InputField';
import { todayISO } from '@/app/lib/accountUtils';
import type { Account } from '@/app/models/account';

interface PaymentFormProps {
  account: Account;
  paymentDate: string;
  paymentAmount: string;
  onPaymentDateChange: (value: string) => void;
  onPaymentAmountChange: (value: string) => void;
  onRegisterPayment: () => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  account,
  paymentDate,
  paymentAmount,
  onPaymentDateChange,
  onPaymentAmountChange,
  onRegisterPayment,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">Registrar pago</h2>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="payment-date" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Fecha</label>
          <input
            id="payment-date"
            type="date"
            value={paymentDate}
            onChange={(e) => onPaymentDateChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-400 hover:border-gray-300 shadow-sm"
          />
        </div>

        <InputField
          label="Monto"
          type="number"
          value={paymentAmount}
          onChange={onPaymentAmountChange}
          placeholder={account.biweeklyAmount ? String(account.biweeklyAmount) : 'Monto'}
        />

        <Button onClick={onRegisterPayment} variant="primary">
          <CreditCard className="w-5 h-5 mr-2" />
          Marcar pagado
        </Button>
      </div>
    </div>
  );
};
