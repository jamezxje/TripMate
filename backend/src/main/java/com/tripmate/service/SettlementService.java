package com.tripmate.service;

import com.tripmate.dto.response.SettlementSummaryResponse;
import com.tripmate.dto.response.SuggestedTransferDTO;

public interface SettlementService {

    SettlementSummaryResponse getSettlementSummary(Long tripId);

    SuggestedTransferDTO completeSettlement(Long settlementId, Long currentUserId);
}
