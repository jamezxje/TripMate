import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { tripApi } from './tripApi';
import { toast } from 'react-hot-toast';

export const GuestMemberModal = ({ isOpen, onClose, tripId, onMemberAdded }) => {
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Vui lòng nhập tên thành viên');
      return;
    }

    setIsLoading(true);
    try {
      await tripApi.addGuest(tripId, fullName.trim());
      toast.success('Đã thêm thành viên ảo thành công!');
      setFullName('');
      onMemberAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm thành viên ảo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Thêm Thành Viên Ảo
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Thành viên ảo (Guest) giúp bạn dễ dàng ghi nhận chi tiêu và chia tiền cho những người đi cùng nhưng không sử dụng ứng dụng. 
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Tên thành viên"
              placeholder="VD: Bạn của Trưởng nhóm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
            
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Hủy
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Thêm ngay
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
