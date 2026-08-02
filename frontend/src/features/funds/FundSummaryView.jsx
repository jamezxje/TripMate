import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { Alert } from '../../components/Alert';
import { FundContributionModal } from './FundContributionModal';
import { fundApi } from './fundApi';
import { useTripStore } from '../../store/useTripStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const FundSummaryView = () => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFundSummary = useCallback(async () => {
    if (!currentTrip?.id) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fundApi.getFundSummary(currentTrip.id);
      if (res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải thông tin quỹ chung');
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
        <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Chưa chọn Chuyến đi</h3>
        <p className="text-slate-500 text-sm mt-1">
          Vui lòng chọn hoặc tạo mới chuyến đi ở trang danh sách để quản lý quỹ chung.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Wallet className="w-7 h-7 text-indigo-600" />
            <span>{t('nav.fund', 'Quỹ nhóm')} - {currentTrip.name}</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
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

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Fund Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Collected */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border-emerald-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Tổng quỹ đã thu</p>
              <h3 className="text-2xl font-black text-emerald-900 mt-1">
                {formatCurrency(summary?.totalCollected || 0)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100/80 rounded-2xl text-emerald-700">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Total Spent From Fund */}
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50/40 border-rose-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-rose-600">Đã chi từ quỹ</p>
              <h3 className="text-2xl font-black text-rose-900 mt-1">
                {formatCurrency(summary?.totalSpentFromFund || 0)}
              </h3>
            </div>
            <div className="p-3 bg-rose-100/80 rounded-2xl text-rose-700">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        {/* Current Fund Balance */}
        <Card className="bg-gradient-to-br from-indigo-50 to-violet-50/40 border-indigo-200/60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Số dư quỹ hiện tại</p>
              <h3 className="text-2xl font-black text-indigo-950 mt-1">
                {formatCurrency(summary?.currentBalance || 0)}
              </h3>
            </div>
            <div className="p-3 bg-indigo-100/80 rounded-2xl text-indigo-700">
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
          {summary?.contributions && summary.contributions.length > 0 ? (
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
          ) : (
            <p className="text-center py-8 text-slate-500 text-sm">
              Chưa có khoản đóng quỹ nào được ghi nhận. Bấm "Đóng tiền quỹ" để thêm mới!
            </p>
          )}
        </CardBody>
      </Card>

      {/* Modal */}
      <FundContributionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchFundSummary}
      />
    </div>
  );
};
