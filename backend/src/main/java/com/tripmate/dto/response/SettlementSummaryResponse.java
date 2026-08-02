package com.tripmate.dto.response;

import com.tripmate.enums.TripStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettlementSummaryResponse {

    private Long tripId;
    private String tripName;
    private TripStatus tripStatus;
    private List<UserBalanceDTO> balances;
    private List<SuggestedTransferDTO> suggestedTransfers;
}
