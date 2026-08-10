package com.tripmate.config;

import com.tripmate.entity.PlannedExpenseCategory;
import com.tripmate.entity.User;
import com.tripmate.repository.PlannedExpenseCategoryRepository;
import com.tripmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PlannedExpenseCategoryRepository categoryRepository;

    @Override
    public void run(String... args) {
        // Seed default users
        if (!userRepository.existsByEmail("anv@example.com")) {
            userRepository.save(User.builder()
                    .email("anv@example.com")
                    .fullName("Nguyễn Văn A")
                    .passwordHash("hash123")
                    .build());
        }

        if (!userRepository.existsByEmail("btt@example.com")) {
            userRepository.save(User.builder()
                    .email("btt@example.com")
                    .fullName("Trần Thị B")
                    .passwordHash("hash123")
                    .build());
        }

        if (!userRepository.existsByEmail("lvc@example.com")) {
            userRepository.save(User.builder()
                    .email("lvc@example.com")
                    .fullName("Lê Văn C")
                    .passwordHash("hash123")
                    .build());
        }

        // Seed default expense categories (only if none exist)
        if (categoryRepository.count() == 0) {
            log.info("Seeding default expense categories...");
            List<PlannedExpenseCategory> defaultCategories = List.of(
                PlannedExpenseCategory.builder()
                    .name("Ăn uống").icon("🍜").color("#f97316").isDefault(true).build(),
                PlannedExpenseCategory.builder()
                    .name("Khách sạn").icon("🏨").color("#8b5cf6").isDefault(true).build(),
                PlannedExpenseCategory.builder()
                    .name("Di chuyển").icon("🚌").color("#3b82f6").isDefault(true).build(),
                PlannedExpenseCategory.builder()
                    .name("Vui chơi").icon("🎡").color("#ec4899").isDefault(true).build(),
                PlannedExpenseCategory.builder()
                    .name("Mua sắm").icon("🛍️").color("#10b981").isDefault(true).build(),
                PlannedExpenseCategory.builder()
                    .name("Nhiên liệu").icon("⛽").color("#f59e0b").isDefault(true).build(),
                PlannedExpenseCategory.builder()
                    .name("Y tế").icon("💊").color("#ef4444").isDefault(true).build(),
                PlannedExpenseCategory.builder()
                    .name("Khác").icon("📦").color("#6b7280").isDefault(true).build()
            );
            categoryRepository.saveAll(defaultCategories);
            log.info("Seeded {} default expense categories.", defaultCategories.size());
        }
    }
}
