import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlanningStore } from '../../store/usePlanningStore';
import { useTripStore } from '../../store/useTripStore';
import { useUserStore } from '../../store/useUserStore';
import { plannedExpenseApi } from './planningApi';
import { Card, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, MoreVertical, CheckCircle, Edit, Trash, Filter, Check, Wallet, User as UserIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { PlannedExpenseForm } from './PlannedExpenseForm';

export const PlannedExpenseList = ({ onRefresh }) => {
  const { t } = useTranslation();
  const { plannedExpenses, categories } = usePlanningStore();
  const { currentTrip } = useTripStore();
  const { currentUser } = useUserStore();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const currentMember = currentTrip?.members?.find(m => m.userId === currentUser?.id);
  const isLeader = currentMember?.role === 'LEADER';

  const canEdit = (expense) => {
    return isLeader || expense.createdBy?.id === currentUser?.id;
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khoản dự trù này?')) return;
    try {
      await plannedExpenseApi.delete(currentTrip.id, id);
      toast.success('Đã xóa khoản dự trù');
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleConfirm = async (expense) => {
    // Thường confirm sẽ nhập số tiền thực tế, ta có thể dùng prompt tạm hoặc modal.
    // Ở đây dùng prompt đơn giản.
    const actualStr = window.prompt(`Xác nhận chi tiêu: ${expense.title}\nNhập số tiền thực tế (Mặc định: ${expense.estimatedAmount}):`, expense.estimatedAmount);
    if (actualStr === null) return;
    
    const actualAmount = parseFloat(actualStr);
    if (isNaN(actualAmount) || actualAmount <= 0) {
      toast.error('Số tiền thực tế không hợp lệ');
      return;
    }

    try {
      await plannedExpenseApi.confirm(currentTrip.id, expense.id, actualAmount);
      toast.success('Xác nhận thành công! Đã chuyển thành chi tiêu thực tế.');
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xác nhận');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'warning';
      case 'BOOKED': return 'info';
      case 'CONFIRMED': return 'success';
      case 'CANCELLED': return 'danger';
      default: return 'default';
    }
  };

  const filteredList = (plannedExpenses || []).filter(e => {
    if (filterCategory && e.category?.id?.toString() !== filterCategory) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    return true;
  });

  return (
    <>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="text-sm border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 py-1.5"
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select 
              className="text-sm border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 py-1.5"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chưa đặt</option>
              <option value="BOOKED">Đã đặt</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>
          
          <Button variant="primary" onClick={() => { setEditingExpense(null); setIsFormOpen(true); }} className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-1" /> Thêm khoản dự trù
          </Button>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredList.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Chưa có khoản dự trù nào.
            </div>
          ) : (
            filteredList.map(expense => (
              <div key={expense.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex gap-3 items-start">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-1"
                      style={{ backgroundColor: `${expense.category?.color || '#cbd5e1'}20`, color: expense.category?.color || '#cbd5e1' }}
                    >
                      {expense.category?.icon || '📦'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-100">{expense.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant={getStatusColor(expense.status)} className="text-[10px]">
                          {t(`planning.status.${expense.status}`, expense.status)}
                        </Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          {expense.paymentSource === 'FUND' ? <Wallet className="w-3 h-3 text-emerald-500" /> : <UserIcon className="w-3 h-3 text-indigo-500" />}
                          {t(`planning.payment_source.${expense.paymentSource}`)}
                        </span>
                        {expense.responsiblePerson && (
                          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            Phụ trách: <strong>{expense.responsiblePerson.fullName}</strong>
                          </span>
                        )}
                      </div>
                      {expense.notes && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{expense.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col justify-between sm:items-end gap-2 shrink-0 border-t sm:border-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="font-black text-lg text-slate-800 dark:text-slate-100">{formatCurrency(expense.estimatedAmount)}</p>
                      <p className="text-[10px] text-slate-400">Tạo bởi: {expense.createdBy?.fullName}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      {expense.status !== 'CONFIRMED' && (
                        <>
                          {canEdit(expense) && (
                            <button onClick={() => handleConfirm(expense)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-lg transition-colors" title="Xác nhận chi tiêu">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit(expense) && (
                            <button onClick={() => handleEdit(expense)} className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canEdit(expense) && expense.status === 'PENDING' && (
                            <button onClick={() => handleDelete(expense.id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 rounded-lg transition-colors">
                              <Trash className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {isFormOpen && (
        <PlannedExpenseForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          expenseToEdit={editingExpense} 
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};
