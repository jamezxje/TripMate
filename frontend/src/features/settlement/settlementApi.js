import api from '../../services/api';

export const settlementApi = {
  getSettlementSummary: (tripId) => api.get(`/trips/${tripId}/settlements`),
  completeSettlement: (settlementId) =>
    api.patch(`/settlements/${settlementId}/complete`),
};
