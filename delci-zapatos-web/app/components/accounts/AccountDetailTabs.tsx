'use client';

import React from 'react';

type DetailStep = 1 | 2 | 3;

interface AccountDetailTabsProps {
  step: DetailStep;
  onChange: (step: DetailStep) => void;
}

const tabOptions: Array<{ key: DetailStep; label: string }> = [
  { key: 1, label: 'Resumen' },
  { key: 2, label: 'Productos' },
  { key: 3, label: 'Pagos' },
];

export function AccountDetailTabs({ step, onChange }: AccountDetailTabsProps) {
  return (
    <div className="mb-4 rounded-xl border border-rose-100 bg-white/90 p-4">
      <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
        {tabOptions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`rounded-lg px-3 py-2 font-medium transition-all ${
              step === item.key ? 'bg-pink-500 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
