import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTripStore } from '../../store/useTripStore';
import { usePlanningStore } from '../../store/usePlanningStore';
import { plannedExpenseApi, categoryApi, checklistApi } from './planningApi';
import { BudgetOverviewCard } from './BudgetOverviewCard';
import { CategoryManager } from './CategoryManager';
import { PlannedExpenseList } from './PlannedExpenseList';
import { ChecklistPanel } from './ChecklistPanel';
import { AnimatedPage } from '../../components/layout/AnimatedPage';

export const PlanningDashboard = () => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  const { setCategories, setBudgetSummary, setPlannedExpenses, setChecklistSummary, setIsLoading } = usePlanningStore();
  
  const loadData = async () => {
    if (!currentTrip?.id) return;
    setIsLoading(true);
    try {
      const [catRes, budgetRes, expenseRes, checklistRes] = await Promise.all([
        categoryApi.getAll(),
        plannedExpenseApi.getBudgetSummary(currentTrip.id),
        plannedExpenseApi.getAll(currentTrip.id),
        checklistApi.getSummary(currentTrip.id)
      ]);
      setCategories(catRes?.data || []);
      setBudgetSummary(budgetRes?.data || null);
      setPlannedExpenses(expenseRes?.data || []);
      setChecklistSummary(checklistRes?.data || null);
    } catch (error) {
      console.error("Failed to load planning data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentTrip?.id]);

  if (!currentTrip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <h2 className="text-xl font-bold text-slate-700 mb-2">Chưa chọn chuyến đi</h2>
        <p>Vui lòng chọn một chuyến đi từ danh sách để xem phần Lên kế hoạch.</p>
      </div>
    );
  }

  return (
    <AnimatedPage className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t('planning.title', 'Kế hoạch & Dự trù')}</h1>
          <p className="text-sm text-slate-500">{currentTrip.name}</p>
        </div>
      </div>
      
      {/* Checklist Panel */}
      <ChecklistPanel onRefresh={loadData} />

      {/* Budget Summary Card */}
      <BudgetOverviewCard />
      
      {/* Planned Expenses & Categories Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PlannedExpenseList onRefresh={loadData} />
        </div>
        <div className="space-y-6">
          <CategoryManager onRefresh={loadData} />
        </div>
      </div>
    </AnimatedPage>
  );
};
