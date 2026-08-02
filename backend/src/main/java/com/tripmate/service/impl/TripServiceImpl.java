package com.tripmate.service.impl;

import com.tripmate.dto.request.CreateGuestRequest;
import com.tripmate.dto.request.CreateTripRequest;
import com.tripmate.dto.request.JoinTripRequest;
import com.tripmate.dto.response.TripMemberResponse;
import com.tripmate.dto.response.TripResponse;
import com.tripmate.entity.Trip;
import com.tripmate.entity.TripMember;
import com.tripmate.entity.User;
import com.tripmate.enums.Role;
import com.tripmate.enums.TripStatus;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.repository.TripMemberRepository;
import com.tripmate.repository.TripRepository;
import com.tripmate.repository.UserRepository;
import com.tripmate.service.TripService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TripServiceImpl implements TripService {

    private final TripRepository tripRepository;
    private final TripMemberRepository tripMemberRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public TripResponse createTrip(CreateTripRequest request, Long currentUserId) {
        log.info("Bắt đầu xử lý tạo chuyến đi mới: '{}' bởi người dùng ID: {}", request.getName(), currentUserId);
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + currentUserId));

        String joinCode = generateUniqueJoinCode();

        Trip trip = Trip.builder()
                .name(request.getName().trim())
                .status(TripStatus.PLANNING)
                .joinCode(joinCode)
                .build();

        Trip savedTrip = tripRepository.save(trip);
        log.info("Đã lưu chuyến đi mới với ID: {}, mã join: {}", savedTrip.getId(), joinCode);

        TripMember leaderMember = TripMember.builder()
                .trip(savedTrip)
                .user(currentUser)
                .role(Role.LEADER)
                .build();

        tripMemberRepository.save(leaderMember);
        log.info("Đã gán người dùng ID: {} làm Leader cho chuyến đi ID: {}", currentUserId, savedTrip.getId());

        return getTripDetail(savedTrip.getId(), currentUserId);
    }

    @Override
    @Transactional
    public TripResponse joinTrip(JoinTripRequest request, Long currentUserId) {
        String joinCode = request.getJoinCode().trim().toUpperCase();
        log.info("Bắt đầu xử lý gia nhập chuyến đi với mã: '{}' bởi người dùng ID: {}", joinCode, currentUserId);

        Trip trip = tripRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new ResourceNotFoundException("Chuyến đi không tồn tại hoặc mã tham gia không hợp lệ"));

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + currentUserId));

        boolean isAlreadyMember = tripMemberRepository.existsByTripIdAndUserId(trip.getId(), currentUser.getId());

        if (!isAlreadyMember) {
            TripMember newMember = TripMember.builder()
                    .trip(trip)
                    .user(currentUser)
                    .role(Role.MEMBER)
                    .build();
            tripMemberRepository.save(newMember);
            log.info("Đã thêm thành viên mới ID: {} vào chuyến đi ID: '{}' với vai trò MEMBER", currentUser.getId(), trip.getId());
        } else {
            log.info("Người dùng ID: {} đã là thành viên của chuyến đi ID: '{}'", currentUser.getId(), trip.getId());
        }

        return getTripDetail(trip.getId(), currentUserId);
    }

    @Override
    public TripResponse getTripDetail(Long tripId, Long currentUserId) {
        log.debug("Truy xuất thông tin chi tiết chuyến đi ID: {}", tripId);
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));

        if (!tripMemberRepository.existsByTripIdAndUserId(tripId, currentUserId)) {
            throw new com.tripmate.exception.UnauthorizedAccessException("Bạn không có quyền truy cập chuyến đi này");
        }

        List<TripMember> members = tripMemberRepository.findByTripId(tripId);

        List<TripMemberResponse> memberResponses = members.stream()
                .map(m -> TripMemberResponse.builder()
                        .id(m.getId())
                        .userId(m.getUser().getId())
                        .fullName(m.getUser().getFullName())
                        .email(m.getUser().getEmail())
                        .role(m.getRole())
                        .isGuest(m.getUser().isGuest())
                        .build())
                .toList();

        return TripResponse.builder()
                .id(trip.getId())
                .name(trip.getName())
                .status(trip.getStatus())
                .joinCode(trip.getJoinCode())
                .createdAt(trip.getCreatedAt())
                .members(memberResponses)
                .build();
    }

    @Override
    public List<TripResponse> getUserTrips(Long currentUserId) {
        log.debug("Truy xuất danh sách chuyến đi cho user ID: {}", currentUserId);
        
        // Find all trip memberships for the user
        List<TripMember> memberships = tripMemberRepository.findByUserId(currentUserId);
        
        // Map to TripResponse
        return memberships.stream()
                .map(m -> {
                    Trip trip = m.getTrip();
                    return TripResponse.builder()
                            .id(trip.getId())
                            .name(trip.getName())
                            .status(trip.getStatus())
                            .joinCode(trip.getJoinCode())
                            .createdAt(trip.getCreatedAt())
                            // We might not need the full members list for the summary, 
                            // but if the frontend expects it, we can fetch or leave empty.
                            // The current UI seems to just need trip details.
                            .build();
                })
                // Sort by creation date descending (newest first)
                .sorted((t1, t2) -> t2.getCreatedAt().compareTo(t1.getCreatedAt()))
                .toList();
    }

    private String generateUniqueJoinCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder code = new StringBuilder();
        
        boolean isUnique = false;
        while (!isUnique) {
            code.setLength(0);
            for (int i = 0; i < 6; i++) {
                code.append(chars.charAt(random.nextInt(chars.length())));
            }
            if (!tripRepository.existsByJoinCode(code.toString())) {
                isUnique = true;
            }
        }
        
        return code.toString();
    }

    @Override
    @Transactional
    public TripMemberResponse addGuestMember(Long tripId, CreateGuestRequest request, Long currentUserId) {
        log.info("Thêm guest '{}' vào chuyến đi ID: {} bởi user ID: {}", request.getFullName(), tripId, currentUserId);
        
        Trip trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến đi với ID: " + tripId));
                
        TripMember currentMember = tripMemberRepository.findByTripId(tripId).stream()
                .filter(m -> m.getUser().getId().equals(currentUserId))
                .findFirst()
                .orElseThrow(() -> new com.tripmate.exception.UnauthorizedAccessException("Bạn không phải thành viên chuyến đi này"));
                
        if (currentMember.getRole() != Role.LEADER) {
            throw new com.tripmate.exception.UnauthorizedAccessException("Chỉ Trưởng nhóm mới có quyền tạo thành viên ảo");
        }

        User guestUser = User.builder()
                .fullName(request.getFullName().trim())
                .isGuest(true)
                .build();
        User savedGuest = userRepository.save(guestUser);

        TripMember newMember = TripMember.builder()
                .trip(trip)
                .user(savedGuest)
                .role(Role.GUEST)
                .build();
        tripMemberRepository.save(newMember);

        return TripMemberResponse.builder()
                .id(newMember.getId())
                .userId(savedGuest.getId())
                .fullName(savedGuest.getFullName())
                .email(savedGuest.getEmail())
                .role(newMember.getRole())
                .isGuest(savedGuest.isGuest())
                .build();
    }
}
