import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { itineraryApi } from './planningApi';
import { toast } from 'react-hot-toast';

export const ItineraryDayModal = ({ isOpen, onClose, dayToEdit = null, nextDayNumber = 1, onSuccess }) => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();

  const [formData, setFormData] = useState({
    dayNumber: nextDayNumber,
    date: '',
    title: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dayToEdit) {
      setFormData({
        dayNumber: dayToEdit.dayNumber || 1,
        date: dayToEdit.date || '',
        title: dayToEdit.title || '',
      });
    } else {
      setFormData({
        dayNumber: nextDayNumber,
        date: '',
        title: '',
      });
    }
  }, [dayToEdit, nextDayNumber, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dayNumber || formData.dayNumber <= 0) {
      toast.error(t('planning.itinerary.day_number_invalid', 'Số thứ tự ngày không hợp lệ'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        dayNumber: Number(formData.dayNumber),
        date: formData.date || null,
        title: formData.title.trim() || null,
      };

      if (dayToEdit) {
        await itineraryApi.updateDay(currentTrip.id, dayToEdit.id, payload);
        toast.success(t('planning.itinerary.update_day_success', 'Cập nhật ngày lịch trình thành công'));
      } else {
        await itineraryApi.createDay(currentTrip.id, payload);
        toast.success(t('planning.itinerary.create_day_success', 'Thêm ngày lịch trình thành công'));
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || t('common.error_occurred', 'Đã có lỗi xảy ra'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-sky-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {dayToEdit 
                  ? t('planning.itinerary.edit_day_title', 'Sửa ngày lịch trình') 
                  : t('planning.itinerary.add_day_title', 'Thêm ngày mới')}
              </h3>
              <p className="text-xs text-sky-100/80">
                {t('planning.itinerary.day_subtitle', 'Thiết lập danh mục ngày trong chuyến đi')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Day Number & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('planning.itinerary.day_number', 'Ngày thứ')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.dayNumber}
                onChange={(e) => setFormData({ ...formData, dayNumber: e.target.value })}
                placeholder="1, 2, 3..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('planning.itinerary.date', 'Ngày cụ thể')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('planning.itinerary.day_name', 'Chủ đề / Tên ngày')}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('planning.itinerary.day_name_placeholder', 'Ví dụ: Khám phá Phố Cổ, Vui chơi VinWonders...')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('common.cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{dayToEdit ? t('common.update', 'Cập nhật') : t('common.save', 'Lưu')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
