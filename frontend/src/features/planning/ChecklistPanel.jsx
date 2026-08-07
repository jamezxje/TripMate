import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckSquare, Plus, Filter, UserCheck, Calendar, 
  CheckCircle2, Clock, AlertCircle, Edit2, Trash2, Check,
  ListTodo
} from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { useUserStore } from '../../store/useUserStore';
import { usePlanningStore } from '../../store/usePlanningStore';
import { checklistApi } from './planningApi';
import { ChecklistItemModal } from './ChecklistItemModal';
import { toast } from 'react-hot-toast';

export const ChecklistPanel = ({ onRefresh }) => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  const { currentUser } = useUserStore();
  const { checklistSummary, checklistItems, updateChecklistItemInStore, removeChecklistItem } = usePlanningStore();

  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, TODO, IN_PROGRESS, DONE
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const handleToggleStatus = async (item) => {
    if (!currentTrip?.id) return;
    const newStatus = item.status === 'DONE' ? 'TODO' : 'DONE';
    
    // Optimistic update
    const updated = { ...item, status: newStatus };
    updateChecklistItemInStore(updated);

    try {
      await checklistApi.updateStatus(currentTrip.id, item.id, newStatus);
      toast.success(
        newStatus === 'DONE' 
          ? t('planning.checklist.marked_done', 'Đã hoàn thành công việc')
          : t('planning.checklist.marked_todo', 'Đã mở lại công việc')
      );
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(t('common.error_occurred', 'Đã có lỗi xảy ra'));
      // Rollback
      updateChecklistItemInStore(item);
    }
  };

  const handleDelete = async (itemId) => {
    if (!currentTrip?.id) return;
    if (!window.confirm(t('planning.checklist.confirm_delete', 'Bạn có chắc chắn muốn xóa công việc này?'))) return;

    try {
      await checklistApi.delete(currentTrip.id, itemId);
      removeChecklistItem(itemId);
      toast.success(t('planning.checklist.delete_success', 'Đã xóa công việc'));
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(t('common.error_occurred', 'Không thể xóa công việc'));
    }
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Filter items
  const filteredItems = checklistItems.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) {
      return false;
    }
    if (onlyMyTasks && currentUser?.id && item.assigneeId !== currentUser.id) {
      return false;
    }
    return true;
  });

  const totalCount = checklistSummary?.totalItems || checklistItems.length;
  const completedCount = checklistSummary?.completedItems || checklistItems.filter(i => i.status === 'DONE').length;
  const percentage = checklistSummary?.completionPercentage ?? (totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === 'DONE') return false;
    const today = new Date().toISOString().split('T')[0];
    return dueDate < today;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 space-y-6">
      {/* Header & Overall Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-violet-500/25">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t('planning.checklist.title', 'Danh sách Việc cần làm')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {completedCount}/{totalCount} {t('planning.checklist.items_completed', 'việc đã xong')} ({percentage}%)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium text-sm shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('planning.checklist.add_button', 'Thêm công việc')}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
          <span>{t('planning.checklist.progress', 'Tiến độ hoàn thành')}</span>
          <span className="text-violet-600 dark:text-violet-400 font-bold">{percentage}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Status Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl">
          {[
            { key: 'ALL', label: t('common.all', 'Tất cả') },
            { key: 'TODO', label: t('planning.checklist.status_todo', 'Cần làm') },
            { key: 'IN_PROGRESS', label: t('planning.checklist.status_in_progress', 'Đang làm') },
            { key: 'DONE', label: t('planning.checklist.status_done', 'Đã xong') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.key
                  ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* My Tasks Toggle */}
        <button
          onClick={() => setOnlyMyTasks(!onlyMyTasks)}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
            onlyMyTasks
              ? 'bg-violet-50 dark:bg-violet-950/40 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>{t('planning.checklist.my_tasks', 'Việc của tôi')}</span>
        </button>
      </div>

      {/* Checklist Item List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-500 space-y-2 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
            <ListTodo className="w-10 h-10 stroke-[1.5]" />
            <p className="text-sm font-medium">
              {t('planning.checklist.empty_list', 'Chưa có công việc nào trong danh sách')}
            </p>
            <p className="text-xs text-slate-400">
              {t('planning.checklist.empty_hint', 'Bấm nút "Thêm công việc" để tạo mới.')}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const overdue = isOverdue(item.dueDate, item.status);
            return (
              <div
                key={item.id}
                className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
                  item.status === 'DONE'
                    ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-75'
                    : overdue
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700 hover:shadow-md hover:border-violet-200'
                }`}
              >
                {/* Checkbox & Title Info */}
                <div className="flex items-start space-x-3 flex-1 min-w-0 pr-3">
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                      item.status === 'DONE'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-violet-500 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {item.status === 'DONE' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span
                        className={`text-sm font-semibold transition-all ${
                          item.status === 'DONE'
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {item.title}
                      </span>

                      {/* Status Badge */}
                      {item.status === 'IN_PROGRESS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                          <Clock className="w-3 h-3 mr-1" /> {t('planning.checklist.status_in_progress', 'Đang làm')}
                        </span>
                      )}
                      {item.status === 'TODO' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          ⏳ {t('planning.checklist.status_todo', 'Cần làm')}
                        </span>
                      )}
                      {item.status === 'DONE' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                          ✅ {t('planning.checklist.status_done', 'Đã xong')}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Assignee & Due Date Tags */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 flex-shrink-0">
                  <div className="flex items-center space-x-2 text-xs">
                    {/* Assignee */}
                    {item.assigneeName ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium">
                        <UserCheck className="w-3.5 h-3.5 mr-1" />
                        {item.assigneeName}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">
                        {t('planning.checklist.unassigned', 'Chưa phân công')}
                      </span>
                    )}

                    {/* Due Date */}
                    {item.dueDate && (
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-xl font-medium ${
                          overdue
                            ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {item.dueDate}
                        {overdue && <AlertCircle className="w-3.5 h-3.5 ml-1 text-rose-500" />}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-slate-700 transition-colors"
                      title={t('common.edit', 'Sửa')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                      title={t('common.delete', 'Xóa')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <ChecklistItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itemToEdit={editingItem}
        onSuccess={onRefresh}
      />
    </div>
  );
};
