import api from '../../services/api';

export const expenseApi = {
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  getExpensesByTripId: (tripId) => api.get(`/trips/${tripId}/expenses`),
};
