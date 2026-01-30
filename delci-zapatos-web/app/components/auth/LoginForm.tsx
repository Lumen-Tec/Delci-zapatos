'use client';

import React, { useState, FormEvent, useCallback } from 'react';
import { InputField } from '../shared/InputField';
import { PasswordInput } from './PasswordInput';
import { Button } from '../shared/Button';

interface LoginFormProps {
  onSubmit?: (username: string, password: string) => void | Promise<void>;
  isLoading?: boolean;
}

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

const validateUsername = (username: string): string | undefined => {
  if (!username.trim()) {
    return 'El usuario o correo electrónico es requerido';
  }
  return undefined;
};

const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'La contraseña es requerida';
  }
  return undefined;
};

export const LoginForm = React.memo<LoginFormProps>(({
  onSubmit,
  isLoading = false,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUsernameChange = useCallback((value: string) => {
    setUsername(value);
    if (errors.username) {
      setErrors(prev => ({ ...prev, username: validateUsername(value) }));
    }
  }, [errors.username]);

  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  }, [errors.password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    if (usernameError || passwordError) {
      setErrors({ username: usernameError, password: passwordError });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit(username, password);
      }
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Error al iniciar sesión',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const usernameIcon = (
    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4 sm:space-y-6" noValidate>
      {errors.general && (
        <div className="p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm" role="alert">
          {errors.general}
        </div>
      )}

      <InputField
        id="username"
        label="Usuario o correo electrónico"
        type="text"
        value={username}
        onChange={handleUsernameChange}
        placeholder="Usuario o correo@ejemplo.com"
        required
        error={errors.username}
        icon={usernameIcon}
        autoFocus
        disabled={isSubmitting || isLoading}
      />

      <PasswordInput
        id="password"
        label="Contraseña"
        value={password}
        onChange={handlePasswordChange}
        placeholder="Ingresa tu contraseña"
        required
        error={errors.password}
        disabled={isSubmitting || isLoading}
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isSubmitting || isLoading}
        loading={isSubmitting || isLoading}
        className="w-full"
      >
        Ingresar
      </Button>
    </form>
  );
});

LoginForm.displayName = 'LoginForm';
