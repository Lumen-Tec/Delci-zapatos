'use client';

import React from 'react';
import Image from 'next/image';

interface LogoHeaderProps {
  logoUrl?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export const LogoHeader = React.memo<LogoHeaderProps>(({
  logoUrl = 'https://res.cloudinary.com/drec8g03e/image/upload/f_webp/delci_zapatos_er5sri',
  title = 'Iniciar sesión',
  subtitle,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center mb-8 ${className}`}>
      {logoUrl && (
        <div className="relative mb-6">
          <Image
            src={logoUrl}
            alt="Delci Zapatos Logo"
            width={200}
            height={200}
            className="object-contain"
            priority
          />
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
        {title}
      </h1>
      {subtitle && (
        <p className="text-sm text-gray-600 text-center max-w-sm">
          {subtitle}
        </p>
      )}
    </div>
  );
});

LogoHeader.displayName = 'LogoHeader';
