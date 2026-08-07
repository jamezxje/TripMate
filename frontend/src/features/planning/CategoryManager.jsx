import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardBody } from '../../components/Card';
import { Button } from '../../components/Button';
import { usePlanningStore } from '../../store/usePlanningStore';
import { useUserStore } from '../../store/useUserStore';
import { useTripStore } from '../../store/useTripStore';
import { categoryApi } from './planningApi';
import { Tags, Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const CategoryManager = ({ onRefresh }) => {
  const { t } = useTranslation();
  const { categories } = usePlanningStore();
  const { currentUser } = useUserStore();
  const { currentTrip } = useTripStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', icon: '📌', color: '#6366F1' });

  // Only leader can manage categories? In this app, trip member roles determine this. 
  // Let's assume currentUser is Leader if they created the trip or if trip.members says so.
  const currentMember = currentTrip?.members?.find(m => m.userId === currentUser?.id);
  const isLeader = currentMember?.role === 'LEADER';
  
  window.CATEGORY_MANAGER_IS_LEADER = isLeader;
  
  if (!isLeader) return null;

  const resetForm = () => {
    setFormData({ name: '', icon: '📌', color: '#6366F1' });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }
    
    try {
      if (editingId) {
        await categoryApi.update(editingId, formData);
        toast.success('Đã cập nhật danh mục');
      } else {
        await categoryApi.create({ ...formData, tripId: currentTrip.id });
        toast.success('Đã thêm danh mục mới');
      }
      resetForm();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await categoryApi.delete(id);
      toast.success('Đã xóa danh mục');
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa danh mục đang sử dụng');
    }
  };

  const startEdit = (cat) => {
    setFormData({ name: cat.name, icon: cat.icon || '📌', color: cat.color || '#6366F1' });
    setEditingId(cat.id);
    setIsAdding(true);
  };

  return (
    <Card>
      <div className="flex justify-between items-center py-3 px-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider text-slate-500">
          <Tags className="w-4 h-4" />
          {t('planning.manage_categories', 'Danh mục')}
        </h3>
        {isLeader && !isAdding && (
          <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)} className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
            <Plus className="w-4 h-4 mr-1" /> Thêm
          </Button>
        )}
      </div>
      
      <CardBody className="p-0">
        {isAdding && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800/50 flex gap-2 items-start flex-col">
            <div className="flex gap-2 w-full">
              <input
                type="text"
                className="w-10 h-9 rounded-lg border-slate-200 dark:border-slate-700 text-center bg-white dark:bg-slate-800"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🍕"
                maxLength={2}
              />
              <input
                type="text"
                className="flex-1 h-9 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Tên danh mục..."
              />
              <input
                type="color"
                className="w-10 h-9 p-1 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 w-full mt-2">
              <Button variant="ghost" size="sm" onClick={resetForm}>Hủy</Button>
              <Button variant="primary" size="sm" onClick={handleSave}>Lưu</Button>
            </div>
          </div>
        )}
        
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {(categories || []).map(cat => (
            <li key={cat.id} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <span 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium"
                  style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                >
                  {cat.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold">{cat.name}</p>
                  {cat.isDefault && (
                    <span className="text-[10px] uppercase font-bold text-slate-400">Mặc định</span>
                  )}
                </div>
              </div>
              
              {isLeader && !cat.isDefault && (
                <div className="flex gap-1">
                  <button onClick={() => startEdit(cat)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
};
