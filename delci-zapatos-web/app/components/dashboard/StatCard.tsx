'use client';

import React from 'react';
import { Button } from '../shared/Button';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  buttonText: string;
  buttonVariant?: 'primary' | 'secondary' | 'outline';
  onButtonClick?: () => void;
  className?: string;
  color?: 'pink' | 'blue' | 'green' | 'orange';
}

export const StatCard = React.memo<StatCardProps>(({
  title,
  value,
  description,
  icon,
  buttonText,
  buttonVariant = 'primary',
  onButtonClick,
  className = '',
  color = 'pink',
}) => {
  const colorStyles = {
    pink: 'bg-white border-pink-200',
    blue: 'bg-white border-blue-200',
    green: 'bg-white border-green-200',
    orange: 'bg-white border-orange-200',
  };

  const iconColorStyles = {
    pink: 'text-pink-600',
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
  };

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 p-4 sm:p-6 ${colorStyles[color]} ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-lg bg-gray-50 ${iconColorStyles[color]}`}>
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-sm sm:text-base font-medium text-gray-700 mb-1">
          {title}
        </h3>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900">
          {value}
        </p>
        {description && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Button */}
      <Button
        variant={buttonVariant}
        size="sm"
        onClick={onButtonClick}
        className="w-full"
      >
        {buttonText}
      </Button>
    </div>
  );
});

StatCard.displayName = 'StatCard';
