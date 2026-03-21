'use client';

import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { Modal } from '@/app/components/shared/Modal'
import { InputField } from '@/app/components/commons/InputField';
import { Button } from '@/app/components/commons/Button';
import { User, Phone, MapPin } from 'lucide-react';
import type { Client } from '@/models/client';

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClientCreated?: (client: Client) => void;
}

export const CreateClientModal = ({ isOpen, onClose, onClientCreated }: CreateClientModalProps) => {
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        address: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const normalizeCostaRicaPhone = (phoneDigits: string) => `+506${phoneDigits}`;

    const handleChange = (field: string, value: string) => {
        if (field === 'phone') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 8);
            setFormData((prev) => ({ ...prev, phone: digitsOnly }));
        } else {
            setFormData((prev) => ({ ...prev, [field]: value }));
        }

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        const normalizedPhone = normalizeCostaRicaPhone(formData.phone);

        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    phone: normalizedPhone,
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                if (result.errors && Array.isArray(result.errors)) {
                    const errorMap: Record<string, string> = {};
                    result.errors.forEach((error: any) => {
                        errorMap[error.field] = error.message;
                    });
                    setErrors(errorMap);
                    
                    // Show validation errors with SweetAlert2
                    const errorMessages = result.errors.map((error: any) => 
                        `• ${error.message}`
                    ).join('\n');
                    
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error de Validación',
                        text: 'Por favor, corrige los siguientes errores:',
                        html: `<pre style="text-align: left; font-family: inherit; white-space: pre-wrap;">${errorMessages}</pre>`,
                        confirmButtonColor: '#ec4899'
                    });
                } else {
                    setErrors({ general: result.error || 'Error al crear cliente' });
                    
                    // Show general error with SweetAlert2
                    await Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: result.error || 'Error al crear cliente',
                        confirmButtonColor: '#ec4899'
                    });
                }
                return;
            }

            // Show success message with SweetAlert2
            await Swal.fire({
                icon: 'success',
                title: '¡Cliente Creado!',
                text: 'El cliente ha sido creado exitosamente.',
                timer: 2000,
                showConfirmButton: false,
                position: 'top-end',
                toast: true
            });

            if (onClientCreated) {
                const createdClient: Client = {
                    id: result?.created?.id ?? '',
                    fullName: formData.fullName,
                    phone: normalizedPhone,
                    address: formData.address,
                    createdAt: new Date().toISOString(),
                };

                onClientCreated(createdClient);
            }

            onClose();
            setFormData({ fullName: '', phone: '', address: '' }); // Reset form
        } catch (error) {
            console.error('Error creating client:', error);
            setErrors({ general: 'Error de conexión al servidor' });
            
            // Show connection error with SweetAlert2
            await Swal.fire({
                icon: 'error',
                title: 'Error de Conexión',
                text: 'No se pudo conectar al servidor. Por favor, intenta nuevamente.',
                confirmButtonColor: '#ec4899'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Cliente">
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField
                    label="Nombre Completo"
                    value={formData.fullName}
                    onChange={(value) => handleChange('fullName', value)}
                    placeholder="Ej: Juan Pérez"
                    required
                    icon={<User className="w-5 h-5" />}
                    error={errors.fullName}
                />

                <InputField
                    label="Teléfono (+506)"
                    value={formData.phone}
                    onChange={(value) => handleChange('phone', value)}
                    placeholder="Ej: 88888888"
                    required
                    type="tel"
                    icon={<Phone className="w-5 h-5" />}
                    error={errors.phone}
                />

                <InputField
                    label="Dirección (opcional)"
                    value={formData.address}
                    onChange={(value) => handleChange('address', value)}
                    placeholder="Ej: San José, Costa Rica"
                    icon={<MapPin className="w-5 h-5" />}
                    error={errors.address}
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
