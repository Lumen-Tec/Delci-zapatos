'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/app/components/shared/Modal';
import { InputField } from '@/app/components/commons/InputField';
import { Button } from '@/app/components/commons/Button';
import { InfoField } from '@/app/components/commons/InfoField';
import { UserIcon, PhoneIcon, AddressIcon, ProductsIcon, EditIcon, SaveIcon } from '@/app/components/shared/IconComponents';
import { X } from 'lucide-react';
import type { Client } from '@/models/client';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onClientUpdated?: (updatedClient: Client) => void;
}

export const ClientProfileModal = ({ isOpen, onClose, client, onClientUpdated }: ClientProfileModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toLocalPhoneDigits = (phone: string): string => {
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.startsWith('506')) {
      return digitsOnly.slice(3, 11);
    }
    return digitsOnly.slice(0, 8);
  };

  const toCostaRicaPhone = (phoneDigits: string): string => `+506${phoneDigits}`;

  React.useEffect(() => {
    setIsEditing(false);
  }, [client]);

  if (!client) return null;

  const handleEdit = () => {
    setEditedClient({
      ...client,
      phone: toLocalPhoneDigits(client.phone || ''),
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedClient({ ...client });
    setIsEditing(false);
  };

  const handleChange = (field: keyof Client, value: string | number) => {
    if (field === 'phone') {
      const digitsOnly = String(value).replace(/\D/g, '').slice(0, 8);
      setEditedClient((prev) => (prev ? { ...prev, phone: digitsOnly } : null));
    } else {
      setEditedClient((prev) => (prev ? { ...prev, [field]: value } : null));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    if (!editedClient) return;

    const normalizedPhone = toCostaRicaPhone((editedClient.phone || '').replace(/\D/g, '').slice(0, 8));
    const payload: Client = {
      ...editedClient,
      phone: normalizedPhone,
    };
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const response = await fetch(`/api/clients/${editedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (result.errors && Array.isArray(result.errors)) {
          const errorMap: Record<string, string> = {};
          result.errors.forEach((error: any) => {
            errorMap[error.field] = error.message;
          });
          setErrors(errorMap);
        } else {
          setErrors({ general: result.error || 'Error al actualizar cliente' });
        }
        return;
      }
      
      setEditedClient(result.updated || payload);
      setIsEditing(false);
      onClientUpdated?.(result.updated || payload);
    } catch (error) {
      console.error('Error saving client:', error);
      setErrors({ general: 'Error de conexión al servidor' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Perfil del Cliente"
      className="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Client ID and Name Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
              <Image
                src="https://res.cloudinary.com/drec8g03e/image/upload/v1769809035/perfil-blanco_fwpn7q.svg"
                alt="Perfil"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{client.fullName}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {isEditing ? (
                <>
                  <span className="text-xs font-medium text-pink-600">Modo edición</span>
                  <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                </>
              ) : (
                <span className="text-xs font-medium text-gray-500">Solo lectura</span>
              )}
            </div>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <EditIcon />
                Editar
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  loading={isLoading}
                  className="flex items-center gap-2"
                >
                  <SaveIcon />
                  Guardar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Client Information */}
        <div className="space-y-4">
          {isEditing ? (
            <>
              <InputField
                label="Nombre Completo"
                value={(editedClient ?? client).fullName || ''}
                onChange={(value) => handleChange('fullName', value)}
                placeholder="Ej: Juan Pérez"
                required
                icon={<UserIcon />}
                error={errors.fullName}
              />

              <InputField
                label="Teléfono (+506)"
                value={(editedClient ?? client).phone || ''}
                onChange={(value) => handleChange('phone', value)}
                placeholder="Ej: 88888888"
                required
                type="tel"
                icon={<PhoneIcon />}
                error={errors.phone}
              />

              <InputField
                label="Dirección (opcional)"
                value={(editedClient ?? client).address || ''}
                onChange={(value) => handleChange('address', value)}
                placeholder="Ej: San José, Costa Rica"
                icon={<AddressIcon />}
                error={errors.address}
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <ProductsIcon />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Información del Cliente</p>
                    {client.createdAt && (
                      <p className="text-xs text-blue-600 mt-1">
                        Creado: {new Date(client.createdAt).toLocaleDateString('es-CR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <InfoField
                label="Nombre Completo"
                value={client.fullName || ''}
                icon={<UserIcon />}
              />

              <InfoField
                label="Teléfono"
                value={client.phone || ''}
                icon={<PhoneIcon />}
              />

              <InfoField
                label="Dirección"
                value={client.address || 'No proporcionada'}
                icon={<AddressIcon />}
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <ProductsIcon />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Información del Cliente</p>
                    {client.createdAt && (
                      <p className="text-xs text-blue-600 mt-1">
                        Creado: {new Date(client.createdAt).toLocaleDateString('es-CR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

          {isEditing && errors.general && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
          {!isEditing && (
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button
                variant="secondary"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Cerrar
              </Button>
            </div>
          )}
      </div>
    </Modal>
  );
};
