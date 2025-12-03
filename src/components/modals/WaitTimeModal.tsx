/**
 * =====================================================
 * Componente: Modal de Tiempo de Espera
 * =====================================================
 * Modal que se muestra cuando no han pasado las 4 horas
 * requeridas después de sacar la pasta del refrigerador
 */

'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { SolderPaste } from '@/types';
import { formatDateTime } from '@/lib/qrParser';
import { ClockIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface WaitTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  paste: SolderPaste | null;
  remainingMs: number;
}

export default function WaitTimeModal({
  isOpen,
  onClose,
  paste,
  remainingMs: initialRemainingMs,
}: WaitTimeModalProps) {
  const [remainingMs, setRemainingMs] = useState(initialRemainingMs);

  // Actualizar el contador en tiempo real
  useEffect(() => {
    if (!isOpen || initialRemainingMs <= 0) return;

    setRemainingMs(initialRemainingMs);

    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        const newVal = prev - 1000;
        if (newVal <= 0) {
          clearInterval(interval);
          return 0;
        }
        return newVal;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, initialRemainingMs]);

  if (!paste) return null;

  // Calcular horas, minutos y segundos restantes
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

  // Calcular porcentaje de progreso (4 horas = 100%)
  const fourHoursMs = 4 * 60 * 60 * 1000;
  const elapsedMs = fourHoursMs - remainingMs;
  const progressPercent = Math.min((elapsedMs / fourHoursMs) * 100, 100);

  // Calcular hora estimada cuando estará lista
  const readyTime = paste.fridge_out_datetime 
    ? new Date(new Date(paste.fridge_out_datetime).getTime() + fourHoursMs)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="⏰ Tiempo de Espera Requerido" size="lg">
      <div className="space-y-6">
        {/* Alerta principal */}
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start">
            <ClockIcon className="h-6 w-6 text-amber-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800">
                Debe esperar 4 horas después de sacar la pasta del refrigerador
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                Esta validación asegura que la pasta alcance la temperatura ambiente adecuada antes del mezclado.
              </p>
            </div>
          </div>
        </div>

        {/* Contador de tiempo */}
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-2">Tiempo restante:</p>
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-gray-900 text-white rounded-lg px-4 py-3 min-w-[60px]">
              <span className="text-3xl font-mono font-bold">{String(hours).padStart(2, '0')}</span>
              <p className="text-xs text-gray-400 mt-1">horas</p>
            </div>
            <span className="text-3xl font-bold text-gray-400">:</span>
            <div className="bg-gray-900 text-white rounded-lg px-4 py-3 min-w-[60px]">
              <span className="text-3xl font-mono font-bold">{String(minutes).padStart(2, '0')}</span>
              <p className="text-xs text-gray-400 mt-1">minutos</p>
            </div>
            <span className="text-3xl font-bold text-gray-400">:</span>
            <div className="bg-gray-900 text-white rounded-lg px-4 py-3 min-w-[60px]">
              <span className="text-3xl font-mono font-bold">{String(seconds).padStart(2, '0')}</span>
              <p className="text-xs text-gray-400 mt-1">segundos</p>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progreso de espera</span>
            <span>{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-green-500 transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Información de la pasta */}
        <div className="rounded-lg border border-gray-200 p-4 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Lote:</span>
              <span className="ml-2 font-medium">{paste.lot_number}</span>
            </div>
            <div>
              <span className="text-gray-500">Serial:</span>
              <span className="ml-2 font-medium">{paste.lot_serial}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Salida de refrigerador:</span>
              <span className="ml-2 font-medium">{formatDateTime(paste.fridge_out_datetime)}</span>
            </div>
            {readyTime && (
              <div className="col-span-2">
                <span className="text-gray-500">Disponible para mezclar:</span>
                <span className="ml-2 font-medium text-green-600">
                  {readyTime.toLocaleString('es-MX', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Mensaje adicional */}
        {remainingMs <= 0 && (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-800 font-medium">
              ✅ ¡El tiempo de espera ha terminado! Puede volver a escanear para iniciar el mezclado.
            </p>
          </div>
        )}

        {/* Botón de cerrar */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
}
