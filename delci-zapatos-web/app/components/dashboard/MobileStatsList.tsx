'use client';

import React from 'react';

type MobileStatColor = 'pink' | 'blue' | 'green' | 'orange';

type MobileStatItem = {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  actionText: string;
  color?: MobileStatColor;
  onAction: () => void;
};

interface MobileStatsListProps {
  items: MobileStatItem[];
  className?: string;
}

const cardColorStyles: Record<MobileStatColor, string> = {
  pink: 'border-pink-200 bg-pink-50/40',
  blue: 'border-blue-200 bg-blue-50/40',
  green: 'border-green-200 bg-green-50/40',
  orange: 'border-orange-200 bg-orange-50/40',
};

const iconColorStyles: Record<MobileStatColor, string> = {
  pink: 'text-pink-600',
  blue: 'text-blue-600',
  green: 'text-green-600',
  orange: 'text-orange-600',
};

const actionColorStyles: Record<MobileStatColor, string> = {
  pink: 'text-pink-700 bg-pink-100 hover:bg-pink-200',
  blue: 'text-blue-700 bg-blue-100 hover:bg-blue-200',
  green: 'text-green-700 bg-green-100 hover:bg-green-200',
  orange: 'text-orange-700 bg-orange-100 hover:bg-orange-200',
};

export function MobileStatsList({ items, className = '' }: MobileStatsListProps) {
  return (
    <div className={`sm:hidden space-y-2 ${className}`}>
      {items.map((item) => {
        const color = item.color ?? 'pink';

        return (
          <div
            key={item.title}
            className={`rounded-xl border p-2.5 shadow-sm ${cardColorStyles[color]}`}
          >
            <div className="flex items-start gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white ${iconColorStyles[color]}`}>
                {item.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                  {item.title}
                </div>

                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <div className="text-xl font-bold leading-none text-gray-900">{item.value}</div>

                  <button
                    type="button"
                    onClick={item.onAction}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${actionColorStyles[color]}`}
                  >
                    {item.actionText}
                  </button>
                </div>

                {item.description && (
                  <div className="mt-1 line-clamp-1 text-[11px] text-gray-500">{item.description}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
