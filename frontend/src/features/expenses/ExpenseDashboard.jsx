import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, AlertCircle, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { expenseApi } from './expenseApi';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ExpenseDashboard = () => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    if (!currentTrip?.id) return;
    fetchExpenses();
  }, [currentTrip?.id]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await expenseApi.getExpensesByTripId(currentTrip.id);
      setExpenses(res.data || []);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu chi tiêu');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const { totalAmount, groupedByCategory } = useMemo(() => {
    let total = 0;
    const grouped = {};

    expenses.forEach(exp => {
      total += exp.amount;
      const catId = exp.categoryId || 'uncategorized';
      if (!grouped[catId]) {
        grouped[catId] = {
          id: catId,
          name: exp.categoryName || 'Không phân loại',
          color: exp.categoryColor || '#94a3b8',
          icon: exp.categoryIcon || '📦',
          total: 0,
          items: []
        };
      }
      grouped[catId].total += exp.amount;
      grouped[catId].items.push(exp);
    });

    const sortedGroups = Object.values(grouped).sort((a, b) => b.total - a.total);
    
    return { totalAmount: total, groupedByCategory: sortedGroups };
  }, [expenses]);

  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;
  
  const slices = groupedByCategory.map(group => {
    const percentage = (group.total / totalAmount);
    if (percentage === 0) return null;
    const strokeLength = percentage * circumference;
    const slice = {
      ...group,
      strokeLength,
      strokeDasharray: `${strokeLength} ${circumference}`,
      strokeDashoffset: -currentOffset,
      percentage: (percentage * 100).toFixed(1)
    };
    currentOffset += strokeLength;
    return slice;
  }).filter(Boolean);

  if (!currentTrip) {
    return (
      <AnimatedPage className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <PieChart className="w-8 h-8 text-slate-400" />
        </div>
        <p className="text-slate-500 dark:text-slate-400">Vui lòng chọn chuyến đi để xem thống kê.</p>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="space-y-6 pb-20 md:pb-6">
      <Card className="border border-slate-200/60 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Tổng quan chi tiêu
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Phân bổ ngân sách theo từng danh mục</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block">Tổng chi phí</span>
            {loading ? (
              <Skeleton className="w-24 h-7 mt-1" />
            ) : (
              <span className="text-2xl font-black text-indigo-700 dark:text-indigo-300 leading-tight">
                {formatCurrency(totalAmount)}
              </span>
            )}
          </div>
        </div>

        <CardBody className="p-6">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center gap-2 mb-6 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="space-y-6">
              <Skeleton className="w-full h-8 rounded-full" />
              <div className="space-y-3">
                <Skeleton className="w-full h-20 rounded-2xl" />
                <Skeleton className="w-full h-20 rounded-2xl" />
              </div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-slate-700 dark:text-slate-300 font-bold">Chưa có dữ liệu</h3>
              <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">Chưa có khoản chi tiêu nào để thống kê.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* SVG Donut Chart & Legend */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 py-4">
                {/* Chart */}
                <div className="relative w-52 h-52 shrink-0 group">
                  <svg className="w-full h-full -rotate-90 drop-shadow-sm" viewBox="0 0 140 140">
                    <circle
                      cx="70" cy="70" r={radius}
                      fill="transparent"
                      stroke="#f1f5f9"
                      strokeWidth="18"
                      className="dark:stroke-slate-800 transition-colors"
                    />
                    {slices.map((slice) => (
                      <circle
                        key={slice.id}
                        cx="70" cy="70" r={radius}
                        fill="transparent"
                        stroke={slice.color}
                        strokeWidth="18"
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        className="transition-all duration-1000 ease-in-out hover:opacity-80 hover:stroke-[22px] cursor-pointer"
                        title={`${slice.name}: ${formatCurrency(slice.total)} (${slice.percentage}%)`}
                      />
                    ))}
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng cộng</span>
                    <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 mt-0.5">
                      {formatCurrency(totalAmount).replace(' đ', '').replace(' ₫', '')}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">VNĐ</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 w-full grid grid-cols-2 gap-x-4 gap-y-3">
                  {slices.map((slice) => (
                    <div 
                      key={slice.id} 
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => toggleCategory(slice.id)}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: `${slice.color}20`, color: slice.color }}>
                        {slice.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{slice.name}</p>
                        <p className="text-[11px] font-medium text-slate-500">{slice.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accordion List */}
              <div className="space-y-3">
                {groupedByCategory.map((group) => {
                  const isExpanded = expandedCategories[group.id];
                  const percentage = ((group.total / totalAmount) * 100).toFixed(1);

                  return (
                    <div key={group.id} className="border border-slate-200/60 dark:border-slate-700/60 rounded-2xl overflow-hidden bg-white dark:bg-slate-800 transition-all duration-300">
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleCategory(group.id)}
                        className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm"
                            style={{ backgroundColor: `${group.color}20`, color: group.color }}
                          >
                            {group.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 dark:text-slate-100">{group.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {group.items.length} khoản chi • {percentage}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(group.total)}</span>
                          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20 divide-y divide-slate-100 dark:divide-slate-700/50">
                          {group.items.map(exp => (
                            <div key={exp.id} className="p-3 pl-16 pr-4 flex items-center justify-between hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="min-w-0 pr-4">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{exp.description}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                                  <span>{formatDate(exp.createdAt)}</span>
                                  <span>•</span>
                                  <span>Người chi: <span className="font-medium text-slate-600 dark:text-slate-400">{exp.payerName}</span></span>
                                </div>
                              </div>
                              <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">{formatCurrency(exp.amount)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </AnimatedPage>
  );
};
