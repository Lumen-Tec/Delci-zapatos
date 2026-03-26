'use client';

import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import { formatCurrency } from '@/lib/accountUtils';
import type { AccountDetailsResult, AccountPaymentResult } from '@/types/accountsRepository';

interface AccountDetailPaymentsTabProps {
  account: AccountDetailsResult;
  payments: AccountPaymentResult[];
  biweeklyAmount: string;
  paymentAmount: string;
  onBiweeklyAmountChange: (value: string) => void;
  onPaymentAmountChange: (value: string) => void;
  onSaveBiweekly: () => void;
  onRegisterPayment: () => void;
  isSavingPayment: boolean;
  onNotifyClient: () => void;
  isNotifyingClient: boolean;
  editingPaymentId: string | null;
  editPaymentAmount: string;
  editPaymentDate: string;
  onEditPayment: (payment: AccountPaymentResult) => void;
  onCancelEditPayment: () => void;
  onSaveEditPayment: (paymentId: string) => void;
  onDeletePayment: (paymentId: string) => void;
  onEditPaymentAmountChange: (value: string) => void;
  onEditPaymentDateChange: (value: string) => void;
}

export function AccountDetailPaymentsTab({
  account,
  payments,
  biweeklyAmount,
  paymentAmount,
  onBiweeklyAmountChange,
  onPaymentAmountChange,
  onSaveBiweekly,
  onRegisterPayment,
  isSavingPayment,
  onNotifyClient,
  isNotifyingClient,
  editingPaymentId,
  editPaymentAmount,
  editPaymentDate,
  onEditPayment,
  onCancelEditPayment,
  onSaveEditPayment,
  onDeletePayment,
  onEditPaymentAmountChange,
  onEditPaymentDateChange,
}: AccountDetailPaymentsTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-6">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm sm:shadow-lg overflow-hidden">
        <div className="p-3 sm:p-6 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Pagos</h2>
        </div>
        <div className="p-3 sm:p-6 space-y-2.5 sm:space-y-3">
          <div className="rounded-lg sm:rounded-xl border border-pink-100 bg-pink-50 p-3 sm:p-4">
            <div className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-500">Saldo pendiente</div>
            <div className="mt-1 text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(account.remainingAmount)}</div>
          </div>

          <InputField
            label="Monto quincenal"
            type="number"
            size="sm"
            value={biweeklyAmount}
            onChange={onBiweeklyAmountChange}
          />
          <Button onClick={onSaveBiweekly} variant="secondary" size="md" className="w-full sm:w-auto">
            Guardar monto quincenal
          </Button>

          <InputField
            label="Monto a registrar"
            type="number"
            size="sm"
            value={paymentAmount}
            onChange={onPaymentAmountChange}
          />
          <Button onClick={onRegisterPayment} variant="primary" size="md" className="w-full sm:w-auto" loading={isSavingPayment}>
            Registrar pago
          </Button>

          <Button onClick={onNotifyClient} variant="outline" size="md" className="w-full sm:w-auto" loading={isNotifyingClient}>
            Notificar por WhatsApp
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm sm:shadow-lg overflow-hidden">
        <div className="p-3 sm:p-6 border-b border-gray-100">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Historial</h2>
        </div>
        <div className="p-3 sm:p-6">
          {payments.length === 0 ? (
            <div className="text-xs sm:text-sm text-gray-600">Aun no hay pagos registrados.</div>
          ) : (
            <>
              <div className="md:hidden space-y-1.5">
                {payments
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((payment) => (
                    <div key={payment.id} className="border-b border-gray-100 last:border-b-0 py-1.5 first:pt-0 last:pb-0">
                      {editingPaymentId === payment.id ? (
                        <div className="space-y-1.5 bg-rose-50/60 border border-rose-100 rounded-lg p-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Fecha</label>
                            <input
                              type="date"
                              value={editPaymentDate}
                              onChange={(e) => onEditPaymentDateChange(e.target.value)}
                              className="w-full px-2 py-1 text-[11px] text-gray-900 bg-white border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-0.5">Monto</label>
                            <input
                              type="number"
                              value={editPaymentAmount}
                              onChange={(e) => onEditPaymentAmountChange(e.target.value)}
                              className="w-full px-2 py-1 text-[11px] text-gray-900 bg-white border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => onSaveEditPayment(payment.id)}
                              className="inline-flex items-center justify-center px-2 py-1 rounded-md text-white bg-green-600 hover:bg-green-700 text-[11px] font-medium"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={onCancelEditPayment}
                              className="inline-flex items-center justify-center px-2 py-1 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 text-[11px] font-medium"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] text-gray-500">{payment.date}</div>
                            <div className="text-xs text-gray-900 font-semibold truncate">{formatCurrency(payment.amount)}</div>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => onEditPayment(payment)}
                              className="inline-flex items-center justify-center p-1 rounded-md text-blue-600 hover:text-white bg-blue-100 hover:bg-blue-600 transition-colors"
                              title="Editar pago"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeletePayment(payment.id)}
                              className="inline-flex items-center justify-center p-1 rounded-md text-red-600 hover:text-white bg-red-100 hover:bg-red-600 transition-colors"
                              title="Eliminar pago"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payments
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((payment) => (
                        <tr key={payment.id} className="hover:bg-pink-50/30 transition-all">
                          {editingPaymentId === payment.id ? (
                            <>
                              <td className="px-4 py-3">
                                <input
                                  type="date"
                                  value={editPaymentDate}
                                  onChange={(e) => onEditPaymentDateChange(e.target.value)}
                                  className="w-full px-2 py-1 text-sm text-gray-900 bg-white border border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={editPaymentAmount}
                                  onChange={(e) => onEditPaymentAmountChange(e.target.value)}
                                  className="w-full px-2 py-1 text-sm text-right text-gray-900 bg-white border border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onSaveEditPayment(payment.id)}
                                    className="inline-flex items-center justify-center px-2 py-1 rounded-lg text-white bg-green-600 hover:bg-green-700 text-xs"
                                  >
                                    Guardar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={onCancelEditPayment}
                                    className="inline-flex items-center justify-center px-2 py-1 rounded-lg text-gray-600 bg-gray-100 hover:bg-gray-200 text-xs"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-sm text-gray-700">{payment.date}</td>
                              <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{formatCurrency(payment.amount)}</td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => onEditPayment(payment)}
                                    className="inline-flex items-center justify-center p-2 rounded-xl text-blue-600 hover:text-white bg-blue-100 hover:bg-blue-600 transition-colors"
                                    title="Editar pago"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeletePayment(payment.id)}
                                    className="inline-flex items-center justify-center p-2 rounded-xl text-red-600 hover:text-white bg-red-100 hover:bg-red-600 transition-colors"
                                    title="Eliminar pago"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
