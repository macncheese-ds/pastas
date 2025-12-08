/**
 * =====================================================
 * Componente: QR Scanner Input
 * =====================================================
 * Campo de entrada para escanear códigos QR
 * SIEMPRE está escuchando - mantiene el foco automáticamente
 * Detecta automáticamente cuando se completa un escaneo
 * El escáner trabaja en segundo plano sin indicadores visuales prominentes
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { QrCodeIcon } from '@heroicons/react/24/outline';

interface QRScannerInputProps {
  onScan: (qrData: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function QRScannerInput({
  onScan,
  placeholder = 'Escuchando escáner QR...',
  disabled = false,
}: QRScannerInputProps) {
  const [value, setValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refocusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para mantener el foco - siempre activa en segundo plano
  const maintainFocus = useCallback(() => {
    if (inputRef.current && !disabled && document.activeElement !== inputRef.current) {
      // Solo re-enfocar si no hay un modal abierto (verificar si hay overlay)
      const hasModalOpen = document.querySelector('[role="dialog"]') || 
                          document.querySelector('.fixed.inset-0.z-50');
      if (!hasModalOpen) {
        inputRef.current.focus();
      }
    }
  }, [disabled]);

  // Enfocar el input al montar y mantener el foco constantemente
  useEffect(() => {
    // Enfocar inmediatamente
    maintainFocus();

    // Configurar intervalo para mantener el foco cada 500ms
    refocusIntervalRef.current = setInterval(() => {
      maintainFocus();
    }, 500);

    // También re-enfocar cuando se hace clic en cualquier parte de la página
    const handleClick = () => {
      // Pequeño delay para permitir que otros elementos procesen el clic primero
      setTimeout(() => {
        maintainFocus();
      }, 100);
    };

    // Re-enfocar cuando la ventana recupera el foco
    const handleWindowFocus = () => {
      setTimeout(() => {
        maintainFocus();
      }, 100);
    };

    document.addEventListener('click', handleClick);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (refocusIntervalRef.current) {
        clearInterval(refocusIntervalRef.current);
      }
      document.removeEventListener('click', handleClick);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [maintainFocus]);

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
          // Re-enfocar después de procesar
          setTimeout(() => maintainFocus(), 200);
        }
      }, 100); // 100ms de delay para detectar fin de escaneo
    },
    [onScan, maintainFocus]
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

  // Limpiar timeouts al desmontar
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
          className={`h-5 w-5 ${
            isScanning 
              ? 'animate-pulse text-blue-400' 
              : 'text-green-400'
          }`}
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
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className={`
          block w-full rounded-lg border py-3 pl-10 pr-4
          text-white placeholder-neutral-400 shadow-sm
          focus:outline-none focus:ring-2
          disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500
          ${isScanning 
            ? 'border-blue-500 ring-2 ring-blue-500/30 bg-neutral-700' 
            : 'border-green-600 bg-neutral-700 ring-1 ring-green-500/20'
          }
        `}
      />
      {isScanning && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-xs text-blue-400 animate-pulse">Escaneando...</span>
        </div>
      )}
    </div>
  );
}
