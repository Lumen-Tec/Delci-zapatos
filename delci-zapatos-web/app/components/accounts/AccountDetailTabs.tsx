'use client';

type DetailStep = 1 | 2;

interface AccountDetailTabsProps {
  step: DetailStep;
  onChange: (step: DetailStep) => void;
}

const tabOptions: Array<{ key: DetailStep; label: string }> = [
  { key: 1, label: 'Resumen' },
  { key: 2, label: 'Pagos' },
];

export function AccountDetailTabs({ step, onChange }: AccountDetailTabsProps) {
  return (
    <div className="mb-4 rounded-xl border border-rose-100 bg-white/90 p-2.5 sm:p-4">
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[11px] sm:text-sm">
        {tabOptions.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`rounded-md sm:rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 font-medium transition-all ${
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
