import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, UserCheck } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Alert } from '../../components/Alert';
import { fundApi } from './fundApi';
import { useTripStore } from '../../store/useTripStore';

export const FundContributionModal = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();

  const [selectedUserId, setSelectedUserId] = useState(
    currentTrip?.members?.[0]?.userId || ''
  );
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentTrip?.id) {
      setError('Chưa chọn chuyến đi');
      return;
    }
    if (!selectedUserId) {
      setError('Vui lòng chọn người đóng quỹ');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Số tiền đóng quỹ phải lớn hơn 0');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await fundApi.contributeToFund(
        currentTrip.id,
        Number(selectedUserId),
        parseFloat(amount)
      );
      setAmount('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Ghi nhận đóng quỹ thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đóng tiền Quỹ chung">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* User select */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Thành viên đóng quỹ
          </label>
          <div className="relative flex items-center">
            <UserCheck className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
              required
            >
              {currentTrip?.members?.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.fullName} ({m.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount */}
        <Input
          label="Số tiền đóng quỹ (VND)"
          type="text"
          inputMode="numeric"
          placeholder="Ví dụ: 500.000..."
          value={amount ? new Intl.NumberFormat('vi-VN').format(amount) : ''}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          icon={DollarSign}
          required
        />

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('common.cancel', 'Hủy')}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Ghi nhận
          </Button>
        </div>
      </form>
    </Modal>
  );
};
