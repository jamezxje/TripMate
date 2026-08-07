import { create } from 'zustand';

export const usePlanningStore = create((set) => ({
  categories: [],
  plannedExpenses: [],
  budgetSummary: null,
  checklistSummary: null,
  checklistItems: [],
  isLoading: false,
  error: null,

  setCategories: (categories) => set({ categories, error: null }),
  setPlannedExpenses: (plannedExpenses) => set({ plannedExpenses, error: null }),
  setBudgetSummary: (budgetSummary) => set({ budgetSummary, error: null }),
  setChecklistSummary: (checklistSummary) => set({
    checklistSummary,
    checklistItems: checklistSummary?.items || [],
    error: null
  }),
  setChecklistItems: (checklistItems) => set({ checklistItems }),
  
  addChecklistItem: (item) => set((state) => ({
    checklistItems: [item, ...state.checklistItems]
  })),
  
  updateChecklistItemInStore: (updatedItem) => set((state) => ({
    checklistItems: state.checklistItems.map(item => item.id === updatedItem.id ? updatedItem : item)
  })),
  
  removeChecklistItem: (itemId) => set((state) => ({
    checklistItems: state.checklistItems.filter(item => item.id !== itemId)
  })),

  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
}));

