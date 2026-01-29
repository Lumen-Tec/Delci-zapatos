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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <LogoHeader 
            subtitle="Ingresa tus credenciales para acceder al sistema"
          />
          <LoginForm onSubmit={handleLogin} />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Necesitas ayuda? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  );
}