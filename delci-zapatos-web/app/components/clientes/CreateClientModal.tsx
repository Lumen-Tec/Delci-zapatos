'use client';

import React, { useState } from 'react';
import { Modal } from '@/app/components/shared/Modal';
import { InputField } from '@/app/components/shared/InputField';
import { Button } from '@/app/components/shared/Button';
import { User, Phone, MapPin } from 'lucide-react';

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClientCreated?: (client: any) => void;
}

export const CreateClientModal = ({ isOpen, onClose, onClientCreated }: CreateClientModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // TODO: Implement actual API call here
        console.log('Creating client:', formData);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        if (onClientCreated) {
            onClientCreated(formData);
        }

        setIsLoading(false);
        onClose();
        setFormData({ name: '', phone: '', address: '' }); // Reset form
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Cliente">
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField
                    label="Nombre Completo"
                    value={formData.name}
                    onChange={(value) => handleChange('name', value)}
                    placeholder="Ej: Juan Pérez"
                    required
                    icon={<User className="w-5 h-5" />}
                />

                <InputField
                    label="Teléfono"
                    value={formData.phone}
                    onChange={(value) => handleChange('phone', value)}
                    placeholder="Ej: +506 8888-8888"
                    required
                    type="tel"
                    icon={<Phone className="w-5 h-5" />}
                />

                <InputField
                    label="Dirección"
                    value={formData.address}
                    onChange={(value) => handleChange('address', value)}
                    placeholder="Ej: San José, Costa Rica"
                    required
                    icon={<MapPin className="w-5 h-5" />}
                />

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        loading={isLoading}
                    >
                        Guardar Cliente
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
