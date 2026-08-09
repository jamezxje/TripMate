package com.tripmate.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tripmate.dto.request.*;
import com.tripmate.dto.response.*;
import com.tripmate.entity.User;
import com.tripmate.enums.SplitType;
import com.tripmate.enums.TripStatus;
import com.tripmate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MySQL",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc(addFilters = false)
@Transactional
class TripMateE2EIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TripRepository tripRepository;

    @Autowired
    private TripMemberRepository tripMemberRepository;

    @Autowired
    private FundContributionRepository fundContributionRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    private User leaderUser;
    private User memberUser;

    @BeforeEach
    void setUp() {
        // Create initial test users
        leaderUser = userRepository.save(User.builder()
                .email("leader@test.com")
                .fullName("Leader Test")
                .passwordHash("hash")
                .build());

        memberUser = userRepository.save(User.builder()
                .email("member@test.com")
                .fullName("Member Test")
                .passwordHash("hash")
                .build());
    }

    @Test
    @DisplayName("E2E Integration Test: Luồng nghiệp vụ toàn diện từ A-Z (Group, Fund, Expenses, Settlement & Close)")
    void executeFullTripMateE2EWorkflow() throws Exception {

        // ==========================================
        // FLOW 1: Group & Member Management
        // ==========================================
        // 1. Leader creates a new trip
        CreateTripRequest createTripReq = CreateTripRequest.builder()
                .name("Chuyến đi Phú Quốc E2E")
                .build();

        MvcResult createTripResult = mockMvc.perform(post("/api/v1/trips")
                        .header("X-User-Id", leaderUser.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createTripReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Chuyến đi Phú Quốc E2E"))
                .andExpect(jsonPath("$.data.status").value("PLANNING"))
                .andReturn();

        String createTripJson = createTripResult.getResponse().getContentAsString();
        TripResponse tripResponse = objectMapper.readValue(
                objectMapper.readTree(createTripJson).get("data").toString(),
                TripResponse.class
        );

        Long tripId = tripResponse.getId();
        String joinCode = tripResponse.getJoinCode();
        assertNotNull(joinCode);
        assertEquals(1, tripResponse.getMembers().size());
        assertEquals("LEADER", tripResponse.getMembers().get(0).getRole().name());

        // 2. Member joins trip via joinCode
        JoinTripRequest joinTripReq = JoinTripRequest.builder()
                .joinCode(joinCode)
                .build();

        mockMvc.perform(post("/api/v1/trips/join")
                        .header("X-User-Id", memberUser.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(joinTripReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.members.length()").value(2));

        // Verify Trip detail
        mockMvc.perform(get("/api/v1/trips/" + tripId)
                        .header("X-User-Id", leaderUser.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.members.length()").value(2));


        // ==========================================
        // FLOW 2: Advance Fund Contributions
        // ==========================================
        // 1. Leader contributes 500,000 VND
        FundContributionRequest fundReq1 = FundContributionRequest.builder()
                .tripId(tripId)
                .userId(leaderUser.getId())
                .amount(new BigDecimal("500000.00"))
                .build();

        mockMvc.perform(post("/api/v1/funds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fundReq1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.amount").value(500000.00));

        // 2. Member contributes 500,000 VND
        FundContributionRequest fundReq2 = FundContributionRequest.builder()
                .tripId(tripId)
                .userId(memberUser.getId())
                .amount(new BigDecimal("500000.00"))
                .build();

        mockMvc.perform(post("/api/v1/funds")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fundReq2)))
                .andExpect(status().isCreated());

        // Verify Fund Summary
        mockMvc.perform(get("/api/v1/trips/" + tripId + "/funds"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalCollected").value(1000000.00))
                .andExpect(jsonPath("$.data.totalSpentFromFund").value(0.00))
                .andExpect(jsonPath("$.data.currentBalance").value(1000000.00));

        // ==========================================
        // FLOW 3: Expense Paid by Fund & Balance Check
        // ==========================================
        // 1. Leader creates expense paid by fund: 300,000 VND
        CreateExpenseRequest fundExpenseReq = CreateExpenseRequest.builder()
                .tripId(tripId)
                .description("Vé tham quan VinWonders")
                .amount(new BigDecimal("300000.00"))
                .isPaidByFund(true)
                .splitType(SplitType.EQUAL)
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(leaderUser.getId()).build(),
                        ExpenseSplitRequest.builder().userId(memberUser.getId()).build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/expenses")
                        .header("X-User-Id", leaderUser.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(fundExpenseReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isPaidByFund").value(true));

        // Verify fund balance reduced to 700,000 VND
        mockMvc.perform(get("/api/v1/trips/" + tripId + "/funds"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalSpentFromFund").value(300000.00))
                .andExpect(jsonPath("$.data.currentBalance").value(700000.00));

        // Test overspending fund balance -> 400 Bad Request
        CreateExpenseRequest overspendReq = CreateExpenseRequest.builder()
                .tripId(tripId)
                .description("Thuê cano cao cấp")
                .amount(new BigDecimal("1000000.00"))
                .isPaidByFund(true)
                .splitType(SplitType.EQUAL)
                .splits(List.of(ExpenseSplitRequest.builder().userId(leaderUser.getId()).build()))
                .build();

        mockMvc.perform(post("/api/v1/expenses")
                        .header("X-User-Id", leaderUser.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(overspendReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        // ==========================================
        // FLOW 4: Personal Expenses & Authorization
        // ==========================================
        // 1. Member tries to pay via fund -> system enforces isPaidByFund = false and payerId = memberUser.getId()
        CreateExpenseRequest memberExpenseReq = CreateExpenseRequest.builder()
                .tripId(tripId)
                .description("Cà phê sáng")
                .amount(new BigDecimal("100000.00"))
                .isPaidByFund(true) // Should be overridden to false
                .payerId(leaderUser.getId()) // Should be overridden to memberUser
                .splitType(SplitType.EQUAL)
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(leaderUser.getId()).build(),
                        ExpenseSplitRequest.builder().userId(memberUser.getId()).build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/expenses")
                        .header("X-User-Id", memberUser.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(memberExpenseReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isPaidByFund").value(false))
                .andExpect(jsonPath("$.data.payerId").value(memberUser.getId()));

        // 3. Leader pays out of pocket 1,000,000 VND for seafood dinner to create a debtor/creditor balance
        CreateExpenseRequest dinnerExpenseReq = CreateExpenseRequest.builder()
                .tripId(tripId)
                .description("Tiệc hải sản đêm")
                .amount(new BigDecimal("1000000.00"))
                .isPaidByFund(false)
                .payerId(leaderUser.getId())
                .splitType(SplitType.EQUAL)
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(leaderUser.getId()).build(),
                        ExpenseSplitRequest.builder().userId(memberUser.getId()).build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/expenses")
                        .header("X-User-Id", leaderUser.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dinnerExpenseReq)))
                .andExpect(status().isCreated());

        // 4. Test EXACT_AMOUNT mismatch sum -> 400 Bad Request
        CreateExpenseRequest exactMismatchReq = CreateExpenseRequest.builder()
                .tripId(tripId)
                .description("Ăn hải sản đêm lỗi sum")
                .amount(new BigDecimal("500000.00"))
                .splitType(SplitType.EXACT_AMOUNT)
                .splits(List.of(
                        ExpenseSplitRequest.builder().userId(leaderUser.getId()).amountOwed(new BigDecimal("200000.00")).build(),
                        ExpenseSplitRequest.builder().userId(memberUser.getId()).amountOwed(new BigDecimal("200000.00")).build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/expenses")
                        .header("X-User-Id", leaderUser.getId().toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(exactMismatchReq)))
                .andExpect(status().isBadRequest());

        // ==========================================
        // FLOW 5: Settlement & Closing Trip
        // ==========================================
        // 1. Get Settlement summary
        MvcResult settlementResult = mockMvc.perform(get("/api/v1/trips/" + tripId + "/settlements")
                        .header("X-User-Id", leaderUser.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.balances.length()").value(2))
                .andReturn();

        String settlementJson = settlementResult.getResponse().getContentAsString();
        SettlementSummaryResponse summaryRes = objectMapper.readValue(
                objectMapper.readTree(settlementJson).get("data").toString(),
                SettlementSummaryResponse.class
        );

        List<SuggestedTransferDTO> transfers = summaryRes.getSuggestedTransfers();

        // 2. Leader completes all suggested transfers
        for (SuggestedTransferDTO transfer : transfers) {
            mockMvc.perform(patch("/api/v1/settlements/" + transfer.getId() + "/complete")
                            .header("X-User-Id", leaderUser.getId().toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.isSettled").value(true));
        }

        // 3. Verify Trip status changed to CLOSED
        mockMvc.perform(get("/api/v1/trips/" + tripId)
                        .header("X-User-Id", leaderUser.getId().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CLOSED"));
    }

}
