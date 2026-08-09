import api from '../../services/api';

export const expenseApi = {
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  getExpensesByTripId: (tripId) => api.get(`/trips/${tripId}/expenses`),
  updateExpense: (expenseId, expenseData) => api.put(`/expenses/${expenseId}`, expenseData),
  deleteExpense: (expenseId) => api.delete(`/expenses/${expenseId}`),
};
