'use client';

import React from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { Button } from '@/app/components/commons/Button';
import { InputField } from '@/app/components/commons/InputField';
import { formatAmountWithSpaces, formatCurrency, normalizeAmountInput } from '@/lib/accountUtils';
import type { AccountDetailsResult } from '@/types/accountsRepository';

interface AccountDetailSummaryTabProps {
  account: AccountDetailsResult;
  initialBalanceDraft: string;
  onInitialBalanceDraftChange: (value: string) => void;
  onSaveInitialBalance: () => void;
  isSavingBalances: boolean;
  showBalanceAdjustSection?: boolean;
  isEditingDetail: boolean;
  editDetailValue: string;
  onEditDetailValueChange: (value: string) => void;
  onEditDetail: () => void;
  onSaveDetail: () => void;
  onCancelEditDetail: () => void;
  getStatusLabel: (status: AccountDetailsResult['status']) => string;
}

export function AccountDetailSummaryTab({
  account,
  initialBalanceDraft,
  onInitialBalanceDraftChange,
  onSaveInitialBalance,
  isSavingBalances,
  showBalanceAdjustSection = true,
  isEditingDetail,
  editDetailValue,
  onEditDetailValueChange,
  onEditDetail,
  onSaveDetail,
  onCancelEditDetail,
  getStatusLabel,
}: AccountDetailSummaryTabProps) {
  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="sm:hidden bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
          Resumen
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Cliente</span>
            <span className="text-sm font-medium text-gray-900 text-right">{account.clientName}</span>
          </div>
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Saldo pendiente</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(account.remainingAmount)}</span>
          </div>
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Saldo pagado</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(account.totalPaid)}</span>
          </div>
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Estado</span>
            <span className="text-sm font-medium text-gray-900">{getStatusLabel(account.status)}</span>
          </div>
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Monto quincenal</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(account.biweeklyAmount)}</span>
          </div>
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">Proximo pago</span>
            <span className="text-sm font-medium text-gray-900">{account.nextPaymentDate || 'Sin fecha'}</span>
          </div>
        </div>
      </div>

      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
          <div className="text-xs uppercase tracking-wide text-gray-500">Cliente</div>
          <div className="text-lg font-semibold text-gray-900 mt-2">{account.clientName}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
          <div className="text-xs uppercase tracking-wide text-gray-500">Saldo Pendiente</div>
          <div className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(account.remainingAmount)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
          <div className="text-xs uppercase tracking-wide text-gray-500">Saldo pagado</div>
          <div className="text-xl font-bold text-gray-900 mt-2">{formatCurrency(account.totalPaid)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
          <div className="text-xs uppercase tracking-wide text-gray-500">Estado</div>
          <div className="text-lg font-semibold text-gray-900 mt-2">{getStatusLabel(account.status)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
          <div className="text-xs uppercase tracking-wide text-gray-500">Monto quincenal</div>
          <div className="text-lg font-semibold text-gray-900 mt-2">{formatCurrency(account.biweeklyAmount)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-6">
          <div className="text-xs uppercase tracking-wide text-gray-500">Proximo pago</div>
          <div className="text-lg font-semibold text-gray-900 mt-2">{account.nextPaymentDate || 'Sin fecha'}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wide text-gray-500">Detalle de la cuenta</div>
          {!isEditingDetail ? (
            <button
              type="button"
              onClick={onEditDetail}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              title="Editar detalle"
            >
              <Edit2 className="w-3 h-3" />
              Editar
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSaveDetail}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <Save className="w-3 h-3" />
                Guardar
              </button>
              <button
                type="button"
                onClick={onCancelEditDetail}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-3 h-3" />
                Cancelar
              </button>
            </div>
          )}
        </div>
        {isEditingDetail ? (
          <textarea
            value={editDetailValue}
            onChange={(e) => onEditDetailValueChange(e.target.value)}
            placeholder="Escribe el detalle de la cuenta..."
            rows={4}
            className="w-full px-3 py-2 text-sm text-gray-800 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 resize-none"
          />
        ) : (
          <div className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">
            {account.detail?.trim() ? account.detail : 'Sin detalle'}
          </div>
        )}
      </div>

      {showBalanceAdjustSection && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden p-4 sm:p-6">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">Ajuste manual de saldo</div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2 max-w-md">
              <InputField
                label="Saldo inicial"
                type="text"
                value={formatAmountWithSpaces(initialBalanceDraft)}
                onChange={(value) => onInitialBalanceDraftChange(normalizeAmountInput(value))}
              />
              <Button onClick={onSaveInitialBalance} variant="secondary" loading={isSavingBalances}>
                Guardar saldo inicial
              </Button>
              <div className="text-xs text-gray-500">
                El saldo pendiente se ajusta unicamente mediante el registro de pagos.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
