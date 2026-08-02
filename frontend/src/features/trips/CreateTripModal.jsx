import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { toast } from 'react-hot-toast';
import { tripApi } from './tripApi';
import { useTripStore } from '../../store/useTripStore';

export const CreateTripModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { setCurrentTrip } = useTripStore();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tên chuyến đi không được để trống');
      return;
    }

    setIsLoading(true);

    try {
      const res = await tripApi.createTrip(name.trim());
      if (res.data) {
        toast.success('Tạo chuyến đi thành công!');
        setCurrentTrip(res.data);
        setName('');
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Tạo chuyến đi thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('trip.create', 'Tạo chuyến đi mới')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <Input
          label="Tên chuyến đi"
          placeholder="Ví dụ: Du lịch Đà Nẵng 4N3Đ..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={Compass}
          required
          autoFocus
        />

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t('common.cancel', 'Hủy')}
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {t('common.save', 'Tạo ngay')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
