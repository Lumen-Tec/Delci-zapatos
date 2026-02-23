import React from 'react';

interface InfoFieldProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  editable?: boolean;
}

export const InfoField = ({ 
  label, 
  value, 
  icon, 
  editable = true 
}: InfoFieldProps) => (
  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center text-pink-600 border border-pink-200">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-gray-900 break-words">
        {value}
      </p>
    </div>
  </div>
);
