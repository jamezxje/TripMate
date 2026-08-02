import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Alert } from '../../components/Alert';
import { tripApi } from './tripApi';
import { useTripStore } from '../../store/useTripStore';

export const JoinTripModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { setCurrentTrip } = useTripStore();
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setError('Vui lòng nhập mã tham gia');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await tripApi.joinTrip(joinCode.trim());
      if (res.data) {
        setCurrentTrip(res.data);
        setJoinCode('');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Mã tham gia không hợp lệ hoặc chuyến đi không tồn tại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('trip.join', 'Tham gia bằng mã code')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        <Input
          label="Mã mời chuyến đi (Join Code)"
          placeholder="Nhập mã 6 ký tự (ví dụ: ABC123)..."
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          icon={KeyRound}
          required
          autoFocus
        />

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('common.cancel', 'Hủy')}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {t('common.confirm', 'Gia nhập')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
