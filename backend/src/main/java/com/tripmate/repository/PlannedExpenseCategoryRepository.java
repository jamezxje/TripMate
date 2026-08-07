package com.tripmate.repository;

import com.tripmate.entity.PlannedExpenseCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PlannedExpenseCategoryRepository extends JpaRepository<PlannedExpenseCategory, Long> {

    /**
     * Kiểm tra xem danh mục có đang được sử dụng bởi ít nhất 1 planned expense không.
     * Dùng để bảo vệ xóa danh mục.
     */
    @Query("SELECT COUNT(pe) > 0 FROM PlannedExpense pe WHERE pe.category.id = :categoryId")
    boolean isUsedByPlannedExpense(@Param("categoryId") Long categoryId);

    /**
     * Lấy tất cả danh mục sắp xếp: mặc định trước, rồi theo tên.
     */
    @Query("SELECT c FROM PlannedExpenseCategory c ORDER BY c.isDefault DESC, c.name ASC")
    List<PlannedExpenseCategory> findAllOrderByDefaultFirst();
}
