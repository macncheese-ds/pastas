/**
 * =====================================================
 * Modal Component
 * =====================================================
 */

import { useEffect, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) {
  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative ${sizeClasses[size]} w-full transform overflow-hidden rounded-lg bg-[#0f1d33] border border-blue-900/40 shadow-xl transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-blue-900/40 px-6 py-4">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="rounded-md p-1 text-blue-300/50 hover:bg-blue-900/30 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          <div className="px-6 py-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
