import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { usePlanningStore } from '../../store/usePlanningStore';
import { formatCurrency } from '../../utils/formatters';
import { AlertTriangle, Wallet, PieChart } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';

export const BudgetOverviewCard = () => {
  const { t } = useTranslation();
  const { budgetSummary, isLoading } = usePlanningStore();

  if (isLoading && !budgetSummary) {
    return (
      <Card>
        <CardBody className="p-6">
          <Skeleton className="w-1/3 h-6 mb-4" />
          <Skeleton className="w-full h-4 mb-2" />
          <Skeleton className="w-2/3 h-4" />
        </CardBody>
      </Card>
    );
  }

  if (!budgetSummary) return null;

  const { totalFund, totalEstimated, totalFundEstimated, breakdown } = budgetSummary;
  
  const isOverBudget = totalFundEstimated > totalFund;
  
  // Calculate percentage of fund used by planned expenses using FUND
  const fundUsagePercentage = totalFund > 0 ? Math.min((totalFundEstimated / totalFund) * 100, 100) : 0;

  return (
    <Card className="overflow-hidden">
      <div className="bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between py-4 px-5 sm:px-6 border-b border-slate-200/80 dark:border-slate-700/80">
        <h3 className="font-bold flex items-center gap-2">
          <PieChart className="w-5 h-5 text-indigo-500" />
          {t('planning.budget_overview', 'Tổng quan Ngân sách')}
        </h3>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t('nav.fund', 'Quỹ chung')}</p>
            <p className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalFund)}</p>
          </div>
          <div className="text-right border-l pl-4 dark:border-slate-700">
            <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">{t('planning.total_estimated', 'Tổng dự trù')}</p>
            <p className="font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(totalEstimated)}</p>
          </div>
        </div>
      </div>
      <CardBody className="p-6 space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Dự trù từ Quỹ chung: <span className="font-bold">{formatCurrency(totalFundEstimated)}</span>
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500">{fundUsagePercentage.toFixed(1)}%</span>
          </div>
          
          <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div 
              className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-indigo-500'}`}
              style={{ width: `${fundUsagePercentage}%` }}
            />
          </div>
          
          {isOverBudget && (
            <div className="mt-3 flex items-center gap-2 text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-3 py-2 rounded-lg text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {t('planning.warning_over_budget', 'Dự trù vượt quá quỹ chung hiện có!')}
            </div>
          )}
        </div>

        {breakdown && breakdown.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cơ cấu dự trù</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {breakdown.map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                      style={{ backgroundColor: `${item.category?.color || '#cbd5e1'}20`, color: item.category?.color || '#cbd5e1' }}
                    >
                      {item.category?.icon || '📦'}
                    </span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate" title={item.category?.name || 'Khác'}>
                      {item.category?.name || 'Khác'}
                    </span>
                  </div>
                  <p className="font-bold text-sm">{formatCurrency(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
