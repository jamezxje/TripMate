import api from '../../services/api';

export const fundApi = {
  contributeToFund: (tripId, userId, amount) =>
    api.post('/funds', { tripId, userId, amount }),
  getFundSummary: (tripId) => api.get(`/trips/${tripId}/funds`),
};
