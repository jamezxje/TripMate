import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, Clock, MapPin, ExternalLink, Plus, Edit2, Trash2, 
  Compass, Navigation, ChevronRight
} from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';
import { usePlanningStore } from '../../store/usePlanningStore';
import { itineraryApi } from './planningApi';
import { ItineraryDayModal } from './ItineraryDayModal';
import { ItineraryActivityModal } from './ItineraryActivityModal';
import { toast } from 'react-hot-toast';

export const ItineraryPanel = ({ onRefresh }) => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();
  const { itineraryDays } = usePlanningStore();

  const [selectedDayId, setSelectedDayId] = useState(null);
  
  // Modals state
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [editingDay, setEditingDay] = useState(null);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);

  // Default active day to the first day if not selected
  useEffect(() => {
    if (itineraryDays && itineraryDays.length > 0) {
      if (!selectedDayId || !itineraryDays.some(d => d.id === selectedDayId)) {
        setSelectedDayId(itineraryDays[0].id);
      }
    } else {
      setSelectedDayId(null);
    }
  }, [itineraryDays]);

  const activeDay = itineraryDays.find(d => d.id === selectedDayId) || itineraryDays[0];

  const handleDeleteDay = async (dayId) => {
    if (!currentTrip?.id) return;
    if (!window.confirm(t('planning.itinerary.confirm_delete_day', 'Bạn có chắc chắn muốn xóa ngày này và toàn bộ hoạt động trong ngày?'))) return;

    try {
      await itineraryApi.deleteDay(currentTrip.id, dayId);
      toast.success(t('planning.itinerary.delete_day_success', 'Đã xóa ngày lịch trình'));
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(t('common.error_occurred', 'Không thể xóa ngày lịch trình'));
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!currentTrip?.id) return;
    if (!window.confirm(t('planning.itinerary.confirm_delete_activity', 'Bạn có chắc chắn muốn xóa hoạt động này?'))) return;

    try {
      await itineraryApi.deleteActivity(currentTrip.id, activityId);
      toast.success(t('planning.itinerary.delete_activity_success', 'Đã xóa hoạt động'));
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error(t('common.error_occurred', 'Không thể xóa hoạt động'));
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // HH:mm
  };

  const nextDayNumber = itineraryDays ? itineraryDays.length + 1 : 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-sky-600 to-indigo-600 rounded-2xl text-white shadow-lg shadow-sky-500/25">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t('planning.itinerary.title', 'Lịch trình Chuyến đi')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('planning.itinerary.subtitle', 'Sắp xếp thời gian, địa điểm và hoạt động cho từng ngày')}
            </p>
          </div>
        </div>

        <button
          onClick={() => { setEditingDay(null); setIsDayModalOpen(true); }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-medium text-sm shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('planning.itinerary.add_day', 'Thêm ngày mới')}</span>
        </button>
      </div>

      {/* Days Navigation Tabs */}
      {itineraryDays && itineraryDays.length > 0 ? (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100 dark:border-slate-800">
          {itineraryDays.map((day) => {
            const isActive = day.id === selectedDayId;
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayId(day.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/25 scale-[1.02]'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{t('planning.itinerary.day', 'Ngày')} {day.dayNumber}</span>
                {day.title && <span className="opacity-80 font-normal">({day.title})</span>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 dark:text-slate-500 space-y-2 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
          <Navigation className="w-10 h-10 stroke-[1.5]" />
          <p className="text-sm font-medium">
            {t('planning.itinerary.empty_days', 'Chưa có ngày nào trong lịch trình')}
          </p>
          <p className="text-xs text-slate-400">
            {t('planning.itinerary.empty_days_hint', 'Hãy bấm "Thêm ngày mới" để bắt đầu lên lịch trình cho chuyến đi.')}
          </p>
        </div>
      )}

      {/* Active Day Content */}
      {activeDay && (
        <div className="space-y-6">
          {/* Active Day Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-sky-50/60 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700/80 gap-3">
            <div className="flex items-center space-x-3">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-sky-600 text-white font-bold text-sm">
                D{activeDay.dayNumber}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {t('planning.itinerary.day', 'Ngày')} {activeDay.dayNumber}
                  {activeDay.title ? `: ${activeDay.title}` : ''}
                </h3>
                {activeDay.date && (
                  <p className="text-xs text-sky-700 dark:text-sky-400 font-medium">
                    🗓️ {activeDay.date}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => { setEditingActivity(null); setIsActivityModalOpen(true); }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('planning.itinerary.add_activity', 'Thêm hoạt động')}</span>
              </button>
              <button
                onClick={() => { setEditingDay(activeDay); setIsDayModalOpen(true); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-slate-700 transition-colors"
                title={t('common.edit', 'Sửa')}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteDay(activeDay.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-slate-700 transition-colors"
                title={t('common.delete', 'Xóa')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Timeline View of Activities */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {activeDay.activities && activeDay.activities.length > 0 ? (
              activeDay.activities.map((act) => (
                <div key={act.id} className="relative group">
                  {/* Timeline Bullet Node */}
                  <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-sky-500 group-hover:border-teal-500 group-hover:scale-125 transition-all flex items-center justify-center shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-sky-500 group-hover:bg-teal-500" />
                  </div>

                  {/* Activity Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-700 transition-all hover:shadow-md space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        {/* Time Range */}
                        {(act.startTime || act.endTime) && (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(act.startTime)}
                            {act.endTime ? ` - ${formatTime(act.endTime)}` : ''}
                          </div>
                        )}

                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {act.title}
                        </h4>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingActivity(act); setIsActivityModalOpen(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(act.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Location & Maps Link */}
                    {act.location && (
                      <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                        <span className="font-medium">{act.location}</span>
                        {act.mapsLink && (
                          <a
                            href={act.mapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline ml-1"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </a>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {act.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        {act.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                {t('planning.itinerary.empty_activities', 'Chưa có hoạt động nào trong ngày này. Bấm "Thêm hoạt động" để lên lịch.')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <ItineraryDayModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        dayToEdit={editingDay}
        nextDayNumber={nextDayNumber}
        onSuccess={onRefresh}
      />

      <ItineraryActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        dayId={activeDay?.id}
        activityToEdit={editingActivity}
        onSuccess={onRefresh}
      />
    </div>
  );
};
