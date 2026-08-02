import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Plus, KeyRound, RefreshCw, Layers } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Alert } from '../../components/Alert';
import { CreateTripModal } from './CreateTripModal';
import { JoinTripModal } from './JoinTripModal';
import { TripDetailView } from './TripDetailView';
import { tripApi } from './tripApi';
import { useTripStore } from '../../store/useTripStore';

export const TripList = () => {
  const { t } = useTranslation();
  const { currentTrip, setCurrentTrip, setIsLoading, isLoading } = useTripStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [error, setError] = useState('');

  const loadActiveTrip = useCallback(async () => {
    // If we have a current trip or want to fetch trip #1 as default
    const tripId = currentTrip?.id || 1;
    setIsLoading(true);
    setError('');

    try {
      const res = await tripApi.getTripDetail(tripId);
      if (res.data) {
        setCurrentTrip(res.data);
      }
    } catch (err) {
      // If trip 1 is not found yet, show create options
      console.warn('No active trip loaded:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip?.id, setCurrentTrip, setIsLoading]);

  useEffect(() => {
    loadActiveTrip();
  }, [loadActiveTrip]);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Compass className="w-7 h-7 text-indigo-600" />
            <span>{t('trip.list_title', 'Danh sách Chuyến đi')}</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Tạo mới chuyến đi hoặc gia nhập chuyến đi bằng mã mời để bắt đầu quản lý.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={KeyRound}
            onClick={() => setIsJoinModalOpen(true)}
          >
            {t('trip.join', 'Tham gia bằng mã code')}
          </Button>
          <Button
            icon={Plus}
            onClick={() => setIsCreateModalOpen(true)}
          >
            {t('trip.create', 'Tạo chuyến đi mới')}
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Main Active Trip Detail or Empty Placeholder */}
      {currentTrip ? (
        <TripDetailView trip={currentTrip} onRefresh={loadActiveTrip} />
      ) : (
        <Card className="text-center py-16 px-4 bg-gradient-to-b from-white to-slate-50">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-xs">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa chọn Chuyến đi nào</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            {t(
              'trip.empty',
              'Chưa có chuyến đi nào. Hãy tạo chuyến đi mới hoặc tham gia bằng mã code!'
            )}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" icon={KeyRound} onClick={() => setIsJoinModalOpen(true)}>
              Tham gia bằng code
            </Button>
            <Button icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
              Tạo chuyến đi mới
            </Button>
          </div>
        </Card>
      )}

      {/* Modals */}
      <CreateTripModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <JoinTripModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />
    </div>
  );
};
