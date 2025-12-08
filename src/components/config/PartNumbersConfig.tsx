/**
 * =====================================================
 * Componente: PartNumbersConfig
 * =====================================================
 * Interfaz CRUD para gestionar números de parte y sus líneas asignadas
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface PartNumberWithLines {
  id: number;
  part_number: string;
  description: string | null;
  is_active: boolean;
  lines: {
    line_id: number;
    line_number: number;
    line_name: string;
    is_valid: boolean;
  }[];
}

interface ProductionLine {
  id: number;
  line_number: number;
  line_name: string;
  smt_location: string | null;
  is_active: boolean;
}

interface FormData {
  part_number: string;
  description: string;
  line_ids: number[];
}

export default function PartNumbersConfig() {
  const [partNumbers, setPartNumbers] = useState<PartNumberWithLines[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<PartNumberWithLines | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    part_number: '',
    description: '',
    line_ids: [],
  });

  // Cargar datos
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/part-lines');
      const data = await response.json();

      if (data.success && data.data) {
        setPartNumbers(data.data.partNumbers);
        setProductionLines(data.data.productionLines);
      }
    } catch (error) {
      console.error('Error fetching part-lines:', error);
      setError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Abrir modal para crear
  const handleAdd = () => {
    setEditingPart(null);
    setFormData({
      part_number: '',
      description: '',
      line_ids: [],
    });
    setError('');
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleEdit = (part: PartNumberWithLines) => {
    setEditingPart(part);
    setFormData({
      part_number: part.part_number,
      description: part.description || '',
      line_ids: part.lines.map((l) => l.line_id),
    });
    setError('');
    setIsModalOpen(true);
  };

  // Manejar cambio de checkbox de línea
  const handleLineToggle = (lineId: number) => {
    setFormData((prev) => ({
      ...prev,
      line_ids: prev.line_ids.includes(lineId)
        ? prev.line_ids.filter((id) => id !== lineId)
        : [...prev.line_ids, lineId],
    }));
  };

  // Guardar (crear o actualizar)
  const handleSave = async () => {
    if (!formData.part_number.trim()) {
      setError('El número de parte es requerido');
      return;
    }

    if (formData.line_ids.length === 0) {
      setError('Debe seleccionar al menos una línea');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const url = editingPart
        ? `/api/part-lines/${editingPart.id}`
        : '/api/part-lines';
      const method = editingPart ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setIsModalOpen(false);
        fetchData(); // Recargar datos
      } else {
        setError(data.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving part number:', error);
      setError('Error de conexión al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Eliminar
  const handleDelete = async (part: PartNumberWithLines) => {
    if (!confirm(`¿Está seguro de eliminar el número de parte ${part.part_number}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/part-lines/${part.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        fetchData(); // Recargar datos
      } else {
        alert(data.error || 'Error al eliminar');
      }
    } catch (error) {
      console.error('Error deleting part number:', error);
      alert('Error de conexión al eliminar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="ml-3 text-neutral-400">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de agregar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">
            Números de Parte y Líneas
          </h3>
          <p className="text-sm text-neutral-400">
            Configure qué números de parte pueden usarse en cada línea de producción
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Agregar Número de Parte
        </button>
      </div>

      {/* Tabla de números de parte */}
      <div className="bg-neutral-700/50 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-neutral-600">
          <thead className="bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Número de Parte
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Líneas Autorizadas
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700">
            {partNumbers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-400">
                  No hay números de parte configurados. Haga clic en "Agregar" para comenzar.
                </td>
              </tr>
            ) : (
              partNumbers.map((part) => (
                <tr key={part.id} className="hover:bg-neutral-700/50">
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm text-white">{part.part_number}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-neutral-300">
                      {part.description || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {part.lines.length === 0 ? (
                        <span className="text-sm text-neutral-500">Sin líneas asignadas</span>
                      ) : (
                        part.lines.map((line) => (
                          <span
                            key={line.line_id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700"
                          >
                            {line.line_name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(part)}
                        className="p-1.5 text-neutral-400 hover:text-blue-400 transition-colors"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(part)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen de líneas */}
      <div className="bg-neutral-700/30 rounded-lg p-4">
        <h4 className="text-sm font-medium text-white mb-3">Líneas de Producción</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {productionLines.map((line) => {
            const assignedParts = partNumbers.filter((p) =>
              p.lines.some((l) => l.line_id === line.id)
            );
            return (
              <div key={line.id} className="bg-neutral-800 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{line.line_name}</span>
                  {line.smt_location && (
                    <span className="text-xs text-neutral-400">{line.smt_location}</span>
                  )}
                </div>
                <div className="text-xs text-neutral-400">
                  {assignedParts.length} parte(s) asignada(s)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de creación/edición */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPart ? 'Editar Número de Parte' : 'Agregar Número de Parte'}
      >
        <div className="space-y-4">
          {/* Campo número de parte */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Número de Parte *
            </label>
            <input
              type="text"
              value={formData.part_number}
              onChange={(e) => setFormData((prev) => ({ ...prev, part_number: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Ej: K01.005-00M-2"
              disabled={isSubmitting}
            />
          </div>

          {/* Campo descripción */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del número de parte"
              disabled={isSubmitting}
            />
          </div>

          {/* Checkboxes de líneas */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Líneas Autorizadas *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {productionLines.map((line) => (
                <label
                  key={line.id}
                  className={`
                    flex items-center p-3 rounded-lg border cursor-pointer transition-colors
                    ${formData.line_ids.includes(line.id)
                      ? 'bg-blue-900/30 border-blue-600 text-blue-300'
                      : 'bg-neutral-700/50 border-neutral-600 text-neutral-300 hover:border-neutral-500'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={formData.line_ids.includes(line.id)}
                    onChange={() => handleLineToggle(line.id)}
                    className="sr-only"
                    disabled={isSubmitting}
                  />
                  <span className={`
                    flex-shrink-0 w-5 h-5 rounded border mr-3 flex items-center justify-center
                    ${formData.line_ids.includes(line.id)
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-neutral-500'
                    }
                  `}>
                    {formData.line_ids.includes(line.id) && (
                      <CheckIcon className="h-3.5 w-3.5 text-white" />
                    )}
                  </span>
                  <div>
                    <div className="font-medium">{line.line_name}</div>
                    {line.smt_location && (
                      <div className="text-xs text-neutral-400">{line.smt_location}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-700 hover:bg-neutral-600 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {editingPart ? 'Actualizar' : 'Guardar'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
