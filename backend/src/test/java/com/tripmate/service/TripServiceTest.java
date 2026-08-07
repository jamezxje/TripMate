package com.tripmate.service;

import com.tripmate.dto.request.CreateTripRequest;
import com.tripmate.dto.request.JoinTripRequest;
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
import com.tripmate.service.impl.TripServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripMemberRepository tripMemberRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TripServiceImpl tripService;

    private User mockUser;
    private Trip mockTrip;

    @BeforeEach
    void setUp() {
        mockUser = User.builder()
                .id(1L)
                .email("anv@example.com")
                .fullName("Nguyễn Văn A")
                .passwordHash("hashed_password")
                .createdAt(LocalDateTime.now())
                .build();

        mockTrip = Trip.builder()
                .id(100L)
                .name("Chuyến đi Đà Nẵng")
                .status(TripStatus.PLANNING)
                .joinCode("ABC123")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("createTrip - Tạo chuyến đi mới thành công và gán vai trò LEADER cho creator")
    void createTrip_Success() {
        CreateTripRequest request = CreateTripRequest.builder()
                .name("Chuyến đi Đà Nẵng")
                .build();

        TripMember leaderMember = TripMember.builder()
                .id(10L)
                .trip(mockTrip)
                .user(mockUser)
                .role(Role.LEADER)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(tripRepository.existsByJoinCode(anyString())).thenReturn(false);
        when(tripRepository.save(any(Trip.class))).thenReturn(mockTrip);
        when(tripMemberRepository.save(any(TripMember.class))).thenReturn(leaderMember);
        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(tripMemberRepository.findByTripId(100L)).thenReturn(List.of(leaderMember));

        TripResponse response = tripService.createTrip(request, 1L);

        assertNotNull(response);
        assertEquals("Chuyến đi Đà Nẵng", response.getName());
        assertEquals(TripStatus.PLANNING, response.getStatus());
        assertEquals(1, response.getMembers().size());
        assertEquals(Role.LEADER, response.getMembers().get(0).getRole());

        verify(tripRepository, times(1)).save(any(Trip.class));
        verify(tripMemberRepository, times(1)).save(any(TripMember.class));
    }

    @Test
    @DisplayName("createTrip - Không tìm thấy người dùng -> Ném ResourceNotFoundException")
    void createTrip_UserNotFound_ThrowsException() {
        CreateTripRequest request = CreateTripRequest.builder()
                .name("Chuyến đi Đà Nẵng")
                .build();

        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> tripService.createTrip(request, 999L));
    }

    @Test
    @DisplayName("joinTrip - Thêm người dùng với vai trò MEMBER khi nhập mã đúng")
    void joinTrip_Success() {
        User joinUser = User.builder()
                .id(2L)
                .email("btr@example.com")
                .fullName("Trần Thị B")
                .build();

        JoinTripRequest request = JoinTripRequest.builder()
                .joinCode("ABC123")
                .build();

        TripMember newMember = TripMember.builder()
                .id(11L)
                .trip(mockTrip)
                .user(joinUser)
                .role(Role.MEMBER)
                .build();

        when(tripRepository.findByJoinCode("ABC123")).thenReturn(Optional.of(mockTrip));
        when(userRepository.findById(2L)).thenReturn(Optional.of(joinUser));
        when(tripMemberRepository.existsByTripIdAndUserId(100L, 2L)).thenReturn(false);
        when(tripMemberRepository.save(any(TripMember.class))).thenReturn(newMember);
        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(tripMemberRepository.findByTripId(100L)).thenReturn(List.of(newMember));

        TripResponse response = tripService.joinTrip(request, 2L);

        assertNotNull(response);
        verify(tripMemberRepository, times(1)).save(any(TripMember.class));
    }

    @Test
    @DisplayName("getTripDetail - Trả về đầy đủ thông tin chuyến đi và danh sách thành viên")
    void getTripDetail_Success() {
        TripMember member = TripMember.builder()
                .id(10L)
                .trip(mockTrip)
                .user(mockUser)
                .role(Role.LEADER)
                .build();

        when(tripRepository.findById(100L)).thenReturn(Optional.of(mockTrip));
        when(tripMemberRepository.findByTripId(100L)).thenReturn(List.of(member));

        TripResponse response = tripService.getTripDetail(100L, 1L);

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("ABC123", response.getJoinCode());
        assertEquals(1, response.getMembers().size());
    }
}
