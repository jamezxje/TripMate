import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Clock, MapPin, ExternalLink, CheckCircle2, FileText } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { itineraryApi } from './planningApi';
import { toast } from 'react-hot-toast';

export const ItineraryActivityModal = ({ isOpen, onClose, dayId, activityToEdit = null, onSuccess }) => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();

  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    mapsLink: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activityToEdit) {
      setFormData({
        title: activityToEdit.title || '',
        startTime: activityToEdit.startTime || '',
        endTime: activityToEdit.endTime || '',
        location: activityToEdit.location || '',
        mapsLink: activityToEdit.mapsLink || '',
        notes: activityToEdit.notes || '',
      });
    } else {
      setFormData({
        title: '',
        startTime: '',
        endTime: '',
        location: '',
        mapsLink: '',
        notes: '',
      });
    }
  }, [activityToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error(t('planning.itinerary.activity_title_required', 'Vui lòng nhập tên hoạt động'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        location: formData.location.trim() || null,
        mapsLink: formData.mapsLink.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (activityToEdit) {
        await itineraryApi.updateActivity(currentTrip.id, activityToEdit.id, payload);
        toast.success(t('planning.itinerary.update_activity_success', 'Cập nhật hoạt động thành công'));
      } else {
        await itineraryApi.createActivity(currentTrip.id, dayId, payload);
        toast.success(t('planning.itinerary.create_activity_success', 'Thêm hoạt động thành công'));
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
        <div className="relative px-6 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {activityToEdit 
                  ? t('planning.itinerary.edit_activity_title', 'Sửa hoạt động') 
                  : t('planning.itinerary.add_activity_title', 'Thêm hoạt động mới')}
              </h3>
              <p className="text-xs text-teal-100/80">
                {t('planning.itinerary.activity_subtitle', 'Sắp xếp lịch trình chi tiết theo giờ')}
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
          {/* Activity Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('planning.itinerary.activity_title', 'Tên hoạt động')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('planning.itinerary.activity_title_placeholder', 'Ví dụ: Ăn sáng Phở Thìn, Tham quan Lăng Bác...')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('planning.itinerary.start_time', 'Giờ bắt đầu')}
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('planning.itinerary.end_time', 'Giờ kết thúc')}
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('planning.itinerary.location', 'Địa điểm')}
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder={t('planning.itinerary.location_placeholder', 'Ví dụ: 13 Lò Đúc, Hải Bà Trưng...')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Google Maps Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('planning.itinerary.maps_link', 'Liên kết Google Maps')}
            </label>
            <input
              type="url"
              value={formData.mapsLink}
              onChange={(e) => setFormData({ ...formData, mapsLink: e.target.value })}
              placeholder="https://maps.google.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('planning.itinerary.notes', 'Ghi chú')}
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('planning.itinerary.notes_placeholder', 'Lưu ý cần nhớ...')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all resize-none"
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
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{activityToEdit ? t('common.update', 'Cập nhật') : t('common.save', 'Lưu')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
