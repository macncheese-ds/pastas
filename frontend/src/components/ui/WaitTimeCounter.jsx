/**
 * =====================================================
 * Wait Time Counter Component
 * Displays countdown for out_fridge pastes
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { ClockIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../i18n';

export default function WaitTimeCounter({ fridgeOutDatetime, compact = false }) {
  const { t } = useLanguage();
  const [timeRemaining, setTimeRemaining] = useState(null);

  const calculateTimeRemaining = useCallback(() => {
    if (!fridgeOutDatetime) return null;

    const fridgeOut = new Date(fridgeOutDatetime);
    const readyTime = new Date(fridgeOut.getTime() + 4 * 60 * 60 * 1000); // 4 horas después
    const limitTime = new Date(fridgeOut.getTime() + 24 * 60 * 60 * 1000); // 24 horas límite
    const now = new Date();
    const diff = readyTime.getTime() - now.getTime();
    const exceeded24h = now.getTime() >= limitTime.getTime();
    const hoursInAmbientacion = Math.floor((now.getTime() - fridgeOut.getTime()) / (1000 * 60 * 60));

    if (diff <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, completed: true, exceeded24h, hoursInAmbientacion };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, completed: false, exceeded24h, hoursInAmbientacion };
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
    if (timeRemaining.exceeded24h) {
      return (
        <div className="flex items-center space-x-1">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-400 animate-pulse" />
          <span className="text-xs font-bold text-red-400">24h+ {t('waitTime.remove')}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-1">
        {timeRemaining.completed ? (
          <>
            <CheckCircleIcon className="h-4 w-4 text-green-400" />
            <span className="text-xs font-medium text-green-400">{t('waitTime.ready')}</span>
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

  if (timeRemaining.exceeded24h) {
    return (
      <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-red-900/50 border border-red-700">
        <ExclamationTriangleIcon className="h-5 w-5 text-red-400 animate-pulse" />
        <div className="flex flex-col">
          <span className="text-xs text-red-400 font-bold">{t('waitTime.exceeded')}</span>
          <span className="text-xs text-red-300">{t('waitTime.exceededDesc', { hours: timeRemaining.hoursInAmbientacion })}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white">
      {timeRemaining.completed ? (
        <>
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
          <span className="text-sm font-medium text-green-400">{t('waitTime.ready')}</span>
        </>
      ) : (
        <>
          <ClockIcon className="h-5 w-5 text-yellow-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs text-gray-600/50">{t('waitTime.remaining')}:</span>
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
