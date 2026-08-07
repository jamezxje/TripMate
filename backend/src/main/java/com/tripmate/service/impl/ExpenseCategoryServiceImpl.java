package com.tripmate.service.impl;

import com.tripmate.dto.request.CreateCategoryRequest;
import com.tripmate.dto.request.UpdateCategoryRequest;
import com.tripmate.dto.response.ExpenseCategoryResponse;
import com.tripmate.entity.PlannedExpenseCategory;
import com.tripmate.exception.InvalidExpenseException;
import com.tripmate.exception.ResourceNotFoundException;
import com.tripmate.repository.PlannedExpenseCategoryRepository;
import com.tripmate.service.ExpenseCategoryService;
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
public class ExpenseCategoryServiceImpl implements ExpenseCategoryService {

    private final PlannedExpenseCategoryRepository categoryRepository;

    @Override
    public List<ExpenseCategoryResponse> getAllCategories() {
        return categoryRepository.findAllOrderByDefaultFirst().stream()
                .map(ExpenseCategoryResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ExpenseCategoryResponse createCategory(CreateCategoryRequest request) {
        PlannedExpenseCategory category = PlannedExpenseCategory.builder()
                .name(request.getName())
                .icon(request.getIcon())
                .color(request.getColor())
                .isDefault(false)
                .build();
        return ExpenseCategoryResponse.fromEntity(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public ExpenseCategoryResponse updateCategory(Long id, UpdateCategoryRequest request) {
        PlannedExpenseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        if (category.isDefault()) {
            throw new InvalidExpenseException("Không thể sửa danh mục hệ thống mặc định");
        }

        category.setName(request.getName());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());

        return ExpenseCategoryResponse.fromEntity(categoryRepository.save(category));
    }

    @Override
    @Transactional
    public void deleteCategory(Long id) {
        PlannedExpenseCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục"));

        if (category.isDefault()) {
            throw new InvalidExpenseException("Không thể xóa danh mục hệ thống mặc định");
        }

        if (categoryRepository.isUsedByPlannedExpense(id)) {
            throw new InvalidExpenseException("Không thể xóa danh mục đang được sử dụng");
        }

        categoryRepository.delete(category);
    }
}
