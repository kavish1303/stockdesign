const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {};
  
  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

// Auth
export const authAPI = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
};

// Designs
export const designsAPI = {
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return request(`/designs${searchParams ? `?${searchParams}` : ''}`);
  },
  getOne: (id) => request(`/designs/${id}`),
  create: (formData) => request('/designs', { method: 'POST', body: formData }),
  update: (id, formData) => request(`/designs/${id}`, { method: 'PUT', body: formData }),
  delete: (id) => request(`/designs/${id}`, { method: 'DELETE' }),
  getCategories: () => request('/designs/meta/categories'),
};

// Orders
export const ordersAPI = {
  create: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (params = {}) => {
    const searchParams = new URLSearchParams(params).toString();
    return request(`/orders${searchParams ? `?${searchParams}` : ''}`);
  },
  updateStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// Admin
export const adminAPI = {
  dashboard: () => request('/admin/dashboard'),
  users: () => request('/admin/users'),
  pendingUsers: () => request('/admin/users/pending'),
  approveUser: (id) => request(`/admin/users/${id}/approve`, { method: 'PUT' }),
  rejectUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
};
