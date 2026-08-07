import { create } from 'zustand';

export const usePlanningStore = create((set) => ({
  categories: [],
  plannedExpenses: [],
  budgetSummary: null,
  isLoading: false,
  error: null,

  setCategories: (categories) => set({ categories, error: null }),
  setPlannedExpenses: (plannedExpenses) => set({ plannedExpenses, error: null }),
  setBudgetSummary: (budgetSummary) => set({ budgetSummary, error: null }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));
