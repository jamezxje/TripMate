import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Calendar, User, CheckCircle2, ListTodo, FileText } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { checklistApi } from './planningApi';
import { toast } from 'react-hot-toast';

export const ChecklistItemModal = ({ isOpen, onClose, itemToEdit = null, onSuccess }) => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    status: 'TODO',
    dueDate: '',
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        title: itemToEdit.title || '',
        description: itemToEdit.description || '',
        assigneeId: itemToEdit.assigneeId || '',
        status: itemToEdit.status || 'TODO',
        dueDate: itemToEdit.dueDate || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        assigneeId: '',
        status: 'TODO',
        dueDate: '',
      });
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error(t('planning.checklist.title_required', 'Vui lòng nhập tên công việc'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        assigneeId: formData.assigneeId ? Number(formData.assigneeId) : null,
        status: formData.status,
        dueDate: formData.dueDate || null,
      };

      if (itemToEdit) {
        await checklistApi.update(currentTrip.id, itemToEdit.id, payload);
        toast.success(t('planning.checklist.update_success', 'Cập nhật công việc thành công'));
      } else {
        await checklistApi.create(currentTrip.id, payload);
        toast.success(t('planning.checklist.create_success', 'Tạo công việc thành công'));
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

  const members = currentTrip?.members || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <ListTodo className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {itemToEdit 
                  ? t('planning.checklist.edit_title', 'Sửa công việc') 
                  : t('planning.checklist.add_title', 'Thêm công việc mới')}
              </h3>
              <p className="text-xs text-violet-100/80">
                {t('planning.checklist.subtitle', 'Quản lý danh sách chuẩn bị cho chuyến đi')}
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('planning.checklist.task_name', 'Tên công việc')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('planning.checklist.task_name_placeholder', 'Ví dụ: Đặt vé máy bay, Mua kem chống nắng...')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('planning.checklist.description', 'Mô tả chi tiết')}
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('planning.checklist.description_placeholder', 'Ghi chú cụ thể nếu có...')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
            />
          </div>

          {/* Assignee & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('planning.checklist.assignee', 'Người phụ trách')}
              </label>
              <div className="relative">
                <select
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                >
                  <option value="">-- {t('planning.checklist.unassigned', 'Chưa phân công')} --</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.userFullName} {m.isGuest ? `(${t('common.guest', 'Thành viên ảo')})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t('planning.checklist.status', 'Trạng thái')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              >
                <option value="TODO">⏳ {t('planning.checklist.status_todo', 'Cần làm')}</option>
                <option value="IN_PROGRESS">🔄 {t('planning.checklist.status_in_progress', 'Đang làm')}</option>
                <option value="DONE">✅ {t('planning.checklist.status_done', 'Hoàn thành')}</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t('planning.checklist.due_date', 'Hạn chót (Due date)')}
            </label>
            <div className="relative">
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
            </div>
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
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{itemToEdit ? t('common.update', 'Cập nhật') : t('common.save', 'Lưu')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
