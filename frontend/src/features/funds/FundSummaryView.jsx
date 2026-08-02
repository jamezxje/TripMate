import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw, Calendar } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { toast } from 'react-hot-toast';
import { FundContributionModal } from './FundContributionModal';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { fundApi } from './fundApi';
import { useTripStore } from '../../store/useTripStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const FundSummaryView = () => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFundSummary = useCallback(async () => {
    if (!currentTrip?.id) return;
    setIsLoading(true);

    try {
      const res = await fundApi.getFundSummary(currentTrip.id);
      if (res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải thông tin quỹ chung');
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip?.id]);

  useEffect(() => {
    fetchFundSummary();
  }, [fetchFundSummary]);

  if (!currentTrip) {
    return (
      <Card className="text-center py-12">
        <Wallet className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Chưa chọn Chuyến đi</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Vui lòng chọn hoặc tạo mới chuyến đi ở trang danh sách để quản lý quỹ chung.
        </p>
      </Card>
    );
  }

  return (
    <AnimatedPage className="flex flex-col gap-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Wallet className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>{t('nav.fund', 'Quỹ nhóm')} - {currentTrip.name}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Theo dõi tiến độ đóng quỹ và quản lý số dư thu chi quỹ chung.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={RefreshCw} onClick={fetchFundSummary} isLoading={isLoading}>
            Tải lại
          </Button>
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Đóng tiền quỹ
          </Button>
        </div>
      </div>

      {/* Fund Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Collected */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-900/20 dark:to-teal-900/10 border-emerald-200/60 dark:border-emerald-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Tổng quỹ đã thu</p>
              <h3 className="text-2xl font-black text-emerald-900 dark:text-emerald-50 mt-1">
                {formatCurrency(summary?.totalCollected || 0)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100/80 dark:bg-emerald-800/50 rounded-2xl text-emerald-700 dark:text-emerald-300">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Total Spent From Fund */}
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50/40 dark:from-rose-900/20 dark:to-orange-900/10 border-rose-200/60 dark:border-rose-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Đã chi từ quỹ</p>
              <h3 className="text-2xl font-black text-rose-900 dark:text-rose-50 mt-1">
                {formatCurrency(summary?.totalSpentFromFund || 0)}
              </h3>
            </div>
            <div className="p-3 bg-rose-100/80 dark:bg-rose-800/50 rounded-2xl text-rose-700 dark:text-rose-300">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Current Fund Balance */}
        <Card className="bg-gradient-to-br from-indigo-50 to-violet-50/40 dark:from-indigo-900/20 dark:to-violet-900/10 border-indigo-200/60 dark:border-indigo-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Số dư quỹ hiện tại</p>
              <h3 className="text-2xl font-black text-indigo-950 dark:text-indigo-50 mt-1">
                {formatCurrency(summary?.currentBalance || 0)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-100/80 dark:bg-indigo-800/50 rounded-2xl text-indigo-700 dark:text-indigo-300">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Contributions History Table */}
      <Card>
        <CardHeader
          title="Lịch sử Đóng quỹ"
          subtitle="Danh sách chi tiết tiền đóng quỹ của các thành viên trong chuyến đi."
        />
        <CardBody>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="w-full h-14 rounded-xl" />
              <Skeleton className="w-full h-14 rounded-xl" />
              <Skeleton className="w-full h-14 rounded-xl" />
            </div>
          ) : summary?.contributions && summary.contributions.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden sm:block">
                <Table headers={['Thành viên', 'Số tiền đóng', 'Thời gian đóng']}>
                  {summary.contributions.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-800">{c.userName}</td>
                      <td className="px-4 py-3.5 font-extrabold text-emerald-600">
                        +{formatCurrency(c.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="sm:hidden flex flex-col gap-3">
                {summary.contributions.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{c.userName}</span>
                      <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-600 text-lg">
                      +{formatCurrency(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={Wallet}
              title="Chưa có khoản đóng quỹ nào"
              description="Chưa có thành viên nào đóng quỹ. Hãy là người đầu tiên đóng quỹ cho chuyến đi!"
            >
              <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
                Đóng tiền quỹ
              </Button>
            </EmptyState>
          )}
        </CardBody>
      </Card>

      {/* Modal */}
      <FundContributionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchFundSummary}
      />
    </AnimatedPage>
  );
};
