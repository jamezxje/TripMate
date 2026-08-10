import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, FileText, UserCheck, Wallet, CheckSquare, Square, X, Pencil, Tag } from 'lucide-react';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { toast } from 'react-hot-toast';
import { expenseApi } from './expenseApi';
import { useCategoryList } from './useCategoryList';
import { useUserStore } from '../../store/useUserStore';
import { useTripStore } from '../../store/useTripStore';
import { formatCurrency } from '../../utils/formatters';

export const EditExpenseModal = ({ isOpen, onClose, expense, fundBalance = 0, onSuccess }) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const { currentTrip } = useTripStore();
  const { categories } = useCategoryList();

  const currentMember = currentTrip?.members?.find(
    (m) => String(m.userId) === String(currentUser?.id)
  );
  const isLeader = currentMember?.role === 'LEADER';

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isPaidByFund, setIsPaidByFund] = useState(false);
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [exactAmounts, setExactAmounts] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [categoryId, setCategoryId] = useState('');

  // Pre-fill form when expense changes
  useEffect(() => {
    if (expense && isOpen) {
      setDescription(expense.description || '');
      setAmount(String(expense.amount || ''));
      setIsPaidByFund(expense.isPaidByFund || false);
      setPayerId(expense.payerId ? String(expense.payerId) : '');
      setSplitType(expense.splitType || 'EQUAL');
      setCategoryId(expense.categoryId ? String(expense.categoryId) : '');

      const splitUserIds = expense.splits?.map((s) => s.userId) || [];
      setSelectedUserIds(splitUserIds);

      const exactAmountsMap = {};
      if (expense.splitType === 'EXACT_AMOUNT') {
        expense.splits?.forEach((s) => {
          exactAmountsMap[s.userId] = String(s.amountOwed);
        });
      }
      setExactAmounts(exactAmountsMap);
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const toggleParticipant = (userId) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length === 1) return;
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleExactAmountChange = (userId, val) => {
    setExactAmounts((prev) => ({ ...prev, [userId]: val }));
  };

  const numAmount = parseFloat(amount) || 0;
  const numParticipants = selectedUserIds.length;

  const totalExactSum = selectedUserIds.reduce((sum, id) => {
    return sum + (parseFloat(exactAmounts[id]) || 0);
  }, 0);

  const isExactSumMatching =
    splitType === 'EXACT_AMOUNT' ? Math.abs(totalExactSum - numAmount) < 0.01 : true;

  const exactDiff = totalExactSum - numAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả khoản chi');
      return;
    }
    if (numAmount <= 0) {
      toast.error('Số tiền chi phải lớn hơn 0');
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error('Phải có ít nhất 1 thành viên tham gia chia tiền');
      return;
    }
    if (splitType === 'EXACT_AMOUNT' && !isExactSumMatching) {
      toast.error('Tổng tiền chia cho từng người không khớp với tổng hóa đơn');
      return;
    }

    setIsLoading(true);
    try {
      const splits = selectedUserIds.map((userId) => ({
        userId,
        amountOwed:
          splitType === 'EXACT_AMOUNT' ? parseFloat(exactAmounts[userId]) || 0 : null,
      }));

      const payload = {
        description: description.trim(),
        amount: numAmount,
        isPaidByFund: isLeader ? isPaidByFund : false,
        payerId: isLeader && isPaidByFund ? null : Number(payerId || currentUser?.id),
        splitType,
        splits,
        categoryId: categoryId ? Number(categoryId) : null,
      };

      await expenseApi.updateExpense(expense.id, payload);
      toast.success('Cập nhật khoản chi thành công!');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Cập nhật thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Sửa khoản chi tiêu</h3>
              <p className="text-xs text-indigo-100/80">{expense.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Fund Balance Display */}
          {isLeader && (
            <div className="flex items-center gap-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
              <Wallet className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-slate-700">
                Số dư quỹ chung hiện tại:{' '}
                <strong className="text-indigo-700 text-base">{formatCurrency(fundBalance)}</strong>
              </span>
            </div>
          )}

          {/* Description & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Mô tả khoản chi"
              placeholder="Ví dụ: Tiền phòng KS, Ăn tối..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              icon={FileText}
              required
            />
            <Input
              label="Tổng số tiền (VND)"
              type="text"
              inputMode="numeric"
              placeholder="Ví dụ: 300.000..."
              value={amount ? new Intl.NumberFormat('vi-VN').format(amount) : ''}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
              icon={DollarSign}
              required
            />
          </div>

          {/* Payer Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Người thanh toán (Payer)
              </span>
              {isLeader && (
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPaidByFund}
                    onChange={(e) => {
                      setIsPaidByFund(e.target.checked);
                      if (e.target.checked) setPayerId('');
                      else setPayerId(String(currentUser?.id || ''));
                    }}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" /> Dùng tiền Quỹ chung
                  </span>
                </label>
              )}
            </div>

            {!isPaidByFund ? (
              <div className="relative flex items-center">
                <UserCheck className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={payerId}
                  onChange={(e) => setPayerId(e.target.value)}
                  disabled={!isLeader}
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 pl-11 pr-4 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {currentTrip?.members?.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.fullName} {String(m.userId) === String(currentUser?.id) ? '(Chính bạn)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-3 bg-indigo-50 border border-indigo-200/80 rounded-xl text-xs font-semibold text-indigo-800 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-indigo-600" />
                Khoản chi này sẽ được trừ trực tiếp từ số dư Quỹ chung của nhóm.
              </div>
            )}
          </div>

          {/* Category Selector */}
          {categories.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Danh mục chi tiêu
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryId('')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    !categoryId
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-600 hover:border-slate-400'
                  }`}
                >
                  Không phân loại
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(String(cat.id))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      String(categoryId) === String(cat.id)
                        ? 'text-white border-transparent'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400'
                    }`}
                    style={String(categoryId) === String(cat.id) ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Split Type */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">
              Hình thức chia tiền
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setSplitType('EQUAL')}
                className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[40px] ${
                  splitType === 'EQUAL'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Chia đều (EQUAL)
              </button>
              <button
                type="button"
                onClick={() => setSplitType('EXACT_AMOUNT')}
                className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[40px] ${
                  splitType === 'EXACT_AMOUNT'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Chia số tiền cụ thể (EXACT)
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Người tham gia chịu tiền ({selectedUserIds.length}/{currentTrip?.members?.length || 0})
            </span>
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto p-1">
              {currentTrip?.members?.map((m) => {
                const isSelected = selectedUserIds.includes(m.userId);
                const equalShare =
                  splitType === 'EQUAL' && isSelected && numParticipants > 0
                    ? numAmount / numParticipants
                    : 0;

                return (
                  <div
                    key={m.userId}
                    onClick={() => toggleParticipant(m.userId)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/50 border-indigo-200 text-slate-900 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-slate-100'
                        : 'bg-white border-slate-200/80 text-slate-400 opacity-60 dark:bg-slate-800 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <span className="text-sm font-bold">{m.fullName}</span>
                    </div>

                    {isSelected && (
                      <div>
                        {splitType === 'EQUAL' ? (
                          <span className="text-xs font-extrabold text-indigo-600">
                            {formatCurrency(equalShare)}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={exactAmounts[m.userId] ? new Intl.NumberFormat('vi-VN').format(exactAmounts[m.userId]) : ''}
                              onChange={(e) =>
                                handleExactAmountChange(m.userId, e.target.value.replace(/\D/g, ''))
                              }
                              className="w-28 min-h-[36px] px-2 py-1 text-right text-xs font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                            />
                            <span className="text-xs font-bold text-slate-500">đ</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exact Amount Validation Warning */}
          {splitType === 'EXACT_AMOUNT' && numAmount > 0 && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                isExactSumMatching
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {isExactSumMatching
                ? `✅ Tổng tiền chia (${formatCurrency(totalExactSum)}) khớp với hóa đơn!`
                : `⚠️ Tổng tiền chia: ${formatCurrency(totalExactSum)} / Hóa đơn: ${formatCurrency(numAmount)} (Lệch ${formatCurrency(Math.abs(exactDiff))})`}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {t('common.cancel', 'Hủy')}
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={splitType === 'EXACT_AMOUNT' && !isExactSumMatching}
            >
              {t('common.update', 'Cập nhật')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
