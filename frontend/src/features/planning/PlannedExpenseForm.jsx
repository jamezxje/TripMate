import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { usePlanningStore } from '../../store/usePlanningStore';
import { useTripStore } from '../../store/useTripStore';
import { plannedExpenseApi } from './planningApi';
import toast from 'react-hot-toast';

export const PlannedExpenseForm = ({ isOpen, onClose, expenseToEdit, onSuccess }) => {
  const { categories } = usePlanningStore();
  const { currentTrip } = useTripStore();
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: {
      title: '',
      categoryId: '',
      estimatedAmount: '',
      paymentSource: 'FUND',
      responsiblePersonId: '',
      status: 'PENDING',
      notes: '',
      bookingLink: ''
    }
  });

  useEffect(() => {
    if (expenseToEdit) {
      reset({
        title: expenseToEdit.title,
        categoryId: expenseToEdit.category?.id || '',
        estimatedAmount: expenseToEdit.estimatedAmount,
        paymentSource: expenseToEdit.paymentSource,
        responsiblePersonId: expenseToEdit.responsiblePerson?.id || '',
        status: expenseToEdit.status,
        notes: expenseToEdit.notes || '',
        bookingLink: expenseToEdit.bookingLink || ''
      });
    } else {
      reset({
        title: '',
        categoryId: categories[0]?.id || '',
        estimatedAmount: '',
        paymentSource: 'FUND',
        responsiblePersonId: '',
        status: 'PENDING',
        notes: '',
        bookingLink: ''
      });
    }
  }, [expenseToEdit, isOpen, categories, reset]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        categoryId: parseInt(data.categoryId),
        estimatedAmount: parseFloat(data.estimatedAmount),
        responsiblePersonId: data.responsiblePersonId ? parseInt(data.responsiblePersonId) : null
      };

      if (expenseToEdit) {
        await plannedExpenseApi.update(currentTrip.id, expenseToEdit.id, payload);
        toast.success('Cập nhật thành công');
      } else {
        await plannedExpenseApi.create(currentTrip.id, payload);
        toast.success('Tạo dự trù thành công');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Cập nhật khoản dự trù' : 'Thêm khoản dự trù mới'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Tên khoản dự trù (*)"
          placeholder="Ví dụ: Vé máy bay khứ hồi"
          {...register('title', { required: 'Vui lòng nhập tên khoản dự trù' })}
          error={errors.title?.message}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Danh mục (*)
            </label>
            <select
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('categoryId', { required: 'Chọn danh mục' })}
            >
              <option value="">-- Chọn --</option>
              {(categories || []).map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-rose-500">{errors.categoryId.message}</p>}
          </div>
          
          <Input
            label="Số tiền dự trù (*)"
            type="number"
            min="1000"
            step="1000"
            placeholder="VND"
            {...register('estimatedAmount', { 
              required: 'Nhập số tiền',
              min: { value: 1, message: 'Lớn hơn 0' }
            })}
            error={errors.estimatedAmount?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nguồn tiền (*)
            </label>
            <select
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('paymentSource')}
            >
              <option value="FUND">Quỹ chung</option>
              <option value="PERSONAL">Cá nhân tự trả</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Trạng thái
            </label>
            <select
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              {...register('status')}
              disabled={!expenseToEdit} // khi thêm mới luôn là PENDING
            >
              <option value="PENDING">Chưa đặt (Pending)</option>
              <option value="BOOKED">Đã đặt (Booked)</option>
              <option value="CONFIRMED" disabled>Đã xác nhận</option>
              <option value="CANCELLED">Đã hủy (Cancelled)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Người phụ trách
          </label>
          <select
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register('responsiblePersonId')}
          >
            <option value="">-- Bỏ trống --</option>
            {currentTrip?.members?.map(m => (
              <option key={m.user.id} value={m.user.id}>{m.user.fullName}</option>
            ))}
          </select>
        </div>

        <Input
          label="Link đặt chỗ (Booking Link)"
          placeholder="https://..."
          {...register('bookingLink')}
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Ghi chú thêm
          </label>
          <textarea
            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={2}
            {...register('notes')}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {expenseToEdit ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
