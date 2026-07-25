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
import { useLanguage } from '../../i18n';
import {
  PlusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function FridgeInTab({ smtLocation }) {
  const { t } = useLanguage();
  // refreshKey is incremented after each scan action to trigger table re-fetch
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

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
  const [inheritedViscosity, setInheritedViscosity] = useState(null);

  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  // Fetch pastes — only used for the QR scan modal flow (checking existing pastes)
  // The table itself fetches its own data per-tab via PasteTableWithTabs
  const fetchPasteByLot = useCallback(async (lotNumber, lotSerial) => {
    const url = `/api/pastes?lot_number=${encodeURIComponent(lotNumber)}&lot_serial=${encodeURIComponent(lotSerial)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(t('errors.loadPastes'));
    const result = await response.json();
    return result.data || null;
  }, [t]);

  const fetchPasteByDid = useCallback(async (did) => {
    const url = `/api/pastes?did=${encodeURIComponent(did)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(t('errors.loadPastes'));
    const result = await response.json();
    const items = result.data || result;
    return Array.isArray(items) ? items[0] || null : items;
  }, [t]);

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
              setError(t('errors.pastDiscarded') + '\n\n' + t('errors.discardReason') + ' ' + (paste.discarded_reason || t('errors.notSpecified')));
              return;
            }

            // Determine which action to show based on status
            switch (paste.status) {
              case 'in_fridge':
                setShowScanActionModal(true);
                break;
              case 'out_fridge': {
                // Always show ambientacion modal for out_fridge pastes (allows return-to-fridge at any time)
                const elapsed = paste.fridge_out_datetime
                  ? (new Date().getTime() - new Date(paste.fridge_out_datetime).getTime()) / (60 * 60 * 1000)
                  : 0;
                setAmbientacionHours(elapsed);
                setShowAmbientacionModal(true);
                break;
              }
              case 'mixing':
                openViscosityModalWithAutoCheck(paste);
                break;
              case 'viscosity_ok':
                await fetchAuthorizedLines(paste.part_number);
                setShowOpenPasteModal(true);
                break;
              case 'opened':
                setShowCompletedModal(true);
                break;
              case 'rejected':
                openViscosityModalWithAutoCheck(paste);
                break;
              default:
                setShowScanActionModal(true);
            }
            return;
          }
        }
        // Neither QR parse nor DID lookup worked - show error
        setShowNewPasteModal(false); // Close any open modals
        setError(parseErr.message || t('errors.processScan'));
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
              setError(t('errors.pastDiscarded') + '\n\n' + t('errors.discardReason') + ' ' + (existingPaste.discarded_reason || t('errors.notSpecified')));
              return;
            }

            // Determine which action to show based on status
            switch (existingPaste.status) {
              case 'in_fridge':
                setShowScanActionModal(true);
                break;
              case 'out_fridge': {
                // Always show ambientacion modal for out_fridge pastes (allows return-to-fridge at any time)
                const elapsed2 = existingPaste.fridge_out_datetime
                  ? (new Date().getTime() - new Date(existingPaste.fridge_out_datetime).getTime()) / (60 * 60 * 1000)
                  : 0;
                setAmbientacionHours(elapsed2);
                setShowAmbientacionModal(true);
                break;
              }
              case 'mixing':
                openViscosityModalWithAutoCheck(existingPaste);
                break;
              case 'viscosity_ok':
                await fetchAuthorizedLines(existingPaste.part_number);
                setShowOpenPasteModal(true);
                break;
              case 'opened':
                setShowCompletedModal(true);
                break;
              case 'rejected':
                openViscosityModalWithAutoCheck(existingPaste);
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
      setError(err.message || t('errors.processScan'));
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

          throw new Error(errData.error || t('errors.createPaste'));
        }

        setShowNewPasteModal(false);
        setParsedQRData(null);
        triggerRefresh();
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

          throw new Error(errData.error || t('errors.createPaste'));
        }

        setShowManualEntryModal(false);
        triggerRefresh();
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
          throw new Error(t('errors.scanTypeUndefined'));
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
        triggerRefresh();
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

  // Open viscosity modal — check if lot already has a value and pre-fill it
  const openViscosityModalWithAutoCheck = async (paste) => {
    if (!paste) return;
    setSelectedPaste(paste);
    setInheritedViscosity(null); // reset

    // Check if another paste in the same lot already has viscosity
    try {
      const response = await fetch(
        `/api/pastes?lot_number=${encodeURIComponent(paste.lot_number)}&status_in=viscosity_ok,opened,removed,completed`,
        { method: 'GET' }
      );

      if (response.ok) {
        const result = await response.json();
        const lotPastes = result.data || result;
        const pasteWithViscosity = (Array.isArray(lotPastes) ? lotPastes : [lotPastes])
          .find(p => p && p.viscosity_value && p.id !== paste.id);

        if (pasteWithViscosity) {
          // Set the inherited value — modal will display it for user confirmation
          setInheritedViscosity(pasteWithViscosity.viscosity_value);
        }
      }
    } catch (err) {
      console.log('Could not check for existing viscosity:', err);
    }

    // Always show the modal — either with inherited value or manual input
    setShowViscosityModal(true);
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
        triggerRefresh();
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
        triggerRefresh();
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
        triggerRefresh();
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
        triggerRefresh();
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
          setError(t('errors.pastDiscarded'));
          setSelectedPaste(null);
          return;
        }
        // For out_fridge pastes, always show ambientacion modal (supports return-to-fridge at any time)
        if (paste.status === 'out_fridge') {
          const elapsedMs = paste.fridge_out_datetime
            ? new Date().getTime() - new Date(paste.fridge_out_datetime).getTime()
            : 0;
          setAmbientacionHours(elapsedMs / (60 * 60 * 1000));
          setShowAmbientacionModal(true);
        } else if (paste.status === 'mixing' || paste.status === 'rejected') {
          openViscosityModalWithAutoCheck(paste);
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
        openViscosityModalWithAutoCheck(paste);
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
    triggerRefresh();

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
    triggerRefresh();
  };

  // Handle paste returned to fridge
  const handleReturnedToFridge = async (data) => {
    setShowAmbientacionModal(false);
    setSelectedPaste(null);
    setAmbientacionHours(0);
    triggerRefresh();
  };

  // Handle continue to mixing from ambientacion modal
  const handleContinueToMixing = () => {
    setShowAmbientacionModal(false);
    setAmbientacionHours(0);
    // Show the scan action modal for the mixing step
    setShowScanActionModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Scanner Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{t('scanner.title')}</h2>
          <button
            onClick={() => setShowManualEntryModal(true)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-deadtimes-card border border-deadtimes-border rounded-md hover:bg-deadtimes-card transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1.5" />
            {t('scanner.manualEntry')}
          </button>
        </div>
        <QRScannerInput onScan={handleScan} />
        <p className="mt-2 text-xs text-zinc-400">
          {t('scanner.hint')}
        </p>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-900/40 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">{t('errors.generic')}</h3>
            <p className="text-sm text-white mb-6 whitespace-pre-wrap">{error}</p>
            <button
              onClick={() => setError(null)}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              {t('modal.close')}
            </button>
          </div>
        </div>
      )}

      {/* Pastes Table */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-deadtimes-border">
          <h2 className="text-lg font-semibold text-white">
            {t('table.title')}
            {smtLocation && (
              <span className="ml-2 text-sm font-normal text-zinc-400">
                ({smtLocation})
              </span>
            )}
          </h2>
          <button
            onClick={triggerRefresh}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-deadtimes-card border border-deadtimes-border rounded-md hover:bg-deadtimes-card transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1.5" />
            {t('table.refresh')}
          </button>
        </div>

        <PasteTableWithTabs
          onAction={handleTableAction}
          refreshKey={refreshKey}
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
          setInheritedViscosity(null);
        }}
        onConfirm={handleViscositySubmit}
        paste={selectedPaste}
        isLoading={isProcessing}
        inheritedValue={inheritedViscosity}
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
        onContinueToMixing={handleContinueToMixing}
        paste={selectedPaste}
        hoursElapsed={ambientacionHours}
      />
    </div>
  );
}
