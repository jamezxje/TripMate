import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Plus, RefreshCw, Wallet, UserCheck, Calendar } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { Alert } from '../../components/Alert';
import { SplitExpenseForm } from './SplitExpenseForm';
import { expenseApi } from './expenseApi';
import { useTripStore } from '../../store/useTripStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ExpenseList = () => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!currentTrip?.id) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await expenseApi.getExpensesByTripId(currentTrip.id);
      if (res.data) {
        setExpenses(res.data);
      }
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách chi tiêu');
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip?.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  if (!currentTrip) {
    return (
      <Card className="text-center py-12">
        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Chưa chọn Chuyến đi</h3>
        <p className="text-slate-500 text-sm mt-1">
          Vui lòng chọn hoặc tạo mới chuyến đi ở trang danh sách để quản lý chi tiêu.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600" />
            <span>{t('expense.list_title', 'Danh sách Chi tiêu')} - {currentTrip.name}</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Ghi chép và phân bổ các khoản chi trong chuyến đi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" icon={RefreshCw} onClick={fetchExpenses} isLoading={isLoading}>
            Tải lại
          </Button>
          <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
            Thêm khoản chi mới
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Expenses History List */}
      {expenses && expenses.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {expenses.map((item) => (
            <Card key={item.id} className="hover:border-indigo-200 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 mt-0.5">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">{item.description}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span>•</span>
                      <span>Người ghi: <strong className="text-slate-700">{item.createdByName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end">
                  <span className="text-2xl font-black text-indigo-600">
                    {formatCurrency(item.amount)}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    {item.isPaidByFund ? (
                      <Badge variant="settled" className="gap-1">
                        <Wallet className="w-3 h-3" /> Trả từ Quỹ chung
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-500 font-medium">
                        Trả bởi: <strong className="text-slate-800">{item.payerName}</strong>
                      </span>
                    )}
                    <Badge variant="info">{item.splitType}</Badge>
                  </div>
                </div>
              </div>

              {/* Splits List */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Phân bổ chi phí ({item.splits?.length || 0} người chịu)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {item.splits?.map((split) => (
                    <div
                      key={split.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-700 truncate max-w-[100px]">
                        {split.userName}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(split.amountOwed)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">Chưa có khoản chi nào</h3>
          <p className="text-slate-500 text-sm mt-1">
            Bấm "Thêm khoản chi mới" để bắt đầu ghi chép chi tiêu cho chuyến đi!
          </p>
        </Card>
      )}

      {/* Create Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm khoản chi tiêu mới"
        maxWidth="max-w-2xl"
      >
        <SplitExpenseForm
          onSuccess={() => {
            setIsModalOpen(false);
            fetchExpenses();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
