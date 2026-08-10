import api from '../../services/api';

export const expenseCategoryApi = {
  getAllCategories: () => api.get('/expense-categories'),
};
