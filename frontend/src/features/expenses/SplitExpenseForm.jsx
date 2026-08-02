import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, FileText, UserCheck, Wallet, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Alert } from '../../components/Alert';
import { expenseApi } from './expenseApi';
import { useUserStore } from '../../store/useUserStore';
import { useTripStore } from '../../store/useTripStore';
import { formatCurrency } from '../../utils/formatters';

export const SplitExpenseForm = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const { currentUser } = useUserStore();
  const { currentTrip } = useTripStore();

  // Find user role in current trip
  const currentMember = currentTrip?.members?.find(
    (m) => String(m.userId) === String(currentUser?.id)
  );
  const isLeader = currentMember?.role === 'LEADER';

  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isPaidByFund, setIsPaidByFund] = useState(false);
  const [payerId, setPayerId] = useState(currentUser?.id || '');
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL or EXACT_AMOUNT

  // Participants selection & amounts
  const [selectedUserIds, setSelectedUserIds] = useState(
    currentTrip?.members?.map((m) => m.userId) || []
  );
  const [exactAmounts, setExactAmounts] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle participant checkbox toggle
  const toggleParticipant = (userId) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length === 1) return; // Must have at least 1 participant
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Handle exact amount input for a user
  const handleExactAmountChange = (userId, val) => {
    setExactAmounts((prev) => ({
      ...prev,
      [userId]: val,
    }));
  };

  // Live calculation for validation
  const numAmount = parseFloat(amount) || 0;
  const numParticipants = selectedUserIds.length;

  const totalExactSum = selectedUserIds.reduce((sum, id) => {
    const val = parseFloat(exactAmounts[id]) || 0;
    return sum + val;
  }, 0);

  const isExactSumMatching =
    splitType === 'EXACT_AMOUNT' ? Math.abs(totalExactSum - numAmount) < 0.01 : true;

  const exactDiff = totalExactSum - numAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Vui lòng nhập mô tả khoản chi');
      return;
    }
    if (numAmount <= 0) {
      setError('Số tiền chi phải lớn hơn 0');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Phải có ít nhất 1 thành viên tham gia chia tiền');
      return;
    }
    if (splitType === 'EXACT_AMOUNT' && !isExactSumMatching) {
      setError('Tổng tiền chia cho từng người không khớp với tổng hóa đơn');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const splits = selectedUserIds.map((userId) => ({
        userId,
        amountOwed:
          splitType === 'EXACT_AMOUNT'
            ? parseFloat(exactAmounts[userId]) || 0
            : null,
      }));

      const payload = {
        tripId: currentTrip.id,
        description: description.trim(),
        amount: numAmount,
        isPaidByFund: isLeader ? isPaidByFund : false,
        payerId: isLeader && isPaidByFund ? null : Number(payerId),
        splitType,
        splits,
      };

      await expenseApi.createExpense(payload);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Tạo khoản chi thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

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
          type="number"
          placeholder="Ví dụ: 300000..."
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          icon={DollarSign}
          step="1000"
          min="1000"
          required
        />
      </div>

      {/* Payer Authorization Section */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Người thanh toán (Payer)
          </span>

          {/* Fund Toggle (Only Leader can enable) */}
          {isLeader && (
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPaidByFund}
                onChange={(e) => {
                  setIsPaidByFund(e.target.checked);
                  if (e.target.checked) setPayerId('');
                  else setPayerId(currentUser?.id || '');
                }}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> Dùng tiền Quỹ chung
              </span>
            </label>
          )}
        </div>

        {/* Payer Select Dropdown */}
        {!isPaidByFund ? (
          <div className="relative flex items-center">
            <UserCheck className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              disabled={!isLeader}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {currentTrip?.members?.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName} {m.userId === currentUser?.id ? '(Chính bạn)' : ''}
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

      {/* Split Type Tabs */}
      <div>
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">
          Hình thức chia tiền
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setSplitType('EQUAL')}
            className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[40px] ${
              splitType === 'EQUAL'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chia đều (EQUAL)
          </button>
          <button
            type="button"
            onClick={() => setSplitType('EXACT_AMOUNT')}
            className={`py-2 text-xs font-bold rounded-lg transition-all min-h-[40px] ${
              splitType === 'EXACT_AMOUNT'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chia số tiền cụ thể (EXACT)
          </button>
        </div>
      </div>

      {/* Participants & Live Calculation */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
                    ? 'bg-indigo-50/50 border-indigo-200 text-slate-900'
                    : 'bg-white border-slate-200/80 text-slate-400 opacity-60'
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

                {/* Display calculated share or input */}
                {isSelected && (
                  <div>
                    {splitType === 'EQUAL' ? (
                      <span className="text-xs font-extrabold text-indigo-600">
                        {formatCurrency(equalShare)}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          placeholder="0"
                          value={exactAmounts[m.userId] || ''}
                          onChange={(e) => handleExactAmountChange(m.userId, e.target.value)}
                          className="w-28 min-h-[36px] px-2 py-1 text-right text-xs font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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

      {/* Live Warning for EXACT_AMOUNT mismatch */}
      {splitType === 'EXACT_AMOUNT' && numAmount > 0 && (
        <div>
          {!isExactSumMatching ? (
            <Alert
              type="warning"
              title="Tổng tiền chia không khớp với hóa đơn!"
              message={`Tổng tiền đã chia: ${formatCurrency(totalExactSum)} / Hóa đơn: ${formatCurrency(
                numAmount
              )} (Lệch ${formatCurrency(Math.abs(exactDiff))})`}
            />
          ) : (
            <Alert
              type="success"
              message={`Tổng tiền chia (${formatCurrency(totalExactSum)}) đã khớp hoàn toàn với hóa đơn!`}
            />
          )}
        </div>
      )}

      {/* Submit / Cancel Buttons */}
      <div className="flex justify-end gap-3 mt-2">
        <Button variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel', 'Hủy')}
        </Button>
        <Button
          type="submit"
          isLoading={isLoading}
          disabled={splitType === 'EXACT_AMOUNT' && !isExactSumMatching}
        >
          {t('common.save', 'Lưu khoản chi')}
        </Button>
      </div>
    </form>
  );
};
