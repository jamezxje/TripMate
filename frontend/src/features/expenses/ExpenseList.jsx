import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Plus, RefreshCw, Wallet, UserCheck, Calendar, ArrowDownCircle, ArrowUpCircle, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import { AnimatedPage } from '../../components/layout/AnimatedPage';
import { Skeleton } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';
import { toast } from 'react-hot-toast';
import { SplitExpenseForm } from './SplitExpenseForm';
import { EditExpenseModal } from './EditExpenseModal';
import { expenseApi } from './expenseApi';
import { fundApi } from '../funds/fundApi';
import { useTripStore } from '../../store/useTripStore';
import { useUserStore } from '../../store/useUserStore';
import { formatCurrency, formatDate } from '../../utils/formatters';

export const ExpenseList = () => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  const { currentUser } = useUserStore();
  const [expenses, setExpenses] = useState([]);
  const [fundSummary, setFundSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Filter state
  const [filterDate, setFilterDate] = useState('');

  // Determine current user role in trip
  const currentMember = currentTrip?.members?.find(
    (m) => String(m.userId) === String(currentUser?.id)
  );
  const isLeader = currentMember?.role === 'LEADER';

  // Check if user can edit/delete an expense
  const canEditDelete = (expense) => {
    if (!currentUser) return false;
    return isLeader || String(expense.createdById) === String(currentUser.id);
  };

  const handleDelete = async (expense) => {
    const hasSettled = expenses.some(() => false); // placeholder; warning shown via confirm
    const warningMsg = isLeader
      ? `⚠️ Lưu ý: Nếu đã có giao dịch quyết toán được xác nhận, xóa chi tiêu này có thể làm lệch số liệu.\n\n`
      : '';
    const confirmed = window.confirm(
      `${warningMsg}Bạn có chắc muốn xóa khoản chi "${expense.description}" (${formatCurrency(expense.amount)}) không?\nHành động này không thể hoàn tác.`
    );
    if (!confirmed) return;

    setDeletingId(expense.id);
    try {
      await expenseApi.deleteExpense(expense.id);
      toast.success('Đã xóa khoản chi tiêu thành công!');
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Xóa thất bại');
    } finally {
      setDeletingId(null);
    }
  };

  const fetchExpenses = useCallback(async () => {
    if (!currentTrip?.id) return;
    setIsLoading(true);

    try {
      const [expRes, fundRes] = await Promise.all([
        expenseApi.getExpensesByTripId(currentTrip.id),
        fundApi.getFundSummary(currentTrip.id)
      ]);
      
      if (expRes.data) {
        setExpenses(expRes.data);
        setCurrentPage(1); // Reset to first page when new data loads
      }
      if (fundRes.data) {
        setFundSummary(fundRes.data);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải danh sách chi tiêu');
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip?.id]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Derived state for filtering
  const filteredExpenses = expenses.filter(item => {
    if (!filterDate) return true;
    if (!item.createdAt) return false;
    const expenseDate = new Date(item.createdAt).toLocaleDateString('en-CA'); // Gets YYYY-MM-DD in local time
    return expenseDate === filterDate;
  });

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
    <AnimatedPage className="flex flex-col gap-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>{t('expense.list_title', 'Danh sách Chi tiêu')} - {currentTrip.name}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Ghi chép và phân bổ các khoản chi trong chuyến đi.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input 
              type="date"
              className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-0 p-0 w-32"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setCurrentPage(1);
              }}
            />
            {filterDate && (
              <button 
                onClick={() => { setFilterDate(''); setCurrentPage(1); }}
                className="text-slate-400 hover:text-rose-500 transition-colors text-xs font-medium ml-1"
              >
                Xóa
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" icon={RefreshCw} onClick={fetchExpenses} isLoading={isLoading}>
              Tải lại
            </Button>
            <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
              Thêm mới
            </Button>
          </div>
        </div>
      </div>
      
      {/* Fund Balance Summary */}
      {fundSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Collected */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50/40 dark:from-emerald-900/20 dark:to-teal-900/10 border-emerald-200/60 dark:border-emerald-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Tổng quỹ đã thu</p>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-50 mt-1">
                  {formatCurrency(fundSummary?.totalCollected || 0)}
                </h3>
              </div>
              <div className="p-3 bg-emerald-100/80 dark:bg-emerald-800/50 rounded-2xl text-emerald-700 dark:text-emerald-300">
                <ArrowDownCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </Card>

          {/* Total Spent From Fund */}
          <Card className="bg-gradient-to-br from-rose-50 to-orange-50/40 dark:from-rose-900/20 dark:to-orange-900/10 border-rose-200/60 dark:border-rose-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Đã chi từ quỹ</p>
                <h3 className="text-xl sm:text-2xl font-black text-rose-900 dark:text-rose-50 mt-1">
                  {formatCurrency(fundSummary?.totalSpentFromFund || 0)}
                </h3>
              </div>
              <div className="p-3 bg-rose-100/80 dark:bg-rose-800/50 rounded-2xl text-rose-700 dark:text-rose-300">
                <ArrowUpCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </Card>

          {/* Current Fund Balance */}
          <Card className="bg-gradient-to-br from-indigo-50 to-violet-50/40 dark:from-indigo-900/20 dark:to-violet-900/10 border-indigo-200/60 dark:border-indigo-800/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Số dư quỹ hiện tại</p>
                <h3 className="text-xl sm:text-2xl font-black text-indigo-950 dark:text-indigo-50 mt-1">
                  {formatCurrency(fundSummary?.currentBalance || 0)}
                </h3>
              </div>
              <div className="p-3 bg-indigo-100/80 dark:bg-indigo-800/50 rounded-2xl text-indigo-700 dark:text-indigo-300">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Expense List */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`exp-skel-${i}`} className="p-5 flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-start gap-4">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="flex flex-col gap-2 w-48 sm:w-64">
                  <Skeleton className="w-full h-6" />
                  <Skeleton className="w-2/3 h-4" />
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Skeleton className="w-24 h-8" />
                <Skeleton className="w-20 h-5" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredExpenses && filteredExpenses.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4">
            {filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item) => (
            <Card key={item.id} className="hover:-translate-y-1 hover:shadow-md transition-all duration-300 border-slate-200/60 dark:border-slate-700 overflow-hidden group !p-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-800 relative">
                {/* Decorative side accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <div className="flex items-start gap-4">
                  <div className="p-3.5 bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/30 dark:to-orange-900/20 text-rose-500 dark:text-rose-400 rounded-2xl shrink-0 border border-rose-100/50 dark:border-rose-800/50 shadow-inner">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{item.description}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-700/80 px-2 py-0.5 rounded-full">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-300" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">Người tạo: <strong className="text-slate-700 dark:text-slate-200">{item.createdByName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end mt-2 md:mt-0 gap-2">
                  <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                    {formatCurrency(item.amount)}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {item.isPaidByFund ? (
                      <Badge variant="settled" className="gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50">
                        <Wallet className="w-3.5 h-3.5" /> Trả từ Quỹ
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                        <span>Trả bởi:</span>
                        <div className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-400 font-bold text-[8px] flex items-center justify-center">
                          {item.payerName?.charAt(0)}
                        </div>
                        <strong className="text-slate-700 dark:text-slate-200">{item.payerName}</strong>
                      </div>
                    )}
                    <Badge variant="info" className="bg-indigo-50 text-indigo-700 border-indigo-200">{item.splitType}</Badge>
                  </div>

                  {/* Edit / Delete Actions */}
                  {canEditDelete(item) && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <button
                        onClick={() => setEditExpense(item)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400 rounded-lg transition-all"
                        title="Sửa khoản chi"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-lg transition-all disabled:opacity-50"
                        title="Xóa khoản chi"
                      >
                        {deletingId === item.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-rose-400/30 border-t-rose-500 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        Xóa
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Splits List (Avatar based) */}
              <div className="bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 p-4">
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                  Phân bổ ({item.splits?.length || 0} người)
                </p>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {item.splits?.map((split) => (
                    <div
                      key={split.id}
                      className="pl-1 pr-3 py-1 rounded-full bg-white border border-slate-200/80 flex items-center gap-2 shadow-sm hover:border-indigo-200 hover:shadow transition-all"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-100 to-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center border border-white shadow-sm shrink-0">
                        {split.userName?.charAt(0)}
                      </div>
                      <div className="flex flex-col leading-none py-0.5">
                        <span className="font-bold text-slate-700 text-[11px] truncate max-w-[80px]">
                          {split.userName}
                        </span>
                        <span className="font-black text-rose-600 text-[10px] mt-0.5">
                          {formatCurrency(split.amountOwed)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredExpenses.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} / {filteredExpenses.length}
                </span>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Số dòng:</span>
                  <select 
                    className="text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg px-2 py-1 outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition-colors"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    {[5, 10, 20, 50, 75, 100].map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredExpenses.length > itemsPerPage && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3"
                  >
                    Trước
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.ceil(filteredExpenses.length / itemsPerPage) }).map((_, i) => {
                      // Simple logic to show only surrounding pages if there are many pages
                      const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
                      if (
                        i === 0 || 
                        i === totalPages - 1 || 
                        (i >= currentPage - 2 && i <= currentPage)
                      ) {
                        return (
                          <button
                            key={i}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                              currentPage === i + 1 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                            }`}
                          >
                            {i + 1}
                          </button>
                        );
                      } else if (i === currentPage - 3 || i === currentPage + 1) {
                        return <span key={i} className="text-slate-400 dark:text-slate-500">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={currentPage === Math.ceil(filteredExpenses.length / itemsPerPage)}
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredExpenses.length / itemsPerPage), p + 1))}
                    className="px-3"
                  >
                    Sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={Receipt}
          title={filterDate ? "Không có chi tiêu nào trong ngày này" : "Chưa có khoản chi nào"}
          description={filterDate ? "Vui lòng chọn ngày khác hoặc xóa bộ lọc." : "Bấm 'Thêm mới' để bắt đầu ghi chép chi tiêu cho chuyến đi!"}
        >
          {filterDate ? (
            <Button variant="outline" onClick={() => { setFilterDate(''); setCurrentPage(1); }}>
              Xóa bộ lọc ngày
            </Button>
          ) : (
            <Button icon={Plus} onClick={() => setIsModalOpen(true)}>
              Thêm khoản chi mới
            </Button>
          )}
        </EmptyState>
      )}

      {/* Create Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Thêm khoản chi tiêu mới"
        maxWidth="max-w-2xl"
      >
        <SplitExpenseForm
          fundBalance={fundSummary?.currentBalance || 0}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchExpenses();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={!!editExpense}
        onClose={() => setEditExpense(null)}
        expense={editExpense}
        fundBalance={fundSummary?.currentBalance || 0}
        onSuccess={() => {
          setEditExpense(null);
          fetchExpenses();
        }}
      />
    </AnimatedPage>
  );
};
