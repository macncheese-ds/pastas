/**
 * =====================================================
 * Componente: Modal de Apertura con Selección de Línea
 * =====================================================
 * Modal para confirmar apertura de pasta y seleccionar línea SMT
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { SolderPaste, SMTLocation } from '@/types';
import { formatDateTime } from '@/lib/qrParser';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowRightIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

interface OpenPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (smtLocation: SMTLocation) => void;
  paste: SolderPaste | null;
  isLoading?: boolean;
}

// Tipo para línea autorizada
interface AuthorizedLine {
  line_id: number;
  line_number: number;
  line_name: string;
  smt_location: SMTLocation;
}

// Colores para cada ubicación SMT
const SMT_LOCATION_COLORS: Record<SMTLocation, { selected: string; unselected: string }> = {
  'SMT': { 
    selected: 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400', 
    unselected: 'bg-neutral-700 text-blue-300 border-blue-700 hover:bg-blue-900/50' 
  },
  'SMT2': { 
    selected: 'bg-green-600 text-white border-green-500 ring-2 ring-green-400', 
    unselected: 'bg-neutral-700 text-green-300 border-green-700 hover:bg-green-900/50' 
  },
  'SMT3': { 
    selected: 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-400', 
    unselected: 'bg-neutral-700 text-purple-300 border-purple-700 hover:bg-purple-900/50' 
  },
  'SMT4': { 
    selected: 'bg-orange-600 text-white border-orange-500 ring-2 ring-orange-400', 
    unselected: 'bg-neutral-700 text-orange-300 border-orange-700 hover:bg-orange-900/50' 
  },
};

export default function OpenPasteModal({
  isOpen,
  onClose,
  onConfirm,
  paste,
  isLoading = false,
}: OpenPasteModalProps) {
  const [selectedLine, setSelectedLine] = useState<SMTLocation | null>(null);
  const [authorizedLines, setAuthorizedLines] = useState<AuthorizedLine[]>([]);
  const [isLoadingLines, setIsLoadingLines] = useState(false);
  const [lineError, setLineError] = useState('');

  // Función para obtener las líneas autorizadas para el número de parte
  const fetchAuthorizedLines = useCallback(async (partNumber: string) => {
    setIsLoadingLines(true);
    setLineError('');
    setAuthorizedLines([]);
    setSelectedLine(null);

    try {
      const response = await fetch('/api/part-lines');
      const data = await response.json();

      if (data.success && data.data) {
        const { partNumbers, productionLines } = data.data;
        
        // Buscar el número de parte (case insensitive)
        const normalizedPartNumber = partNumber.trim().toUpperCase();
        const matchedPart = partNumbers.find(
          (p: { part_number: string }) => p.part_number.toUpperCase() === normalizedPartNumber
        );

        if (matchedPart && matchedPart.lines.length > 0) {
          // Mapear las líneas autorizadas con su ubicación SMT
          const lines: AuthorizedLine[] = matchedPart.lines.map((l: { line_id: number; line_number: number; line_name: string }) => {
            const prodLine = productionLines.find((pl: { id: number }) => pl.id === l.line_id);
            return {
              line_id: l.line_id,
              line_number: l.line_number,
              line_name: l.line_name,
              smt_location: prodLine?.smt_location || `SMT${l.line_number > 1 ? l.line_number : ''}` as SMTLocation,
            };
          });
          
          setAuthorizedLines(lines);
          
          // Si solo hay una línea, seleccionarla automáticamente
          if (lines.length === 1) {
            setSelectedLine(lines[0].smt_location);
          }
        } else {
          // El número de parte no está registrado - mostrar todas las líneas
          const allLines: AuthorizedLine[] = productionLines.map((pl: { id: number; line_number: number; line_name: string; smt_location: string }) => ({
            line_id: pl.id,
            line_number: pl.line_number,
            line_name: pl.line_name,
            smt_location: pl.smt_location as SMTLocation,
          }));
          setAuthorizedLines(allLines);
          setLineError('Número de parte no registrado. Seleccione la línea manualmente.');
        }
      }
    } catch (error) {
      console.error('Error fetching authorized lines:', error);
      setLineError('Error al cargar líneas autorizadas');
    } finally {
      setIsLoadingLines(false);
    }
  }, []);

  // Cargar líneas autorizadas cuando se abre el modal
  useEffect(() => {
    if (isOpen && paste?.part_number) {
      fetchAuthorizedLines(paste.part_number);
    }
  }, [isOpen, paste?.part_number, fetchAuthorizedLines]);

  // Limpiar al cerrar el modal
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setSelectedLine(null);
        setAuthorizedLines([]);
        setLineError('');
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!paste) return null;

  const handleConfirm = () => {
    if (!selectedLine) {
      setLineError('Debe seleccionar una línea de producción');
      return;
    }
    setLineError('');
    onConfirm(selectedLine);
  };

  const handleLineSelect = (line: AuthorizedLine) => {
    setSelectedLine(line.smt_location);
    setLineError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apertura de Pasta - Asignar Línea" size="lg">
      <div className="space-y-6">
        {/* Información de la pasta */}
        <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <span className="text-neutral-400">DID:</span>
              <span className="ml-2 font-medium text-blue-400">{paste.did}</span>
            </div>
            <div>
              <span className="text-neutral-400">Lote:</span>
              <span className="ml-2 font-medium text-white">{paste.lot_number}</span>
            </div>
            <div>
              <span className="text-neutral-400">Serial:</span>
              <span className="ml-2 font-medium text-white">{paste.lot_serial}</span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-400">Número de Parte:</span>
              <span className="ml-2 font-medium text-white">{paste.part_number}</span>
            </div>
          </div>
        </div>

        {/* Estado actual y siguiente */}
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <p className="text-xs text-neutral-400 mb-1">Estado actual</p>
            <StatusBadge status={paste.status} />
          </div>
          <ArrowRightIcon className="h-5 w-5 text-neutral-500" />
          <div className="text-center">
            <p className="text-xs text-neutral-400 mb-1">Siguiente estado</p>
            <span className="inline-flex items-center rounded-full bg-purple-900/50 px-2.5 py-1 text-sm font-medium text-purple-300 border border-purple-700">
              Abierto
            </span>
          </div>
        </div>

        {/* Selector de Línea SMT - OBLIGATORIO */}
        <div className="rounded-lg border-2 border-amber-700 bg-amber-900/20 p-4">
          <div className="flex items-center mb-3">
            <MapPinIcon className="h-5 w-5 text-amber-400 mr-2" />
            <span className="text-sm font-medium text-amber-300">
              Seleccionar Línea de Producción <span className="text-red-400">*</span>
            </span>
          </div>
          
          {isLoadingLines ? (
            <div className="flex items-center justify-center py-4">
              <svg className="animate-spin h-5 w-5 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-neutral-400">Cargando líneas autorizadas...</span>
            </div>
          ) : authorizedLines.length > 0 ? (
            <>
              {lineError && !lineError.includes('Número de parte no registrado') && (
                <p className="mb-3 flex items-center text-sm text-red-400">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {lineError}
                </p>
              )}
              {lineError.includes('Número de parte no registrado') && (
                <div className="mb-3 p-2 rounded bg-yellow-900/30 border border-yellow-700">
                  <p className="flex items-center text-sm text-yellow-400">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {lineError}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {authorizedLines.map((line) => {
                  const isSelected = selectedLine === line.smt_location;
                  const colors = SMT_LOCATION_COLORS[line.smt_location] || SMT_LOCATION_COLORS['SMT'];
                  
                  return (
                    <button
                      key={line.line_id}
                      type="button"
                      onClick={() => handleLineSelect(line)}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                        ${isSelected ? colors.selected : colors.unselected}
                      `}
                    >
                      <span className="text-xl font-bold">{line.smt_location}</span>
                      <span className="text-xs opacity-75 mt-1">{line.line_name}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-neutral-400 text-center">
                La pasta se asignará a esta línea de producción
              </p>
            </>
          ) : (
            <p className="text-sm text-neutral-400 py-2">
              No hay líneas configuradas para este número de parte.
            </p>
          )}
        </div>

        {/* Historial de timestamps */}
        <div className="space-y-2 text-sm">
          <h4 className="font-medium text-neutral-300">Historial:</h4>
          <div className="rounded-lg bg-neutral-800 p-3 space-y-1 text-neutral-300">
            {paste.fridge_in_datetime && (
              <p><span className="text-neutral-500">Entrada refrigerador:</span> {formatDateTime(paste.fridge_in_datetime)}</p>
            )}
            {paste.fridge_out_datetime && (
              <p><span className="text-neutral-500">Salida refrigerador:</span> {formatDateTime(paste.fridge_out_datetime)}</p>
            )}
            {paste.mixing_start_datetime && (
              <p><span className="text-neutral-500">Inicio mezclado:</span> {formatDateTime(paste.mixing_start_datetime)}</p>
            )}
            {paste.viscosity_datetime && (
              <p><span className="text-neutral-500">Viscosidad:</span> {paste.viscosity_value} @ {formatDateTime(paste.viscosity_datetime)}</p>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 border border-neutral-600 rounded-md shadow-sm hover:bg-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <XCircleIcon className="h-4 w-4 mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !selectedLine}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Confirmar Apertura
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
