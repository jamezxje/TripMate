package com.tripmate.service.impl;

import com.tripmate.dto.request.CreateChecklistItemRequest;
import com.tripmate.dto.request.UpdateChecklistItemRequest;
import com.tripmate.dto.response.ChecklistItemResponse;
import com.tripmate.dto.response.ChecklistSummaryResponse;
import com.tripmate.entity.ChecklistItem;
import com.tripmate.entity.Trip;
import com.tripmate.entity.User;
import com.tripmate.enums.ChecklistStatus;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.exception.UnauthorizedAccessException;
import com.tripmate.repository.ChecklistItemRepository;
import com.tripmate.repository.TripMemberRepository;
import com.tripmate.repository.TripRepository;
import com.tripmate.repository.UserRepository;
import com.tripmate.service.ChecklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChecklistServiceImpl implements ChecklistService {

    private final ChecklistItemRepository checklistItemRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;
    private final TripMemberRepository tripMemberRepository;

    private void validateTripMember(Long tripId, Long userId) {
        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, userId)) {
            throw new UnauthorizedAccessException("Bạn không phải là thành viên của chuyến đi này");
        }
    }

    @Override
    public ChecklistSummaryResponse getChecklist(Long tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId);
        }

        List<ChecklistItem> items = checklistItemRepository.findByTripIdOrderBySortOrderAscCreatedAtAsc(tripId);
        List<ChecklistItemResponse> responses = items.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        long totalItems = items.size();
        long completedItems = items.stream().filter(item -> item.getStatus() == ChecklistStatus.DONE).count();
        long inProgressItems = items.stream().filter(item -> item.getStatus() == ChecklistStatus.IN_PROGRESS).count();
        long todoItems = items.stream().filter(item -> item.getStatus() == ChecklistStatus.TODO).count();

        double completionPercentage = totalItems > 0 ? (double) completedItems / totalItems * 100.0 : 0.0;
        completionPercentage = Math.round(completionPercentage * 10.0) / 10.0;

        return ChecklistSummaryResponse.builder()
                .totalItems(totalItems)
                .completedItems(completedItems)
                .inProgressItems(inProgressItems)
                .todoItems(todoItems)
                .completionPercentage(completionPercentage)
                .items(responses)
                .build();
    }

    @Override
    @Transactional
    public ChecklistItemResponse createChecklistItem(Long tripId, CreateChecklistItemRequest request, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        User createdBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + currentUserId));

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên phân công với ID: " + request.getAssigneeId()));
        }

        ChecklistItem item = ChecklistItem.builder()
                .trip(trip)
                .title(request.getTitle())
                .description(request.getDescription())
                .assignee(assignee)
                .status(request.getStatus() != null ? request.getStatus() : ChecklistStatus.TODO)
                .dueDate(request.getDueDate())
                .sortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0)
                .createdBy(createdBy)
                .build();

        ChecklistItem saved = checklistItemRepository.save(item);
        log.info("Tạo công việc checklist thành công. ID: {}, TripId: {}", saved.getId(), tripId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public ChecklistItemResponse updateChecklistItem(Long tripId, Long itemId, UpdateChecklistItemRequest request, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với ID: " + itemId));

        if (!item.getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("Công việc không thuộc chuyến đi này");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            item.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription());
        }
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên phân công với ID: " + request.getAssigneeId()));
            item.setAssignee(assignee);
        } else if (request.getAssigneeId() == null && request.getTitle() != null) {
            // retain existing or set to null if explicitly updating
        }
        if (request.getStatus() != null) {
            item.setStatus(request.getStatus());
        }
        if (request.getDueDate() != null) {
            item.setDueDate(request.getDueDate());
        }
        if (request.getSortOrder() != null) {
            item.setSortOrder(request.getSortOrder());
        }

        ChecklistItem updated = checklistItemRepository.save(item);
        log.info("Cập nhật công việc checklist thành công. ID: {}", updated.getId());
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public ChecklistItemResponse updateStatus(Long tripId, Long itemId, ChecklistStatus status, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với ID: " + itemId));

        if (!item.getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("Công việc không thuộc chuyến đi này");
        }

        item.setStatus(status);
        ChecklistItem updated = checklistItemRepository.save(item);
        log.info("Đổi trạng thái công việc checklist ID: {} thành {}", itemId, status);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteChecklistItem(Long tripId, Long itemId, Long currentUserId) {
        validateTripMember(tripId, currentUserId);

        ChecklistItem item = checklistItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công việc với ID: " + itemId));

        if (!item.getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("Công việc không thuộc chuyến đi này");
        }

        checklistItemRepository.delete(item);
        log.info("Xóa công việc checklist ID: {} thành công", itemId);
    }

    private ChecklistItemResponse mapToResponse(ChecklistItem item) {
        User assignee = item.getAssignee();
        User createdBy = item.getCreatedBy();

        return ChecklistItemResponse.builder()
                .id(item.getId())
                .tripId(item.getTrip().getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .assigneeId(assignee != null ? assignee.getId() : null)
                .assigneeName(assignee != null ? assignee.getFullName() : null)
                .assigneeIsGuest(assignee != null ? assignee.isGuest() : null)
                .status(item.getStatus())
                .dueDate(item.getDueDate())
                .sortOrder(item.getSortOrder())
                .createdById(createdBy != null ? createdBy.getId() : null)
                .createdByName(createdBy != null ? createdBy.getFullName() : null)
                .createdAt(item.getCreatedAt())
                .build();
    }
}
