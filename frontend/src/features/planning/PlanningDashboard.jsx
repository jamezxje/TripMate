import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTripStore } from '../../store/useTripStore';
import { usePlanningStore } from '../../store/usePlanningStore';
import { plannedExpenseApi, categoryApi, checklistApi, itineraryApi } from './planningApi';
import { BudgetOverviewCard } from './BudgetOverviewCard';
import { CategoryManager } from './CategoryManager';
import { PlannedExpenseList } from './PlannedExpenseList';
import { ChecklistPanel } from './ChecklistPanel';
import { ItineraryPanel } from './ItineraryPanel';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Skeleton } from '../../components/Skeleton';

export const PlanningDashboard = () => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  const { setCategories, setBudgetSummary, setPlannedExpenses, setChecklistSummary, setItineraryDays, isLoading, setIsLoading } = usePlanningStore();
  
  const loadData = async () => {
    if (!currentTrip?.id) return;
    setIsLoading(true);
    try {
      const [catRes, budgetRes, expenseRes, checklistRes, itineraryRes] = await Promise.all([
        categoryApi.getAll(),
        plannedExpenseApi.getBudgetSummary(currentTrip.id),
        plannedExpenseApi.getAll(currentTrip.id),
        checklistApi.getSummary(currentTrip.id),
        itineraryApi.getItinerary(currentTrip.id)
      ]);
      setCategories(catRes?.data || []);
      setBudgetSummary(budgetRes?.data || null);
      setPlannedExpenses(expenseRes?.data || []);
      setChecklistSummary(checklistRes?.data || null);
      setItineraryDays(itineraryRes?.data || []);
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
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Chưa chọn chuyến đi</h2>
        <p className="text-sm">Vui lòng chọn một chuyến đi từ danh sách để xem phần Lên kế hoạch.</p>
      </div>
    );
  }

  if (isLoading && !currentTrip) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
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
      
      {/* Itinerary Timeline Panel */}
      <ItineraryPanel onRefresh={loadData} />

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
