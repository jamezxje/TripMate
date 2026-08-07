import api from '../../services/api';

export const categoryApi = {
  getAll: () => api.get('/expense-categories'),
  create: (data) => api.post('/expense-categories', data),
  update: (id, data) => api.put(`/expense-categories/${id}`, data),
  delete: (id) => api.delete(`/expense-categories/${id}`),
};

export const plannedExpenseApi = {
  getAll: (tripId, categoryId, status) => {
    let url = `/trips/${tripId}/planned-expenses`;
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;
    return api.get(url);
  },
  create: (tripId, data) => api.post(`/trips/${tripId}/planned-expenses`, data),
  update: (tripId, id, data) => api.put(`/trips/${tripId}/planned-expenses/${id}`, data),
  delete: (tripId, id) => api.delete(`/trips/${tripId}/planned-expenses/${id}`),
  confirm: (tripId, id, actualAmount) => api.post(`/trips/${tripId}/planned-expenses/${id}/confirm`, { actualAmount }),
  getBudgetSummary: (tripId) => api.get(`/trips/${tripId}/budget-summary`),
};
