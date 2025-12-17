/**
 * =====================================================
 * QR Scanner Input Component
 * =====================================================
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { QrCodeIcon } from '@heroicons/react/24/outline';

export default function QRScannerInput({
  onScan,
  placeholder = 'Escuchando escáner QR...',
  disabled = false,
}) {
  const [value, setValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const refocusIntervalRef = useRef(null);

  const maintainFocus = useCallback(() => {
    if (inputRef.current && !disabled && document.activeElement !== inputRef.current) {
      const hasModalOpen = document.querySelector('[role="dialog"]') || 
                          document.querySelector('.fixed.inset-0.z-50');
      if (!hasModalOpen) {
        inputRef.current.focus();
      }
    }
  }, [disabled]);

  useEffect(() => {
    maintainFocus();

    refocusIntervalRef.current = setInterval(() => {
      maintainFocus();
    }, 500);

    const handleClick = () => {
      setTimeout(() => {
        maintainFocus();
      }, 100);
    };

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

  const processInput = useCallback(
    (inputValue) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (inputValue.trim()) {
          // Remove trailing commas from QR code scanner data
          const cleanValue = inputValue.trim().replace(/,+$/, '');
          if (cleanValue) {
            onScan(cleanValue);
            setValue('');
            setIsScanning(false);
            setTimeout(() => maintainFocus(), 200);
          }
        }
      }, 100);
    },
    [onScan, maintainFocus]
  );

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsScanning(true);

    // Detect end of scan - either by comma or Enter key
    // Many QR scanners end with a comma or other delimiter
    if (newValue.includes(',')) {
      processInput(newValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Remove trailing commas from manual entry too
      const cleanValue = value.trim().replace(/,+$/, '');
      if (cleanValue) {
        onScan(cleanValue);
        setValue('');
        setIsScanning(false);
      }
    }
  };

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
