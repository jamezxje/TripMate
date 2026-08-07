package com.tripmate.controller;

import com.tripmate.dto.request.CreateCategoryRequest;
import com.tripmate.dto.request.UpdateCategoryRequest;
import com.tripmate.dto.response.ApiResponse;
import com.tripmate.dto.response.ExpenseCategoryResponse;
import com.tripmate.service.ExpenseCategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/expense-categories")
@RequiredArgsConstructor
public class ExpenseCategoryController {

    private final ExpenseCategoryService expenseCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ExpenseCategoryResponse>>> getAllCategories() {
        log.info("API GET /api/v1/expense-categories - Lấy toàn bộ danh mục");
        List<ExpenseCategoryResponse> response = expenseCategoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục thành công", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseCategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request) {
        log.info("API POST /api/v1/expense-categories - Tạo danh mục mới: {}", request.getName());
        ExpenseCategoryResponse response = expenseCategoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo danh mục thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseCategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCategoryRequest request) {
        log.info("API PUT /api/v1/expense-categories/{} - Cập nhật danh mục: {}", id, request.getName());
        ExpenseCategoryResponse response = expenseCategoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        log.info("API DELETE /api/v1/expense-categories/{} - Xóa danh mục", id);
        expenseCategoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa danh mục thành công", null));
    }
}
