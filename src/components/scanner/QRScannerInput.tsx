/**
 * =====================================================
 * Componente: QR Scanner Input
 * =====================================================
 * Campo de entrada para escanear códigos QR
 * SIEMPRE está escuchando - mantiene el foco automáticamente
 * Detecta automáticamente cuando se completa un escaneo
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { QrCodeIcon, SignalIcon } from '@heroicons/react/24/outline';

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
  const [isListening, setIsListening] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refocusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Función para mantener el foco
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
    const handleClick = (e: MouseEvent) => {
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

  // Actualizar estado de escucha
  useEffect(() => {
    const checkFocus = () => {
      setIsListening(document.activeElement === inputRef.current);
    };

    const interval = setInterval(checkFocus, 200);
    return () => clearInterval(interval);
  }, []);

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
      {/* Indicador de estado de escucha */}
      <div className="absolute -top-2 -right-2 z-10">
        <span className={`
          inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
          ${isListening 
            ? 'bg-green-900/70 text-green-300 border border-green-700' 
            : 'bg-yellow-900/70 text-yellow-300 border border-yellow-700'
          }
        `}>
          <SignalIcon className={`h-3 w-3 mr-1 ${isListening ? 'animate-pulse' : ''}`} />
          {isListening ? 'Escuchando' : 'Click para activar'}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <QrCodeIcon
          className={`h-5 w-5 ${
            isScanning 
              ? 'animate-pulse text-blue-400' 
              : isListening 
                ? 'text-green-400' 
                : 'text-neutral-500'
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
            : isListening
              ? 'border-green-600 bg-neutral-700 ring-1 ring-green-500/20'
              : 'border-neutral-600 bg-neutral-700'
          }
        `}
      />
      {isScanning ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-xs text-blue-400 animate-pulse">Escaneando...</span>
        </div>
      ) : isListening ? (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-xs text-green-400">● Listo para escanear</span>
        </div>
      ) : null}
    </div>
  );
}
