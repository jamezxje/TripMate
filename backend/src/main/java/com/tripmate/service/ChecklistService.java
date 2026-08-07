package com.tripmate.service;

import com.tripmate.dto.request.CreateChecklistItemRequest;
import com.tripmate.dto.request.UpdateChecklistItemRequest;
import com.tripmate.dto.response.ChecklistItemResponse;
import com.tripmate.dto.response.ChecklistSummaryResponse;
import com.tripmate.enums.ChecklistStatus;

public interface ChecklistService {

    ChecklistSummaryResponse getChecklist(Long tripId);

    ChecklistItemResponse createChecklistItem(Long tripId, CreateChecklistItemRequest request, Long currentUserId);

    ChecklistItemResponse updateChecklistItem(Long tripId, Long itemId, UpdateChecklistItemRequest request, Long currentUserId);

    ChecklistItemResponse updateStatus(Long tripId, Long itemId, ChecklistStatus status, Long currentUserId);

    void deleteChecklistItem(Long tripId, Long itemId, Long currentUserId);
}
