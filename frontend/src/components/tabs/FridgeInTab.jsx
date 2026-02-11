/**
 * =====================================================
 * Fridge In Tab Component - Main scanning workflow
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react';
import QRScannerInput from '../scanner/QRScannerInput';
import PasteTableWithTabs from '../table/PasteTableWithTabs';
import {
  NewPasteModal,
  ScanActionModal,
  ViscosityModal,
  CompletedModal,
  WaitTimeModal,
  ManualEntryModal,
  OpenPasteModal,
  PasteDetailsModal,
  LoginModal,
  EditDidModal,
  DeviationModal,
  AmbientacionExceededModal,
} from '../modals';
import { parseQRCode, canStartMixing } from '../../lib/qrParser';
import { STATUS_NEXT_ACTIONS } from '../../types';
import { getSmtLocation } from '../../config/smtMapping';
import { login, updatePasteDid } from '../../api';
import {
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function FridgeInTab({ smtLocation }) {
  // Data state
  const [pastes, setPastes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showNewPasteModal, setShowNewPasteModal] = useState(false);
  const [showScanActionModal, setShowScanActionModal] = useState(false);
  const [showViscosityModal, setShowViscosityModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showWaitTimeModal, setShowWaitTimeModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showOpenPasteModal, setShowOpenPasteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showEditDidModal, setShowEditDidModal] = useState(false);
  const [showDeviationModal, setShowDeviationModal] = useState(false);
  const [showAmbientacionModal, setShowAmbientacionModal] = useState(false);
  const [ambientacionHours, setAmbientacionHours] = useState(0);
  const [isDeviationForNewPaste, setIsDeviationForNewPaste] = useState(false);
  
  // Working data
  const [parsedQRData, setParsedQRData] = useState(null);
  const [selectedPaste, setSelectedPaste] = useState(null);
  const [authorizedLines, setAuthorizedLines] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingDeviationAction, setPendingDeviationAction] = useState(null);
  
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // Fetch pastes
  const fetchPastes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const url = smtLocation 
        ? `/api/pastes?smt_location=${encodeURIComponent(smtLocation)}`
        : '/api/pastes';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar las pastas');
      const result = await response.json();
      // Handle both wrapped and direct array responses
      setPastes(result.data || result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [smtLocation]);

  useEffect(() => {
    fetchPastes();
  }, [fetchPastes]);

  // Fetch authorized lines for a part number
  const fetchAuthorizedLines = async (partNumber) => {
    try {
      const response = await fetch(`/api/part-lines/authorized?part_number=${encodeURIComponent(partNumber)}`);
      if (response.ok) {
        const result = await response.json();
        setAuthorizedLines(result.data || result);
      }
    } catch (err) {
      console.error('Error fetching authorized lines:', err);
      setAuthorizedLines([]);
    }
  };

  // Handle login
  const handleLogin = async (credentials) => {
    try {
      const result = await login(credentials);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setShowLoginModal(false);
        
        // Execute pending action if any
        if (pendingAction) {
          await pendingAction(result.user);
          setPendingAction(null);
        }
      }
    } catch (err) {
      throw err; // Re-throw to be handled by LoginModal
    }
  };

  // Request authentication before an action
  const requireAuth = (actionFn) => {
    // For each action, create a wrapper that requests login first
    setPendingAction(() => actionFn);
    setShowLoginModal(true);
  };

  // Handle QR scan
  const handleScan = async (qrData) => {
    try {
      setError(null); // Clear any previous errors
      
      // Try to parse as QR code first
      let parsed = null;
      try {
        parsed = parseQRCode(qrData);
      } catch (parseErr) {
        // If it fails to parse, might be just a DID string - try to look it up
        const existingResponse = await fetch(`/api/pastes?did=${encodeURIComponent(qrData)}`);
        if (existingResponse.ok) {
          const result = await existingResponse.json();
          const existingPastes = result.data || result;
          if (Array.isArray(existingPastes) && existingPastes.length > 0) {
            const paste = existingPastes[0];
            setSelectedPaste(paste);
            
            // Check if paste is discarded
            if (paste.status === 'discarded') {
              setError('Esta pasta fue descartada y no puede ser utilizada.\n\nRazón: ' + (paste.discarded_reason || 'No especificada'));
              return;
            }
            
            // Determine which action to show based on status
            switch (paste.status) {
              case 'in_fridge':
                setShowScanActionModal(true);
                break;
              case 'out_fridge':
                // Check 24h exceeded first
                if (paste.fridge_out_datetime) {
                  const elapsed = new Date().getTime() - new Date(paste.fridge_out_datetime).getTime();
                  const hoursElapsed = elapsed / (60 * 60 * 1000);
                  setAmbientacionHours(hoursElapsed);
                  setShowAmbientacionModal(true);
                  return;
                }
                if (canStartMixing(paste.fridge_out_datetime)) {
                  setShowScanActionModal(true);
                } else {
                  setShowWaitTimeModal(true);
                }
                break;
              case 'mixing':
                setShowViscosityModal(true);
                break;
              case 'viscosity_ok':
                await fetchAuthorizedLines(paste.part_number);
                setShowOpenPasteModal(true);
                break;
              case 'opened':
                setShowCompletedModal(true);
                break;
              case 'rejected':
                setShowViscosityModal(true);
                break;
              default:
                setShowScanActionModal(true);
            }
            return;
          }
        }
        // Neither QR parse nor DID lookup worked - show error
        setShowNewPasteModal(false); // Close any open modals
        setError(parseErr.message || 'Error al procesar el código QR. Use el ingreso manual si es necesario.');
        return;
      }

      // QR parsed successfully - check if it already exists in database
      if (parsed) {
        const existingResponse = await fetch(
          `/api/pastes?lot_number=${encodeURIComponent(parsed.lotNumber)}&lot_serial=${encodeURIComponent(parsed.lotSerial)}`
        );
        if (existingResponse.ok) {
          const result = await existingResponse.json();
          const existingPaste = result.data;
          
          // Check if paste exists (will be object for single paste, null if not found)
          if (existingPaste && existingPaste.id) {
            setSelectedPaste(existingPaste);
            
            // Check if paste is discarded
            if (existingPaste.status === 'discarded') {
              setError('Esta pasta fue descartada y no puede ser utilizada.\n\nRazón: ' + (existingPaste.discarded_reason || 'No especificada'));
              return;
            }
            
            // Determine which action to show based on status
            switch (existingPaste.status) {
              case 'in_fridge':
                setShowScanActionModal(true);
                break;
              case 'out_fridge':
                // Check 24h exceeded first
                if (existingPaste.fridge_out_datetime) {
                  const elapsed = new Date().getTime() - new Date(existingPaste.fridge_out_datetime).getTime();
                  const hoursElapsed = elapsed / (60 * 60 * 1000);
                  setAmbientacionHours(hoursElapsed);
                  setShowAmbientacionModal(true);
                  return;
                }
                if (canStartMixing(existingPaste.fridge_out_datetime)) {
                  setShowScanActionModal(true);
                } else {
                  setShowWaitTimeModal(true);
                }
                break;
              case 'mixing':
                setShowViscosityModal(true);
                break;
              case 'viscosity_ok':
                await fetchAuthorizedLines(existingPaste.part_number);
                setShowOpenPasteModal(true);
                break;
              case 'opened':
                setShowCompletedModal(true);
                break;
              case 'rejected':
                setShowViscosityModal(true);
                break;
              default:
                setShowScanActionModal(true);
            }
            return;
          }
        }

        // Paste doesn't exist - show new paste creation modal
        setParsedQRData(parsed);
        setShowNewPasteModal(true);
      }
    } catch (err) {
      setError(err.message || 'Error al procesar el escaneo');
    }
  };

  // Create new paste
  const handleCreatePaste = async (did, manufactureDate = null) => {
    if (!parsedQRData) return;
    
    // Require authentication
    requireAuth(async (user) => {
      setIsProcessing(true);
      try {
        const response = await fetch('/api/pastes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            did,
            lot_number: parsedQRData.lotNumber,
            lot_serial: parsedQRData.lotSerial,
            part_number: parsedQRData.partNumber,
            manufacture_date: manufactureDate || parsedQRData.manufactureDate,
            expiration_date: parsedQRData.expirationDate,
            user_name: user.nombre,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          console.log('[DEBUG] POST /pastes error response:', errData);
          
          // Check if this is an expired paste requiring deviation
          const requiresDeviation = errData?.data?.requiresDeviation;
          const pasteData = errData?.data?.pasteData;
          
          if (requiresDeviation && pasteData) {
            console.log('[DEBUG] ✓ PASTA VENCIDA - SHOWING DEVIATION MODAL');
            setShowNewPasteModal(false);
            setSelectedPaste({
              ...pasteData,
              id: null,
              expiration_date: pasteData.expiration_date,
            });
            setIsDeviationForNewPaste(true);
            setShowDeviationModal(true);
            setIsProcessing(false);
            setParsedQRData(null);
            console.log('[DEBUG] DeviationModal showing with pasteData:', pasteData);
            return;
          }
          
          throw new Error(errData.error || 'Error al crear la pasta');
        }

        setShowNewPasteModal(false);
        setParsedQRData(null);
        fetchPastes();
      } catch (err) {
        // Close all modals and show error
        setShowScanActionModal(false);
        setShowViscosityModal(false);
        setShowOpenPasteModal(false);
        setShowCompletedModal(false);
        setShowWaitTimeModal(false);
        setShowNewPasteModal(false);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Handle manual entry
  const handleManualEntry = async (data) => {
    // Require authentication
    requireAuth(async (user) => {
      setIsProcessing(true);
      try {
        const response = await fetch('/api/pastes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            did: data.did,
            lot_number: data.lotNumber,
            lot_serial: data.lotSerial,
            part_number: data.partNumber,
            manufacture_date: data.manufactureDate,
            expiration_date: data.expirationDate,
            user_name: user.nombre,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          console.log('[DEBUG] Manual entry error response:', errData);
          
          // Check if pasta is expired and requires deviation
          const requiresDeviation = errData?.data?.requiresDeviation;
          const pasteData = errData?.data?.pasteData;
          
          if (requiresDeviation && pasteData) {
            console.log('[DEBUG] ✓ PASTA VENCIDA (Manual) - SHOWING DEVIATION MODAL');
            setShowManualEntryModal(false);
            setSelectedPaste({
              ...pasteData,
              id: null,
              expiration_date: pasteData.expiration_date,
            });
            setIsDeviationForNewPaste(true);
            setShowDeviationModal(true);
            setIsProcessing(false);
            console.log('[DEBUG] DeviationModal showing with pasteData:', pasteData);
            return;
          }
          
          throw new Error(errData.error || 'Error al crear la pasta');
        }

        setShowManualEntryModal(false);
        fetchPastes();
      } catch (err) {
        // Close all modals and show error
        setShowScanActionModal(false);
        setShowViscosityModal(false);
        setShowOpenPasteModal(false);
        setShowCompletedModal(false);
        setShowWaitTimeModal(false);
        setShowNewPasteModal(false);
        setShowManualEntryModal(false);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Scan action (advance status)
  const handleScanAction = async () => {
    if (!selectedPaste) return;
    
    // Require authentication
    requireAuth(async (user) => {
      setIsProcessing(true);
      try {
        // Derive the expected scan_type from the current status
        const statusKey = selectedPaste.status || 'new';
        const nextAction = STATUS_NEXT_ACTIONS[statusKey];
        const scanType = nextAction?.actionType || null;

        if (!scanType) {
          throw new Error('Tipo de escaneo no determinado para este estado');
        }

        const response = await fetch(`/api/pastes/${selectedPaste.id}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            scan_type: scanType,
            user_name: user.nombre,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          // Check if ambientacion exceeded - show special modal
          if (errData.data?.ambientacionExceeded) {
            setShowScanActionModal(false);
            setAmbientacionHours(errData.data.hoursElapsed || 24);
            setShowAmbientacionModal(true);
            return;
          }
          // Check if this is an expiration error requiring deviation
          if (errData.data && errData.data.requiresDeviation) {
            setShowScanActionModal(false);
            if (errData.data.pasteData) {
              setSelectedPaste(errData.data.pasteData);
              setIsDeviationForNewPaste(true);
            }
            setPendingDeviationAction(() => async () => {
              await handleScanAction();
            });
            setShowDeviationModal(true);
            return;
          }
          throw new Error(errData.error || 'Error al procesar la acción');
        }

        setShowScanActionModal(false);
        setSelectedPaste(null);
        fetchPastes();
      } catch (err) {
        // Close all modals and show error
        setShowScanActionModal(false);
        setShowViscosityModal(false);
        setShowOpenPasteModal(false);
        setShowCompletedModal(false);
        setShowWaitTimeModal(false);
        setShowNewPasteModal(false);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Submit viscosity
  const handleViscositySubmit = async (value) => {
    if (!selectedPaste) return;
    
    // Require authentication
    requireAuth(async (user) => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/pastes/${selectedPaste.id}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            scan_type: 'viscosity_check', 
            viscosity_value: value,
            user_name: user.nombre,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          // Check if ambientacion exceeded
          if (errData.data?.ambientacionExceeded) {
            setShowViscosityModal(false);
            setAmbientacionHours(errData.data.hoursElapsed || 24);
            setShowAmbientacionModal(true);
            return;
          }
          // Check if this is an expiration error requiring deviation
          if (errData.data && errData.data.requiresDeviation) {
            setShowViscosityModal(false);
            if (errData.data.pasteData) {
              setSelectedPaste(errData.data.pasteData);
              setIsDeviationForNewPaste(true);
            }
            setPendingDeviationAction(() => async () => {
              await handleViscositySubmit(value);
            });
            setShowDeviationModal(true);
            return;
          }
          const serverMsg = errData.error || errData.message || (errData.data && errData.data.message) || JSON.stringify(errData);
          throw new Error(serverMsg || 'Error al registrar la viscosidad');
        }

        setShowViscosityModal(false);
        setSelectedPaste(null);
        fetchPastes();
      } catch (err) {
        setShowScanActionModal(false);
        setShowViscosityModal(false);
        setShowOpenPasteModal(false);
        setShowCompletedModal(false);
        setShowWaitTimeModal(false);
        setShowNewPasteModal(false);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Open paste
  const handleOpenPaste = async (selectedSmtLocation) => {
    if (!selectedPaste) return;
    
    // Require authentication
    requireAuth(async (user) => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/pastes/${selectedPaste.id}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            scan_type: 'opened', 
            smt_location: selectedSmtLocation,
            user_name: user.nombre,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          // Check if ambientacion exceeded
          if (errData.data?.ambientacionExceeded) {
            setShowOpenPasteModal(false);
            setAmbientacionHours(errData.data.hoursElapsed || 24);
            setShowAmbientacionModal(true);
            return;
          }
          // Check if this is an expiration error requiring deviation
          if (errData.data && errData.data.requiresDeviation) {
            setShowOpenPasteModal(false);
            if (errData.data.pasteData) {
              setSelectedPaste(errData.data.pasteData);
              setIsDeviationForNewPaste(true);
            }
            setPendingDeviationAction(() => async () => {
              await handleOpenPaste(selectedSmtLocation);
            });
            setShowDeviationModal(true);
            return;
          }
          const serverMsg = errData.error || errData.message || (errData.data && errData.data.message) || JSON.stringify(errData);
          throw new Error(serverMsg || 'Error al abrir la pasta');
        }

        setShowOpenPasteModal(false);
        setSelectedPaste(null);
        fetchPastes();
      } catch (err) {
        setShowScanActionModal(false);
        setShowViscosityModal(false);
        setShowOpenPasteModal(false);
        setShowCompletedModal(false);
        setShowWaitTimeModal(false);
        setShowNewPasteModal(false);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Complete/remove paste
  const handleCompletePaste = async () => {
    if (!selectedPaste) return;
    
    // Require authentication
    requireAuth(async (user) => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/pastes/${selectedPaste.id}/scan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            scan_type: 'removed',
            user_name: user.nombre,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Error al retirar la pasta');
        }

        setShowCompletedModal(false);
        setSelectedPaste(null);
        fetchPastes();
      } catch (err) {
        // Close all modals and show error
        setShowScanActionModal(false);
        setShowViscosityModal(false);
        setShowOpenPasteModal(false);
        setShowCompletedModal(false);
        setShowWaitTimeModal(false);
        setShowNewPasteModal(false);
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    });
  };

  // Handle DID update
  const handleUpdateDid = async (pasteId, newDid) => {
    try {
      setIsProcessing(true);
      const result = await updatePasteDid(pasteId, newDid);
      if (result.success) {
        await fetchPastes();
        setShowEditDidModal(false);
        setSelectedPaste(null);
      }
    } catch (err) {
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle table row actions
  const handleTableAction = async (paste, action) => {
    setSelectedPaste(paste);
    
    switch (action) {
      case 'view':
        setShowDetailsModal(true);
        break;
      case 'editDid':
        setShowEditDidModal(true);
        break;
      case 'scan':
        // Check if paste is discarded
        if (paste.status === 'discarded') {
          setError('Esta pasta fue descartada y no puede ser utilizada');
          setSelectedPaste(null);
          return;
        }
        // Check 24h exceeded for out_fridge
        if (paste.status === 'out_fridge' && paste.fridge_out_datetime) {
          const elapsed = new Date().getTime() - new Date(paste.fridge_out_datetime).getTime();
          if (elapsed >= 24 * 60 * 60 * 1000) {
            setAmbientacionHours(Math.floor(elapsed / (60 * 60 * 1000)));
            setShowAmbientacionModal(true);
            return;
          }
        }
        if (paste.status === 'out_fridge' && !canStartMixing(paste.fridge_out_datetime)) {
          setShowWaitTimeModal(true);
        } else if (paste.status === 'mixing' || paste.status === 'rejected') {
          setShowViscosityModal(true);
        } else if (paste.status === 'viscosity_ok') {
          await fetchAuthorizedLines(paste.part_number);
          setShowOpenPasteModal(true);
        } else if (paste.status === 'opened') {
          setShowCompletedModal(true);
        } else {
          setShowScanActionModal(true);
        }
        break;
      case 'viscosity':
        setShowViscosityModal(true);
        break;
      case 'open':
        await fetchAuthorizedLines(paste.part_number);
        setShowOpenPasteModal(true);
        break;
      case 'complete':
        setShowCompletedModal(true);
        break;
      default:
        break;
    }
  };

  // Handle deviation authorization
  const handleDeviationAuthorized = async (data) => {
    setShowDeviationModal(false);
    setIsDeviationForNewPaste(false);
    setParsedQRData(null);
    // Refresh paste data and retry pending action
    await fetchPastes();
    
    if (pendingDeviationAction) {
      const action = pendingDeviationAction;
      setPendingDeviationAction(null);
      // Re-fetch the selected paste with updated deviation status
      try {
        const response = await fetch(`/api/pastes/${selectedPaste.id}`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setSelectedPaste(result.data);
          }
        }
      } catch (err) {
        console.error('Error refetching paste:', err);
      }
    }
  };

  // Handle ambientacion exceeded retirement
  const handleAmbientacionRetired = async (data) => {
    setShowAmbientacionModal(false);
    setSelectedPaste(null);
    setAmbientacionHours(0);
    await fetchPastes();
  };

  // Handle paste returned to fridge
  const handleReturnedToFridge = async (data) => {
    setShowAmbientacionModal(false);
    setSelectedPaste(null);
    setAmbientacionHours(0);
    await fetchPastes();
  };

  return (
    <div className="space-y-6">
      {/* Scanner Section */}
      <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Escanear Pasta</h2>
          <button
            onClick={() => setShowManualEntryModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-neutral-300 bg-neutral-700 border border-neutral-600 rounded-md hover:bg-neutral-600 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            Ingreso Manual
          </button>
        </div>
        <QRScannerInput onScan={handleScan} />
        <p className="mt-2 text-xs text-neutral-500">
          Escanee el código QR de la pasta o el DID para continuar el proceso.
        </p>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-800 rounded-lg p-6 w-full max-w-sm border border-neutral-700 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">Error</h3>
            <p className="text-sm text-neutral-300 mb-6 whitespace-pre-wrap">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Pastes Table */}
      <div className="bg-neutral-800 rounded-lg border border-neutral-700">
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <h2 className="text-lg font-semibold text-white">
            Pastas en Proceso
            {smtLocation && (
              <span className="ml-2 text-sm font-normal text-purple-400">
                ({smtLocation})
              </span>
            )}
          </h2>
          <button
            onClick={fetchPastes}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-neutral-300 bg-neutral-700 border border-neutral-600 rounded-md hover:bg-neutral-600 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        
        <PasteTableWithTabs
          pastes={pastes}
          isLoading={isLoading}
          onAction={handleTableAction}
        />
      </div>

      {/* Modals */}
      <NewPasteModal
        isOpen={showNewPasteModal}
        onClose={() => {
          setShowNewPasteModal(false);
          setParsedQRData(null);
        }}
        onConfirm={handleCreatePaste}
        parsedData={parsedQRData}
        isLoading={isProcessing}
      />

      <ScanActionModal
        isOpen={showScanActionModal}
        onClose={() => {
          setShowScanActionModal(false);
          setSelectedPaste(null);
        }}
        onConfirm={handleScanAction}
        paste={selectedPaste}
        isLoading={isProcessing}
      />

      <ViscosityModal
        isOpen={showViscosityModal}
        onClose={() => {
          setShowViscosityModal(false);
          setSelectedPaste(null);
        }}
        onConfirm={handleViscositySubmit}
        paste={selectedPaste}
        isLoading={isProcessing}
      />

      <OpenPasteModal
        isOpen={showOpenPasteModal}
        onClose={() => {
          setShowOpenPasteModal(false);
          setSelectedPaste(null);
          setAuthorizedLines([]);
        }}
        onConfirm={handleOpenPaste}
        paste={selectedPaste}
        authorizedLines={authorizedLines}
        isLoading={isProcessing}
      />

      <CompletedModal
        isOpen={showCompletedModal}
        onClose={() => {
          setShowCompletedModal(false);
          setSelectedPaste(null);
        }}
        onConfirm={handleCompletePaste}
        paste={selectedPaste}
        isLoading={isProcessing}
      />

      <WaitTimeModal
        isOpen={showWaitTimeModal}
        onClose={() => {
          setShowWaitTimeModal(false);
          setSelectedPaste(null);
        }}
        paste={selectedPaste}
      />

      <ManualEntryModal
        isOpen={showManualEntryModal}
        onClose={() => setShowManualEntryModal(false)}
        onConfirm={handleManualEntry}
        isLoading={isProcessing}
      />

      <PasteDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedPaste(null);
        }}
        paste={selectedPaste}
      />

      <EditDidModal
        isOpen={showEditDidModal}
        onClose={() => {
          setShowEditDidModal(false);
          setSelectedPaste(null);
        }}
        onSave={handleUpdateDid}
        paste={selectedPaste}
      />

      <LoginModal
        visible={showLoginModal}
        onClose={() => {
          setShowLoginModal(false);
          setPendingAction(null);
        }}
        onConfirm={handleLogin}
        busy={isProcessing}
      />

      <DeviationModal
        isOpen={showDeviationModal}
        onClose={() => {
          setShowDeviationModal(false);
          setIsDeviationForNewPaste(false);
          setPendingDeviationAction(null);
          setParsedQRData(null);
        }}
        onAuthorized={handleDeviationAuthorized}
        paste={selectedPaste}
        isLoading={isProcessing}
        isNewPaste={isDeviationForNewPaste}
      />

      <AmbientacionExceededModal
        isOpen={showAmbientacionModal}
        onClose={() => {
          setShowAmbientacionModal(false);
          setSelectedPaste(null);
          setAmbientacionHours(0);
        }}
        onRetired={handleAmbientacionRetired}
        onReturnedToFridge={handleReturnedToFridge}
        paste={selectedPaste}
        hoursElapsed={ambientacionHours}
      />
    </div>
  );
}
