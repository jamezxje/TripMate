package com.tripmate.service;

import com.tripmate.dto.request.FundContributionRequest;
import com.tripmate.dto.response.FundContributionResponse;
import com.tripmate.dto.response.FundSummaryResponse;

public interface FundContributionService {

    FundContributionResponse contributeToFund(FundContributionRequest request);

    FundSummaryResponse getFundSummary(Long tripId);
}
