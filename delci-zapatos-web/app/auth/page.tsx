'use client';

import React from 'react';
import { LogoHeader } from '@/app/components/auth/LogoHeader';
import { LoginForm } from '@/app/components/auth/LoginForm';

export default function AuthPage() {
  const handleLogin = async (username: string, password: string) => {
    // Aquí irá la lógica de autenticación
    console.log('Login attempt:', { username, password });
    
    // Simulación de delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulación de validación
    if (username === 'admin' && password === 'admin') {
      // Redirección al dashboard
      window.location.href = '/dashboard';
    } else {
      throw new Error('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-pink-300 to-rose-300 px-4 py-8 sm:py-12 relative overflow-hidden">
      {/* Figuras geométricas decorativas animadas */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Forma 1: Grande, arriba-izquierda, flotando */}
        <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-white rounded-full opacity-20 mix-blend-soft-light animate-float"></div>
        
        {/* Forma 2: Mediana, abajo-derecha, flotando en reversa */}
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-white rounded-full opacity-15 mix-blend-soft-light animate-float-reverse"></div>
        
        {/* Forma 3: Pequeña, centro-derecha, flotando lento */}
        <div className="absolute top-1/2 left-3/4 w-32 h-32 bg-white rounded-full opacity-25 mix-blend-soft-light animate-float-slow"></div>
        
        {/* Forma 4: Ovalada, abajo-izquierda, flotando */}
        <div className="absolute bottom-1/4 left-1/4 w-56 h-40 bg-white rounded-full opacity-20 mix-blend-soft-light animate-float-fast"></div>
        
        {/* Forma 5: Ovalada, arriba-derecha, flotando en reversa */}
        <div className="absolute top-1/4 right-1/2 w-40 h-56 bg-white rounded-full opacity-15 mix-blend-soft-light animate-float"></div>

        {/* Forma 6: Más pequeña, arriba-centro */}
        <div className="absolute top-1/3 left-1/2 w-24 h-24 bg-white rounded-full opacity-10 mix-blend-soft-light animate-float-reverse"></div>

        {/* Forma 7: Grande, abajo-centro */}
        <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-white rounded-full opacity-18 mix-blend-soft-light animate-float-slow"></div>

        {/* Forma 8: Pequeña, abajo-derecha esquina */}
        <div className="absolute bottom-10 right-10 w-20 h-20 bg-white rounded-full opacity-22 mix-blend-soft-light animate-float-fast"></div>

        {/* Forma 9: Ovalada, arriba-izquierda esquina */}
        <div className="absolute top-10 left-10 w-60 h-48 bg-white rounded-full opacity-12 mix-blend-soft-light animate-float"></div>
      </div>

      {/* Contenido principal (formulario) */}
      <div className="relative z-10 w-full max-w-sm sm:max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-10 border border-gray-100">
          <LogoHeader 
            subtitle="Ingresa tus credenciales para acceder al sistema"
          />
          <div className="mt-4 sm:mt-6">
            <LoginForm onSubmit={handleLogin} />
          </div>
        </div>
        
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs sm:text-sm text-white/80">
            ¿Necesitas ayuda? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  );
}