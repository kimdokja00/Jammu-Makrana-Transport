import { stones as fallbackStones } from '../data/stonesFallback.js';

const BASE = '/api';

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(body?.error || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.errors = body?.errors;
    throw error;
  }

  return body;
}

/** ─── Stones ─── */
export async function fetchStones(params = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
  ).toString();

  try {
    const body = await request(`/stones${query ? `?${query}` : ''}`);
    return { data: body.data, source: body.source };
  } catch (err) {
    console.warn('Stone range API unavailable, using bundled catalogue:', err.message);
    return { data: fallbackStones, source: 'client-fallback', offline: true };
  }
}

export async function fetchStone(slug) {
  try {
    const body = await request(`/stones/${slug}`);
    return { data: body.data, source: body.source };
  } catch (err) {
    const stone = fallbackStones.find((s) => s.slug === slug);
    if (stone) return { data: stone, source: 'client-fallback', offline: true };
    throw err;
  }
}

/** ─── Enquiries ─── */
export function submitEnquiry(payload) {
  return request('/enquiries', { method: 'POST', body: JSON.stringify(payload) });
}

/** ─── Authentication ─── */
export function loginUser(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser(data) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMe(token) {
  return request('/auth/me', { token });
}

/** ─── Orders (Customer & General) ─── */
export function submitOrder(payload, token = null) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function fetchMyOrders(token) {
  return request('/orders/my-orders', { token });
}

export function fetchOrderById(id, token) {
  return request(`/orders/${id}`, { token });
}

/** ─── Admin Orders Management ─── */
export function fetchAllOrders(token, filters = {}) {
  const query = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '' && value !== null)
  ).toString();

  return request(`/orders${query ? `?${query}` : ''}`, { token });
}

export function updateOrderStatus(id, data, token) {
  return request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export function updateOrderPayment(id, data, token) {
  return request(`/orders/${id}/payment`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export default {
  fetchStones,
  fetchStone,
  submitEnquiry,
  loginUser,
  registerUser,
  getMe,
  submitOrder,
  fetchMyOrders,
  fetchOrderById,
  fetchAllOrders,
  updateOrderStatus,
  updateOrderPayment,
};
