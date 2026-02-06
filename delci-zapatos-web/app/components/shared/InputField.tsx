'use client';

import React, { useId } from 'react';

interface InputFieldProps {
  id?: string;
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  autoFocus?: boolean;
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const InputField = React.memo<InputFieldProps>(({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  autoFocus = false,
  className = '',
  disabled = false,
  icon,
  size = 'md',
}) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hasError = !!error;

  const baseInputStyles = 'w-full rounded-lg border bg-white text-gray-900 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-400';
  const normalStyles = 'border-gray-300 focus:border-pink-500 focus:ring-pink-500 hover:border-gray-400';
  const errorStyles = 'border-red-500 focus:border-red-500 focus:ring-red-500';

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base',
    lg: 'px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg',
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          className={`${baseInputStyles} ${sizeStyles[size]} ${hasError ? errorStyles : normalStyles} ${icon ? 'pl-10 sm:pl-12' : ''}`}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
        />
      </div>
      {error && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-xs sm:text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
});

InputField.displayName = 'InputField';
