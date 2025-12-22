/**
 * =====================================================
 * Wait Time Counter Component
 * Displays countdown for out_fridge pastes
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

export default function WaitTimeCounter({ fridgeOutDatetime, compact = false }) {
  const [timeRemaining, setTimeRemaining] = useState(null);

  const calculateTimeRemaining = useCallback(() => {
    if (!fridgeOutDatetime) return null;

    const fridgeOut = new Date(fridgeOutDatetime);
    const readyTime = new Date(fridgeOut.getTime() + 4 * 60 * 60 * 1000); // 4 horas después
    const now = new Date();
    const diff = readyTime.getTime() - now.getTime();

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, completed: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, completed: false };
  }, [fridgeOutDatetime]);

  useEffect(() => {
    if (!fridgeOutDatetime) return;

    // Calcular inmediatamente
    setTimeRemaining(calculateTimeRemaining());

    // Actualizar cada segundo
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [fridgeOutDatetime, calculateTimeRemaining]);

  if (!fridgeOutDatetime || !timeRemaining) {
    return null;
  }

  const pad = (num) => num.toString().padStart(2, '0');

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        {timeRemaining.completed ? (
          <>
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <span className="text-xs font-medium text-green-400">Lista</span>
          </>
        ) : (
          <>
            <ClockIcon className="h-4 w-4 text-yellow-400" />
            <span className="text-xs font-mono text-yellow-400">
              {pad(timeRemaining.hours)}:{pad(timeRemaining.minutes)}:{pad(timeRemaining.seconds)}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-neutral-700/50">
      {timeRemaining.completed ? (
        <>
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
          <span className="text-sm font-medium text-green-400">Lista para mezclar</span>
        </>
      ) : (
        <>
          <ClockIcon className="h-5 w-5 text-yellow-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs text-neutral-400">Tiempo restante:</span>
            <span className="text-sm font-mono font-bold text-yellow-400">
              {timeRemaining.hours > 0 && `${pad(timeRemaining.hours)}:`}
              {pad(timeRemaining.minutes)}:{pad(timeRemaining.seconds)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
