import api from '../../services/api';

export const tripApi = {
  createTrip: (name) => api.post('/trips', { name }),
  joinTrip: (joinCode) => api.post('/trips/join', { joinCode }),
  getTripDetail: (tripId) => api.get(`/trips/${tripId}`),
  getUserTrips: () => api.get('/trips/me'),
};
