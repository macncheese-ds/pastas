/**
 * =====================================================
 * Part Numbers Config Component
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '../../i18n';

export default function PartNumbersConfig() {
  const { t } = useLanguage();
  const [partNumbers, setPartNumbers] = useState([]);
  const [productionLines, setProductionLines] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newPartNumber, setNewPartNumber] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedLines, setSelectedLines] = useState([]);
  const [selectedPartNumber, setSelectedPartNumber] = useState('');
  const [selectedLine, setSelectedLine] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [partRes, linesRes, assignRes] = await Promise.all([
        fetch('/api/part-lines/part-numbers'),
        fetch('/api/part-lines/production-lines'),
        fetch('/api/part-lines/assignments'),
      ]);

      if (!partRes.ok || !linesRes.ok || !assignRes.ok) {
        throw new Error('Error al cargar datos de configuración');
      }

      const [partResult, linesResult, assignResult] = await Promise.all([
        partRes.json(),
        linesRes.json(),
        assignRes.json(),
      ]);

      // Handle both wrapped and direct array responses
      setPartNumbers(partResult.data || partResult);
      setProductionLines(linesResult.data || linesResult);
      setAssignments(assignResult.data || assignResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  // Open modal for adding new part number
  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setNewPartNumber('');
    setNewDescription('');
    setSelectedLines([]);
    setShowModal(true);
  };

  // Open modal for editing part number
  const handleOpenEditModal = (partNumber) => {
    setIsEditMode(true);
    setEditingId(partNumber.id);
    setNewPartNumber(partNumber.part_number);
    setNewDescription(partNumber.description || '');
    const authorizedLineIds = assignments
      .filter(a => a.part_number_id === partNumber.id)
      .map(a => a.line_id);
    setSelectedLines(authorizedLineIds);
    setShowModal(true);
  };

  // Handle form submission for both add and edit
  const handleAddPartNumberSubmit = async (e) => {
    e.preventDefault();
    if (!newPartNumber.trim() || selectedLines.length === 0) return;

    try {
      if (isEditMode) {
        // Update existing part number
        const response = await fetch(`/api/part-lines/part-numbers/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            part_number: newPartNumber.trim(),
            description: newDescription.trim(),
            line_ids: selectedLines,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || t('partConfig.messages.updateError'));
        }

        setShowModal(false);
        showSuccess(t('partConfig.messages.partNumberUpdated'));
      } else {
        // Add new part number
        const response = await fetch('/api/part-lines/part-numbers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            part_number: newPartNumber.trim(),
            description: newDescription.trim(),
            line_ids: selectedLines,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || t('partConfig.messages.addError'));
        }

        setShowModal(false);
        showSuccess(t('partConfig.messages.partNumberAdded'));
      }

      setNewPartNumber('');
      setNewDescription('');
      setSelectedLines([]);
      setEditingId(null);
      setIsEditMode(false);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete part number
  const handleDeletePartNumber = async (id) => {
    if (!confirm(t('partConfig.deleteConfirm'))) return;

    try {
      const response = await fetch(`/api/part-lines/part-numbers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('partConfig.messages.deleteError'));
      }

      showSuccess(t('partConfig.messages.partNumberDeleted'));
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Add production line
  const handleAddLine = async (lineName) => {
    if (!lineName || !lineName.trim()) return;

    try {
      const response = await fetch('/api/part-lines/production-lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_name: lineName.trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('partConfig.messages.addError'));
      }

      showSuccess(t('partConfig.messages.lineAdded'));
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete production line
  const handleDeleteLine = async (id) => {
    if (!confirm(t('partConfig.deleteLineConfirm'))) return;

    try {
      const response = await fetch(`/api/part-lines/production-lines/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('partConfig.messages.deleteError'));
      }

      showSuccess(t('partConfig.messages.lineDeleted'));
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Add assignment
  const handleAddAssignment = async (e) => {
    e.preventDefault();
    if (!selectedPartNumber || !selectedLine) return;

    try {
      const response = await fetch('/api/part-lines/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_number_id: selectedPartNumber,
          line_id: selectedLine,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('partConfig.messages.assignmentError'));
      }

      setSelectedPartNumber('');
      setSelectedLine('');
      showSuccess(t('partConfig.messages.assignmentCreated'));
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async (id) => {
    if (!confirm(t('partConfig.deleteAssignmentConfirm'))) return;

    try {
      const response = await fetch(`/api/part-lines/assignments/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || t('partConfig.messages.deleteError'));
      }

      showSuccess(t('partConfig.messages.assignmentDeleted'));
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  const toggleLineSelection = (lineId) => {
    setSelectedLines(prev =>
      prev.includes(lineId)
        ? prev.filter(id => id !== lineId)
        : [...prev, lineId]
    );
  };

  const getAuthorizedLines = (partNumberId) => {
    return assignments
      .filter(a => a.part_number_id === partNumberId)
      .map(a => a.line_name);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{t('partConfig.title')}</h2>
          <p className="text-sm text-zinc-400 mt-1">{t('partConfig.subtitle')}</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-deadtimes-hover transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('partConfig.addPartNumber')}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="fixed top-4 left-4 right-4 bg-red-900/30 border border-red-700 rounded-lg p-4 z-50 max-w-md">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              ×
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
          <p className="text-sm text-green-300">{success}</p>
        </div>
      )}

      {/* Modal for Adding/Editing Part Number */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-deadtimes-accent rounded-lg p-6 w-full max-w-md border border-deadtimes-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {isEditMode ? t('partConfig.editPartNumber') : t('partConfig.addPartNumber')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddPartNumberSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">{t('partConfig.partNumber')} *</label>
                <input
                  type="text"
                  value={newPartNumber}
                  onChange={(e) => setNewPartNumber(e.target.value)}
                  placeholder="Ex: K01.005-00M-2"
                  className="w-full rounded-lg border border-deadtimes-border bg-deadtimes-accent px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-1">{t('partConfig.descriptionOptional')}</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Description of the part number"
                  className="w-full rounded-lg border border-deadtimes-border bg-deadtimes-accent px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('partConfig.authorizedLines')} *</label>
                <div className="grid grid-cols-2 gap-2">
                  {productionLines.map(line => (
                    <label key={line.id} className="flex items-center p-3 border border-deadtimes-border rounded-lg hover:border-blue-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLines.includes(line.id)}
                        onChange={() => toggleLineSelection(line.id)}
                        className="w-4 h-4 rounded border-deadtimes-border text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-white">{line.line_name}</span>
                      <span className="ml-auto text-xs text-zinc-400">{line.smt_code || 'SMT'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-zinc-400 bg-deadtimes-accent rounded-lg hover:bg-deadtimes-hover transition-colors"
                >
                  {t('partConfig.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newPartNumber.trim() || selectedLines.length === 0}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-deadtimes-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('partConfig.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Part Numbers Table */}
      <div className="bg-deadtimes-accent rounded-lg border border-deadtimes-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-950 border-b border-deadtimes-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">{t('partConfig.tableHeaders.partNumber')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">{t('partConfig.tableHeaders.description')}</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">{t('partConfig.tableHeaders.authorizedLines')}</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">{t('partConfig.tableHeaders.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {partNumbers.map((pn) => (
                <tr key={pn.id} className="border-b border-deadtimes-border hover:bg-deadtimes-card transition-colors">
                  <td className="py-3 px-4 text-white font-medium">{pn.part_number}</td>
                  <td className="py-3 px-4 text-zinc-400">{pn.description || '-'}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {getAuthorizedLines(pn.id).length > 0 ? (
                        getAuthorizedLines(pn.id).map((lineName, idx) => (
                          <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-300 border border-green-700">
                            {lineName}
                          </span>
                        ))
                      ) : (
                        <span className="text-blue-500 text-sm">{t('partConfig.noAssignedLines')}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(pn)}
                        className="text-zinc-400 hover:text-zinc-400 p-1 transition-colors"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePartNumber(pn.id)}
                        className="text-red-400 hover:text-red-300 p-1 transition-colors"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {partNumbers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-zinc-400">
                    {t('partConfig.noPartNumbers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Lines */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">{t('partConfig.productionLines')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {productionLines.map(line => {
            const partCount = assignments.filter(a => a.line_id === line.id).length;
            return (
              <div key={line.id} className="bg-deadtimes-accent rounded-lg p-4 border border-deadtimes-border">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-semibold">{line.line_name}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{line.smt_code || 'SMT'}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteLine(line.id)}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                  <p className="text-sm text-zinc-400 mt-3">
                  <span className="text-neutral-400">{partCount}</span> {t('partConfig.partsAssigned')}
                </p>
              </div>
            );
          })}
          <button
            onClick={() => {
              const name = prompt(t('partConfig.prompt.newLineName'));
              if (name && name.trim()) {
                handleAddLine(name);
              }
            }}
            className="flex items-center justify-center bg-deadtimes-accent border-2 border-dashed border-deadtimes-border rounded-lg p-4 hover:border-blue-500 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <PlusIcon className="h-5 w-5 text-neutral-400 mr-2" />
            <span className="text-neutral-400">{t('partConfig.addLine')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
