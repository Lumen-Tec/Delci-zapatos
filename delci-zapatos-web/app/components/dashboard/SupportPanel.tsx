'use client';

import React from 'react';
import Image from 'next/image';

interface SupportPanelProps {
  className?: string;
}

export const SupportPanel = React.memo<SupportPanelProps>(({
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 sm:p-6 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-100 rounded-lg flex items-center justify-center">
            <Image
              src="https://res.cloudinary.com/drec8g03e/image/upload/v1769731992/help_pbqktt.svg"
              alt="Ayuda"
              width={24}
              height={24}
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Estamos aquí para ayudarte con cualquier duda o problema que tengas en el sistema.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <a
              href="mailto:lumentec25@gmail.com"
              className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Image
                src="https://res.cloudinary.com/drec8g03e/image/upload/v1769732107/correo_hax0j1.svg"
                alt="Correo"
                width={16}
                height={16}
                className="w-4 h-4 mr-2"
              />
              Enviar correo
            </a>
            <a
              href="https://api.whatsapp.com/send/?phone=50662435191"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-pink-600 border border-pink-600 rounded-lg text-sm font-medium text-white hover:bg-pink-700 transition-colors"
            >
              <Image
                src="https://res.cloudinary.com/drec8g03e/image/upload/v1769732108/message_ln6foe.svg"
                alt="WhatsApp"
                width={16}
                height={16}
                className="w-4 h-4 mr-2"
              />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="flex items-center text-gray-600">
            <Image
              src="https://res.cloudinary.com/drec8g03e/image/upload/v1769732356/message_pwucgy.svg"
              alt="WhatsApp"
              width={16}
              height={16}
              className="w-4 h-4 mr-2 text-pink-500"
            />
            +506 6243-5191
          </div>
          <div className="flex items-center text-gray-600">
            <Image
              src="https://res.cloudinary.com/drec8g03e/image/upload/v1769732107/correo_hax0j1.svg"
              alt="Correo"
              width={16}
              height={16}
              className="w-4 h-4 mr-2 text-pink-500"
            />
            lumentec25@gmail.com
          </div>
          <div className="flex items-center text-gray-600">
            <Image
              src="https://res.cloudinary.com/drec8g03e/image/upload/v1769732321/clock_phxnke.svg"
              alt="Horario"
              width={16}
              height={16}
              className="w-4 h-4 mr-2 text-pink-500"
            />
            Lun-Vie 7:00-18:00
          </div>
        </div>
      </div>
    </div>
  );
});

SupportPanel.displayName = 'SupportPanel';
