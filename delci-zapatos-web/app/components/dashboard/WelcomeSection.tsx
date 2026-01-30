'use client';

import React from 'react';

interface WelcomeSectionProps {
  userName?: string;
  className?: string;
}

export const WelcomeSection = React.memo<WelcomeSectionProps>(({
  userName = 'Delci',
  className = '',
}) => {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        ¡Hola, <span className="text-pink-500">{userName}</span>! 
      </h1>
      <p className="text-sm sm:text-base text-gray-600">
        Bienvenida a tu sistema de gestión. Aquí tienes el resumen de hoy.
      </p>
    </div>
  );
});

WelcomeSection.displayName = 'WelcomeSection';
