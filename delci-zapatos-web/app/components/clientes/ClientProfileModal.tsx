'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/app/components/shared/Modal';
import { InputField } from '@/app/components/shared/InputField';
import { Button } from '@/app/components/shared/Button';
import { X } from 'lucide-react';
import { Client } from './ClientsTable';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onClientUpdated?: (updatedClient: Client) => void;
  onViewAccount?: (clientId: string) => void;
}

export const ClientProfileModal = ({ isOpen, onClose, client, onClientUpdated, onViewAccount }: ClientProfileModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (client) {
      setEditedClient({ ...client });
    }
    setIsEditing(false);
  }, [client]);

  if (!client || !editedClient) return null;

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedClient({ ...client });
    setIsEditing(false);
  };

  const handleChange = (field: keyof Client, value: string | number) => {
    setEditedClient((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    if (!editedClient) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEditedClient({ ...editedClient });
      setIsEditing(false);
      onClientUpdated?.(editedClient);
    } catch (error) {
      console.error('Error saving client:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewAccount = () => {
    if (client && onViewAccount) {
      onViewAccount(client.id);
      onClose(); // Cerrar el modal después de navegar
    }
  };

  const InfoField = ({ 
    label, 
    value, 
    icon, 
    editable = true 
  }: { 
    label: string; 
    value: string | number; 
    icon: React.ReactNode; 
    editable?: boolean;
  }) => (
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

  // Icon components using Next.js Image
  const UserIcon = () => (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769808970/perfil_cv6pdw.svg"
      alt="Usuario"
      width={20}
      height={20}
      className="w-5 h-5"
    />
  );

  const PhoneIcon = () => (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769808970/telefono_l4dkby.svg"
      alt="Teléfono"
      width={20}
      height={20}
      className="w-5 h-5"
    />
  );

  const AddressIcon = () => (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769808970/ubicacion_zapqrd.svg"
      alt="Dirección"
      width={20}
      height={20}
      className="w-5 h-5"
    />
  );

  const ProductsIcon = () => (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769808970/productos_dnz8zi.svg"
      alt="Productos"
      width={20}
      height={20}
      className="w-5 h-5"
    />
  );

  const AccountIcon = () => (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769717760/cuentas_uqp46t.svg"
      alt="Cuenta"
      width={20}
      height={20}
      className="w-5 h-5"
    />
  );

  const EditIcon = () => (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769809182/edit_w5bmhc.svg"
      alt="Editar"
      width={16}
      height={16}
      className="w-4 h-4"
    />
  );

  const SaveIcon = () => (
    <Image
      src="https://res.cloudinary.com/drec8g03e/image/upload/v1769809182/save_cj0ltc.svg"
      alt="Guardar"
      width={16}
      height={16}
      className="w-4 h-4"
    />
  );

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
              <p className="text-sm font-mono text-pink-600 font-medium">#{client.id}</p>
              <h3 className="text-lg font-bold text-gray-900">{client.name}</h3>
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
                value={editedClient.name}
                onChange={(value) => handleChange('name', value)}
                placeholder="Ej: Juan Pérez"
                required
                icon={<UserIcon />}
              />

              <InputField
                label="Teléfono"
                value={editedClient.phone}
                onChange={(value) => handleChange('phone', value)}
                placeholder="Ej: +506 8888-8888"
                required
                type="tel"
                icon={<PhoneIcon />}
              />

              <InputField
                label="Dirección"
                value={editedClient.address}
                onChange={(value) => handleChange('address', value)}
                placeholder="Ej: San José, Costa Rica"
                required
                icon={<AddressIcon />}
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ProductsIcon />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total de Productos</p>
                      <p className="text-lg font-bold text-blue-600">{editedClient.totalProducts}</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleViewAccount}
                    className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    <AccountIcon />
                    Ver Cuenta
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <InfoField
                label="Nombre Completo"
                value={client.name}
                icon={<UserIcon />}
              />

              <InfoField
                label="Teléfono"
                value={client.phone}
                icon={<PhoneIcon />}
              />

              <InfoField
                label="Dirección"
                value={client.address}
                icon={<AddressIcon />}
              />

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ProductsIcon />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total de Productos</p>
                      <p className="text-lg font-bold text-blue-600">{client.totalProducts}</p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleViewAccount}
                    className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white"
                  >
                    <AccountIcon />
                    Ver Cuenta
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
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
