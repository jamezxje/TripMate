import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator, CheckCircle2, ArrowRight, RefreshCw, UserCheck, PartyPopper } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Table } from '../../components/Table';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { toast } from 'react-hot-toast';
import { settlementApi } from './settlementApi';
import { useTripStore } from '../../store/useTripStore';
import { useUserStore } from '../../store/useUserStore';
import { formatCurrency } from '../../utils/formatters';

export const SettlementDashboard = () => {
  const { t } = useTranslation();
  const { currentTrip, setCurrentTrip } = useTripStore();
  const { currentUser } = useUserStore();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchSettlementSummary = useCallback(async () => {
    if (!currentTrip?.id) return;
    setIsLoading(true);

    try {
      const res = await settlementApi.getSettlementSummary(currentTrip.id);
      if (res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải thông tin quyết toán');
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip?.id]);

  useEffect(() => {
    fetchSettlementSummary();
  }, [fetchSettlementSummary]);

  const handleCompleteTransfer = async (settlementId) => {
    setActionLoadingId(settlementId);

    try {
      const res = await settlementApi.completeSettlement(settlementId);
      if (res.data) {
        toast.success('Đã đánh dấu hoàn tất chuyển khoản!');
        // Refresh summary to update status and check if trip status changed to CLOSED
        await fetchSettlementSummary();
      }
    } catch (err) {
      toast.error(err.message || 'Thao tác thất bại. Chỉ Trưởng nhóm mới có quyền này.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!currentTrip) {
    return (
      <Card className="text-center py-12">
        <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Chưa chọn Chuyến đi</h3>
        <p className="text-slate-500 text-sm mt-1">
          Vui lòng chọn hoặc tạo mới chuyến đi ở trang danh sách để xem quyết toán.
        </p>
      </Card>
    );
  }

  const allTransfersSettled =
    summary?.suggestedTransfers &&
    summary.suggestedTransfers.length > 0 &&
    summary.suggestedTransfers.every((t) => t.isSettled);

  return (
    <AnimatedPage className="flex flex-col gap-6">
      {/* Top Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Calculator className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>{t('settlement.title', 'Quyết toán Chuyến đi')} - {currentTrip.name}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Bảng tổng sắp số dư cá nhân và đề xuất chuyển khoản bù trừ tối ưu nhất.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" icon={RefreshCw} onClick={fetchSettlementSummary} isLoading={isLoading}>
            Tải lại
          </Button>
        </div>
      </div>

      {/* Congratulations Banner when trip is fully settled & CLOSED */}
      {(allTransfersSettled || summary?.tripStatus === 'CLOSED') && (
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl border-none">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-2xl shrink-0">
              <PartyPopper className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Chuyến đi đã Quyết toán xong!</h3>
              <p className="text-emerald-100 text-sm mt-0.5">
                Tất cả các khoản chuyển tiền giữa các thành viên đã hoàn tất. Trạng thái chuyến đi: <strong>CLOSED (Đã đóng)</strong>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Section 1: User Balances Summary Grid/Table */}
      <Card>
        <CardHeader
          title="Bảng Tổng sắp Số dư Cá nhân"
          subtitle="Số dư = (Đóng quỹ + Ứng tiền trả hộ) - Chi phí cá nhân phải chịu"
        />
        <CardBody>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="w-full h-40 rounded-2xl" />
              <Skeleton className="w-full h-40 rounded-2xl" />
              <Skeleton className="w-full h-40 rounded-2xl" />
            </div>
          ) : summary?.balances && summary.balances.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.balances.map((b) => {
                const isPositive = b.netBalance > 0;
                const isNegative = b.netBalance < 0;

                return (
                  <div
                    key={b.userId}
                    className={`p-4 rounded-2xl border transition-all ${
                      isPositive
                        ? 'bg-emerald-50/40 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50'
                        : isNegative
                        ? 'bg-rose-50/40 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50'
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 font-bold text-xs flex items-center justify-center border dark:border-slate-600 shadow-xs shrink-0 text-slate-700 dark:text-slate-200">
                          {b.fullName ? b.fullName.charAt(0) : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{b.fullName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{b.email}</p>
                        </div>
                      </div>

                      {/* Net Balance Status Badge */}
                      {isPositive ? (
                        <Badge variant="positive">Nhận lại</Badge>
                      ) : isNegative ? (
                        <Badge variant="negative">Đóng thêm</Badge>
                      ) : (
                        <Badge variant="closed">Hòa tiền</Badge>
                      )}
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 text-[11px] border-t border-slate-200/60 dark:border-slate-700/60 pt-3 text-slate-600 dark:text-slate-300 mt-1">
                      <div className="flex justify-between items-center">
                        <span>Đã đóng:</span>
                        <span className="font-semibold">{formatCurrency(b.totalFundContributed)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Tự ứng:</span>
                        <span className="font-semibold">{formatCurrency(b.totalPaidOutOfPocket)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-800 dark:text-slate-100">
                        <span className="font-medium">Chi phí phải chịu:</span>
                        <span className="font-bold">-{formatCurrency(b.totalAmountOwed)}</span>
                      </div>
                    </div>

                    {/* Net Amount Meter Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Số dư ròng</span>
                        <span
                          className={`text-lg font-black tracking-tight ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isNegative
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {formatCurrency(b.netBalance)}
                        </span>
                      </div>
                      {/* Meter bar visual */}
                      <div className="w-full bg-slate-200/70 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-emerald-500' : isNegative ? 'bg-rose-500' : 'bg-slate-400'}`}
                          style={{ 
                            width: `${Math.min(100, (Math.abs(b.netBalance) / (Math.max(b.totalAmountOwed, b.totalFundContributed + b.totalPaidOutOfPocket) || 1)) * 100)}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-right mt-1.5 text-slate-400 font-medium">
                        {isPositive ? 'Cần được hoàn lại' : isNegative ? 'Cần đóng bù' : 'Không có dư nợ'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Calculator}
              title="Chưa có dữ liệu quyết toán"
              description="Hãy thêm các khoản chi tiêu hoặc quỹ nhóm để bắt đầu tính toán số dư cá nhân."
            />
          )}
        </CardBody>
      </Card>

      {/* Section 2: Suggested Transfers List */}
      <Card>
        <CardHeader
          title="Danh sách Chuyển khoản Bù trừ Đề xuất"
          subtitle="Thuật toán tự động tính toán số lượt chuyển tiền tối ưu nhất giữa các cá nhân."
        />
        <CardBody>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="w-full h-24 rounded-2xl" />
              <Skeleton className="w-full h-24 rounded-2xl" />
            </div>
          ) : summary?.suggestedTransfers && summary.suggestedTransfers.length > 0 ? (
            <div className="space-y-3">
              {summary.suggestedTransfers.map((t) => (
                <div
                  key={t.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    t.isSettled
                      ? 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/80 opacity-75'
                      : 'bg-white dark:bg-slate-800 border-indigo-200/80 dark:border-indigo-500/50 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm">
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{t.fromUserName}</span>
                      <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span className="font-extrabold text-slate-800 dark:text-slate-100">{t.toUserName}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Số tiền cần chuyển:</p>
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(t.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-700">
                    {t.isSettled ? (
                      <Badge variant="ongoing" className="gap-1 px-3 py-1.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Đã hoàn tất
                      </Badge>
                    ) : (
                      <Button
                        variant="success"
                        size="sm"
                        icon={CheckCircle2}
                        isLoading={actionLoadingId === t.id}
                        onClick={() => handleCompleteTransfer(t.id)}
                      >
                        Đánh dấu đã chuyển
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="Mọi người đã hoà tiền"
              description="Tất cả thành viên đã hòa tiền hoặc chưa có giao dịch cần chuyển khoản. Tuyệt vời!"
            />
          )}
        </CardBody>
      </Card>
    </AnimatedPage>
  );
};
