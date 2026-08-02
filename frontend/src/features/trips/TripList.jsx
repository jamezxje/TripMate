import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, Plus, KeyRound, Layers, Calendar, ArrowLeft } from 'lucide-react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Alert } from '../../components/Alert';
import { Badge } from '../../components/Badge';
import { CreateTripModal } from './CreateTripModal';
import { JoinTripModal } from './JoinTripModal';
import { TripDetailView } from './TripDetailView';
import { tripApi } from './tripApi';
import { useTripStore } from '../../store/useTripStore';
import { formatDate } from '../../utils/formatters';

export const TripList = () => {
  const { t } = useTranslation();
  const { 
    currentTrip, 
    setCurrentTrip, 
    clearCurrentTrip, 
    trips, 
    setTrips, 
    setIsLoading, 
    isLoading 
  } = useTripStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [error, setError] = useState('');

  const loadAllTrips = useCallback(async () => {
    if (currentTrip) return; // Only fetch list if no trip is selected
    setIsLoading(true);
    setError('');
    try {
      const res = await tripApi.getUserTrips();
      if (res.data) {
        setTrips(res.data);
      }
    } catch (err) {
      console.error('Failed to load trips:', err);
      setError('Không thể tải danh sách chuyến đi.');
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip, setTrips, setIsLoading]);

  useEffect(() => {
    loadAllTrips();
  }, [loadAllTrips]);

  const handleSelectTrip = async (tripId) => {
    setIsLoading(true);
    try {
      const res = await tripApi.getTripDetail(tripId);
      if (res.data) {
        setCurrentTrip(res.data);
      }
    } catch (err) {
      console.error('Failed to load trip details:', err);
      setError('Không thể tải chi tiết chuyến đi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Compass className="w-7 h-7 text-indigo-600" />
            <span>{currentTrip ? currentTrip.name : t('trip.list_title', 'Danh sách Chuyến đi')}</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {currentTrip 
              ? 'Chi tiết chuyến đi hiện tại.' 
              : 'Tạo mới chuyến đi hoặc gia nhập chuyến đi bằng mã mời để bắt đầu quản lý.'}
          </p>
        </div>

        {!currentTrip && (
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
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Main Active Trip Detail or Trip Grid */}
      {currentTrip ? (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Button 
            variant="outline" 
            icon={ArrowLeft} 
            onClick={clearCurrentTrip} 
            className="self-start text-slate-500 hover:text-slate-800 border-slate-200"
          >
            Quay lại danh sách
          </Button>
          <TripDetailView trip={currentTrip} onRefresh={() => handleSelectTrip(currentTrip.id)} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips && trips.length > 0 ? (
            trips.map(trip => (
              <Card 
                key={trip.id} 
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 group"
                onClick={() => handleSelectTrip(trip.id)}
              >
                <div className="p-5 flex flex-col gap-3 h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant={trip.status ? trip.status.toLowerCase() : 'info'}>
                        {t(`trip.status.${trip.status}`, trip.status)}
                      </Badge>
                      <span className="text-xs text-slate-400 font-medium font-mono">
                        #{trip.joinCode}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {trip.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(trip.createdAt)}</span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="text-center py-16 px-4 bg-gradient-to-b from-white to-slate-50">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100 shadow-xs">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có Chuyến đi nào</h3>
                <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
                  {t(
                    'trip.empty',
                    'Bạn chưa tham gia chuyến đi nào. Hãy tạo chuyến đi mới hoặc tham gia bằng mã code!'
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
            </div>
          )}
        </div>
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
