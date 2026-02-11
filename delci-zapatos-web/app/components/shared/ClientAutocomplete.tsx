'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react';
import { Search, X } from 'lucide-react';
import type { Client } from '@/app/models/client';

interface ClientAutocompleteProps {
  clients: Client[];
  value: string;
  onChange: (clientId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const ClientAutocomplete = React.memo<ClientAutocompleteProps>(({
  clients,
  value,
  onChange,
  label,
  placeholder = 'Buscar por nombre, teléfono o dirección...',
  required = false,
  autoFocus = false,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastViewportWidthRef = useRef<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  const openTimestampRef = useRef<number>(0);
  const inputId = useId();

  // Filtrar clientes por nombre, teléfono o dirección
  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;

    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  }, [clients, query]);

  // Cliente seleccionado
  const selectedClient = useMemo(() =>
    clients.find(c => c.id === value) ?? null,
    [clients, value]
  );

  // Resetear highlightedIndex cuando cambien los resultados filtrados
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredClients.length]);

  // Calcular posición del dropdown cuando se abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
      lastViewportWidthRef.current = window.innerWidth;
      openTimestampRef.current = Date.now();
    }
  }, [isOpen]);

  // Cerrar dropdown cuando hay scroll en la página
  useEffect(() => {
    if (isOpen) {
      const handleScroll = (e: Event) => {
        // Ignorar scroll events dentro de los primeros 300ms (auto-scroll del navegador al enfocar en móviles)
        if (Date.now() - openTimestampRef.current < 300) return;
        // Solo cerrar si el scroll NO es dentro del dropdown
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleResize = () => {
        // Solo cerrar si el ancho del viewport cambió (no la altura, que cambia al abrir el teclado virtual)
        if (window.innerWidth !== lastViewportWidthRef.current) {
          setIsOpen(false);
        }
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  // Auto-scroll del elemento resaltado
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      const element = document.getElementById(`client-option-${highlightedIndex}`);
      element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlightedIndex, isOpen]);

  // Click outside para cerrar dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Manejar selección de cliente
  const handleSelect = useCallback((client: Client) => {
    onChange(client.id);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(0);
    inputRef.current?.blur();
  }, [onChange]);

  // Limpiar selección
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  }, [onChange]);

  // Manejar navegación por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    // Abrir dropdown si está cerrado con ArrowDown o ArrowUp
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          Math.min(prev + 1, filteredClients.length - 1)
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, 0));
        break;

      case 'Enter':
        e.preventDefault();
        if (isOpen && filteredClients[highlightedIndex]) {
          handleSelect(filteredClients[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Manejar focus en input
  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  // Manejar cambio en input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Si hay texto, limpiar la selección
    if (newQuery && value) {
      onChange('');
    }

    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Resaltar texto coincidente
  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    try {
      const regex = new RegExp(`(${query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="bg-yellow-200 text-gray-900 font-semibold px-0.5 rounded"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      );
    } catch {
      return text;
    }
  };

  // Valor mostrado en el input
  const inputValue = selectedClient && !query ? selectedClient.name : query;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Icono de búsqueda */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          <Search className="w-5 h-5" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={`${inputId}-listbox`}
          aria-activedescendant={
            isOpen && filteredClients[highlightedIndex]
              ? `client-option-${highlightedIndex}`
              : undefined
          }
          aria-label={label || "Buscar cliente"}
          aria-autocomplete="list"
          className={`
            w-full pl-10 pr-10 py-2.5
            rounded-xl
            border border-gray-200
            bg-white
            text-gray-900 text-sm
            transition-all duration-200
            focus:outline-none
            focus:ring-2 focus:ring-pink-500/20
            focus:border-pink-400
            hover:border-gray-300
            placeholder:text-gray-400
            shadow-sm
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />

        {/* Botón clear */}
        {selectedClient && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2
                       p-1 rounded-lg text-gray-400 hover:text-gray-600
                       hover:bg-gray-100 transition-all duration-200"
            aria-label="Limpiar selección"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown */}
        {isOpen && !disabled && dropdownPosition && (
          <div
            ref={dropdownRef}
            id={`${inputId}-listbox`}
            role="listbox"
            aria-label="Lista de clientes"
            style={{
              position: 'fixed',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties}
            className={`
              z-[9999]
              bg-white
              border border-gray-200
              rounded-xl
              shadow-lg
              max-h-64 overflow-y-auto
              transition-all duration-200
              [&::-webkit-scrollbar]:hidden
              ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
            `}
          >
            {/* Sin clientes */}
            {clients.length === 0 && (
              <div className="px-4 py-6 text-center">
                <div className="text-sm font-medium text-gray-900">
                  No hay clientes registrados
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Crea tu primer cliente para comenzar
                </div>
              </div>
            )}

            {/* Sin resultados de búsqueda */}
            {clients.length > 0 && filteredClients.length === 0 && query.trim() && (
              <div className="px-4 py-6 text-center">
                <div className="text-sm font-medium text-gray-900">
                  No se encontraron resultados para &quot;{query}&quot;
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Intenta con otro término de búsqueda
                </div>
              </div>
            )}

            {/* Lista de clientes */}
            {filteredClients.map((client, index) => (
              <div
                key={client.id}
                id={`client-option-${index}`}
                role="option"
                aria-selected={client.id === value}
                tabIndex={-1}
                onClick={() => handleSelect(client)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  px-4 py-3
                  cursor-pointer
                  transition-all duration-200
                  ${highlightedIndex === index
                    ? 'bg-pink-50 text-gray-900'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  }
                  ${index > 0 ? 'border-t border-gray-100' : ''}
                `}
              >
                <div className="text-sm font-semibold text-gray-900">
                  {highlightMatch(client.name, query)}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {highlightMatch(client.phone, query)}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {highlightMatch(client.address, query)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

ClientAutocomplete.displayName = 'ClientAutocomplete';
