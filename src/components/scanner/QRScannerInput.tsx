/**
 * =====================================================
 * Componente: QR Scanner Input
 * =====================================================
 * Campo de entrada para escanear códigos QR
 * Detecta automáticamente cuando se completa un escaneo
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { QrCodeIcon } from '@heroicons/react/24/outline';

interface QRScannerInputProps {
  onScan: (qrData: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export default function QRScannerInput({
  onScan,
  placeholder = 'Escanee el código QR...',
  disabled = false,
  autoFocus = true,
}: QRScannerInputProps) {
  const [value, setValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enfocar el input al montar
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Procesar el escaneo con debounce
  const processInput = useCallback(
    (inputValue: string) => {
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Esperar un pequeño delay para asegurar que el escaneo completo se recibió
      timeoutRef.current = setTimeout(() => {
        if (inputValue.trim()) {
          onScan(inputValue.trim());
          setValue('');
          setIsScanning(false);
        }
      }, 100); // 100ms de delay para detectar fin de escaneo
    },
    [onScan]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsScanning(true);

    // Si contiene una coma, probablemente es un escaneo QR
    if (newValue.includes(',')) {
      processInput(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter para procesar manualmente
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      onScan(value.trim());
      setValue('');
      setIsScanning(false);
    }
  };

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <QrCodeIcon
          className={`h-5 w-5 ${isScanning ? 'animate-pulse text-blue-500' : 'text-gray-400'}`}
        />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          block w-full rounded-lg border border-gray-300 bg-white py-3 pl-10 pr-4
          text-gray-900 placeholder-gray-500 shadow-sm
          focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
          ${isScanning ? 'border-blue-400 ring-2 ring-blue-200' : ''}
        `}
      />
      {isScanning && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-xs text-blue-500 animate-pulse">Escaneando...</span>
        </div>
      )}
    </div>
  );
}
