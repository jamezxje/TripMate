package com.tripmate.entity;

import com.tripmate.enums.PaymentSource;
import com.tripmate.enums.PlannedExpenseStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "planned_expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlannedExpense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false, foreignKey = @ForeignKey(name = "fk_planned_expenses_trip"))
    private Trip trip;

    @Column(name = "title", nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false, foreignKey = @ForeignKey(name = "fk_planned_expenses_category"))
    private PlannedExpenseCategory category;

    @Column(name = "estimated_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal estimatedAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_source", nullable = false, length = 10)
    private PaymentSource paymentSource;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsible_person_id", foreignKey = @ForeignKey(name = "fk_planned_expenses_responsible"))
    private User responsiblePerson;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    @Builder.Default
    private PlannedExpenseStatus status = PlannedExpenseStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actual_expense_id", foreignKey = @ForeignKey(name = "fk_planned_expenses_actual_expense"))
    private Expense actualExpense;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "booking_link", length = 500)
    private String bookingLink;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false, foreignKey = @ForeignKey(name = "fk_planned_expenses_created_by"))
    private User createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = PlannedExpenseStatus.PENDING;
        }
    }
}
