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

export const checklistApi = {
  getSummary: (tripId) => api.get(`/trips/${tripId}/checklist`),
  create: (tripId, data) => api.post(`/trips/${tripId}/checklist`, data),
  update: (tripId, itemId, data) => api.put(`/trips/${tripId}/checklist/${itemId}`, data),
  updateStatus: (tripId, itemId, status) => api.patch(`/trips/${tripId}/checklist/${itemId}/status?status=${status}`),
  delete: (tripId, itemId) => api.delete(`/trips/${tripId}/checklist/${itemId}`),
};

export const itineraryApi = {
  getItinerary: (tripId) => api.get(`/trips/${tripId}/itinerary`),
  createDay: (tripId, data) => api.post(`/trips/${tripId}/itinerary/days`, data),
  updateDay: (tripId, dayId, data) => api.put(`/trips/${tripId}/itinerary/days/${dayId}`, data),
  deleteDay: (tripId, dayId) => api.delete(`/trips/${tripId}/itinerary/days/${dayId}`),
  createActivity: (tripId, dayId, data) => api.post(`/trips/${tripId}/itinerary/days/${dayId}/activities`, data),
  updateActivity: (tripId, activityId, data) => api.put(`/trips/${tripId}/itinerary/activities/${activityId}`, data),
  deleteActivity: (tripId, activityId) => api.delete(`/trips/${tripId}/itinerary/activities/${activityId}`),
};


