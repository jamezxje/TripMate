package com.tripmate.service;

import com.tripmate.dto.request.CreateCategoryRequest;
import com.tripmate.dto.request.UpdateCategoryRequest;
import com.tripmate.dto.response.ExpenseCategoryResponse;

import java.util.List;

public interface ExpenseCategoryService {

    List<ExpenseCategoryResponse> getAllCategories();

    ExpenseCategoryResponse createCategory(CreateCategoryRequest request);

    ExpenseCategoryResponse updateCategory(Long id, UpdateCategoryRequest request);

    void deleteCategory(Long id);
}
