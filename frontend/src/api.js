/**
 * =====================================================
 * API Client - SMT Solder Paste Traceability System
 * =====================================================
 */

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Authenticate user with credentials database
 */
export async function login({ employee_input, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employee_input, password }),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.message || 'Error de autenticación');
  }
  
  return res.json();
}

/**
 * Update paste DID (only when in_fridge status)
 */
export async function updatePasteDid(pasteId, did) {
  const res = await fetch(`${API_BASE}/api/pastes/${pasteId}/did`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ did }),
  });
  
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Error al actualizar el DID');
  }
  
  return res.json();
}
