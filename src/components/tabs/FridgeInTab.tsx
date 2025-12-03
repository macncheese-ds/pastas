/**
 * =====================================================
 * Componente: Fridge In Tab
 * =====================================================
 * Pestaña principal con el flujo de escaneos
 * Incluye: DID obligatorio, validación de 4 horas, detección SMT
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import QRScannerInput from '@/components/scanner/QRScannerInput';
import PasteTable from '@/components/table/PasteTable';
import NewPasteModal from '@/components/modals/NewPasteModal';
import ScanActionModal from '@/components/modals/ScanActionModal';
import ViscosityModal from '@/components/modals/ViscosityModal';
import CompletedModal from '@/components/modals/CompletedModal';
import WaitTimeModal from '@/components/modals/WaitTimeModal';
import { SolderPaste, ParsedQRData, ApiResponse, ScanType } from '@/types';
import { parseQRCode } from '@/lib/qrParser';
import { detectSMTLocation } from '@/config/smtMapping';

// Tipos de modal
type ModalType = 'new' | 'action' | 'viscosity' | 'completed' | 'error' | 'waitTime' | null;

export default function FridgeInTab() {
  // Estado de datos
  const [pastes, setPastes] = useState<SolderPaste[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estado de modales
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [parsedQR, setParsedQR] = useState<ParsedQRData | null>(null);
  const [selectedPaste, setSelectedPaste] = useState<SolderPaste | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<number>(0);

  // Cargar datos iniciales
  const fetchPastes = useCallback(async () => {
    try {
      const response = await fetch('/api/pastes');
      const data: ApiResponse<SolderPaste[]> = await response.json();

      if (data.success && data.data) {
        setPastes(data.data);
      }
    } catch (error) {
      console.error('Error fetching pastes:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPastes();
  }, [fetchPastes]);

  // Manejar escaneo de QR
  const handleScan = async (qrData: string) => {
    try {
      // Parsear el código QR
      const parsed = parseQRCode(qrData);
      
      // Detectar ubicación SMT automáticamente
      const smtLocation = detectSMTLocation(parsed.partNumber);
      parsed.smtLocation = smtLocation;
      
      setParsedQR(parsed);

      // Buscar si existe en la base de datos
      const response = await fetch(
        `/api/pastes?lot_number=${encodeURIComponent(parsed.lotNumber)}&lot_serial=${encodeURIComponent(parsed.lotSerial)}`
      );
      const data: ApiResponse<SolderPaste | null> = await response.json();

      if (data.success && data.data) {
        // La pasta existe, determinar siguiente acción
        const paste = data.data;
        setSelectedPaste(paste);

        // Verificar estado y abrir modal correspondiente
        switch (paste.status) {
          case 'in_fridge':
            // Escaneo 2: Salida del refrigerador
            setActiveModal('action');
            break;
          case 'out_fridge':
            // Escaneo 3: Inicio de mezclado
            setActiveModal('action');
            break;
          case 'mixing':
          case 'rejected':
            // Escaneo 4: Registro de viscosidad
            setActiveModal('viscosity');
            break;
          case 'viscosity_ok':
            // Escaneo 5: Apertura
            setActiveModal('action');
            break;
          case 'opened':
            // Escaneo 6: Retiro
            setActiveModal('action');
            break;
          case 'removed':
            // Proceso completado
            setActiveModal('completed');
            break;
          default:
            setErrorMessage('Estado desconocido');
            setActiveModal('error');
        }
      } else {
        // La pasta no existe, abrir modal de nuevo registro
        setActiveModal('new');
      }
    } catch (error) {
      console.error('Error processing QR:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error al procesar el código QR');
      setActiveModal('error');
    }
  };

  // Crear nuevo registro con DID
  const handleCreatePaste = async (did: string) => {
    if (!parsedQR) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: did,
          lot_number: parsedQR.lotNumber,
          part_number: parsedQR.partNumber,
          lot_serial: parsedQR.lotSerial,
          manufacture_date: parsedQR.manufactureDate,
          expiration_date: parsedQR.expirationDate,
          smt_location: parsedQR.smtLocation,
        }),
      });

      const data: ApiResponse<SolderPaste> = await response.json();

      if (data.success && data.data) {
        // Agregar al inicio de la lista
        setPastes((prev) => [data.data!, ...prev]);
        setActiveModal(null);
        setParsedQR(null);
      } else {
        setErrorMessage(data.error || 'Error al crear el registro');
        setActiveModal('error');
      }
    } catch (error) {
      console.error('Error creating paste:', error);
      setErrorMessage('Error de conexión al crear el registro');
      setActiveModal('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Procesar acción de escaneo (salida, mezclado, apertura, retiro)
  const handleScanAction = async () => {
    if (!selectedPaste) return;

    setIsProcessing(true);
    try {
      // Determinar el tipo de escaneo según el estado actual
      let scanType: ScanType;
      switch (selectedPaste.status) {
        case 'in_fridge':
          scanType = 'fridge_out';
          break;
        case 'out_fridge':
          scanType = 'mixing_start';
          break;
        case 'viscosity_ok':
          scanType = 'opened';
          break;
        case 'opened':
          scanType = 'removed';
          break;
        default:
          throw new Error('Estado no válido para esta acción');
      }

      const response = await fetch(`/api/pastes/${selectedPaste.id}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scan_type: scanType }),
      });

      const data: ApiResponse<SolderPaste | { remainingMs: number; remainingTime: string }> = await response.json();

      if (data.success && data.data) {
        // Actualizar en la lista
        const updatedPaste = data.data as SolderPaste;
        setPastes((prev) =>
          prev.map((p) => (p.id === updatedPaste.id ? updatedPaste : p))
        );
        setActiveModal(null);
        setSelectedPaste(null);
      } else {
        // Verificar si es error de tiempo de espera (4 horas)
        if (data.data && 'remainingMs' in data.data) {
          setWaitTimeRemaining(data.data.remainingMs);
          setActiveModal('waitTime');
        } else {
          setErrorMessage(data.error || 'Error al procesar el escaneo');
          setActiveModal('error');
        }
      }
    } catch (error) {
      console.error('Error processing scan:', error);
      setErrorMessage('Error de conexión al procesar el escaneo');
      setActiveModal('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Procesar registro de viscosidad
  const handleViscosity = async (viscosityValue: number) => {
    if (!selectedPaste) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/pastes/${selectedPaste.id}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_type: 'viscosity_check',
          viscosity_value: viscosityValue,
        }),
      });

      const data: ApiResponse<SolderPaste> = await response.json();

      if (data.data) {
        // Actualizar en la lista
        setPastes((prev) =>
          prev.map((p) => (p.id === data.data!.id ? data.data! : p))
        );

        if (data.success) {
          // Viscosidad aprobada
          setActiveModal(null);
          setSelectedPaste(null);
        } else {
          // Viscosidad rechazada - mostrar error pero mantener modal
          setErrorMessage(data.error || 'Viscosidad fuera de rango');
          setSelectedPaste(data.data);
          // Mantener el modal abierto para que vea el rechazo
        }
      }
    } catch (error) {
      console.error('Error processing viscosity:', error);
      setErrorMessage('Error de conexión al registrar viscosidad');
      setActiveModal('error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Ver detalles de una pasta
  const handleViewPaste = (paste: SolderPaste) => {
    setSelectedPaste(paste);
    setActiveModal('completed');
  };

  // Eliminar pasta
  const handleDeletePaste = async (paste: SolderPaste) => {
    if (!confirm(`¿Está seguro de eliminar el registro ${paste.lot_number}-${paste.lot_serial}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/pastes/${paste.id}`, {
        method: 'DELETE',
      });

      const data: ApiResponse = await response.json();

      if (data.success) {
        setPastes((prev) => prev.filter((p) => p.id !== paste.id));
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting paste:', error);
      alert('Error de conexión al eliminar');
    }
  };

  // Cerrar modal
  const closeModal = () => {
    setActiveModal(null);
    setParsedQR(null);
    setSelectedPaste(null);
    setErrorMessage('');
    setWaitTimeRemaining(0);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Input - Siempre Escuchando */}
      <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Escáner QR Activo
          </h2>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
            Siempre escuchando
          </span>
        </div>
        <QRScannerInput
          onScan={handleScan}
          placeholder="Apunte el escáner al código QR - detección automática..."
        />
        <p className="mt-3 text-sm text-neutral-400">
          📡 El sistema detecta automáticamente los escaneos. Solo apunte el lector al código QR.
        </p>
      </div>

      {/* Tabla de registros */}
      <div className="bg-neutral-800 rounded-lg shadow-sm border border-neutral-700">
        <div className="px-6 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-semibold text-white">
            Registros de Pasta
          </h2>
        </div>
        <PasteTable
          pastes={pastes}
          onView={handleViewPaste}
          onDelete={handleDeletePaste}
          isLoading={isLoading}
        />
      </div>

      {/* Modales */}
      <NewPasteModal
        isOpen={activeModal === 'new'}
        onClose={closeModal}
        onConfirm={handleCreatePaste}
        parsedData={parsedQR}
        isLoading={isProcessing}
      />

      <ScanActionModal
        isOpen={activeModal === 'action'}
        onClose={closeModal}
        onConfirm={handleScanAction}
        paste={selectedPaste}
        isLoading={isProcessing}
      />

      <ViscosityModal
        isOpen={activeModal === 'viscosity'}
        onClose={closeModal}
        onConfirm={handleViscosity}
        paste={selectedPaste}
        isLoading={isProcessing}
      />

      <CompletedModal
        isOpen={activeModal === 'completed'}
        onClose={closeModal}
        paste={selectedPaste}
      />

      <WaitTimeModal
        isOpen={activeModal === 'waitTime'}
        onClose={closeModal}
        paste={selectedPaste}
        remainingMs={waitTimeRemaining}
      />

      {/* Modal de error */}
      {activeModal === 'error' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-70" onClick={closeModal} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative max-w-md w-full bg-neutral-800 rounded-lg shadow-xl p-6 border border-neutral-700">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 mb-4">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Error</h3>
                <p className="text-sm text-neutral-400 mb-4">{errorMessage}</p>
                <button
                  onClick={closeModal}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
