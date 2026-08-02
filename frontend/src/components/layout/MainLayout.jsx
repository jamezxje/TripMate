import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { NavigationTabs } from './NavigationTabs';
import { MobileNavigation } from './MobileNavigation';
import { useTripStore } from '../../store/useTripStore';
import { tripApi } from '../../features/trips/tripApi';

export const MainLayout = () => {
  const { currentTrip, setCurrentTrip } = useTripStore();

  useEffect(() => {
    const initActiveTrip = async () => {
      const activeTripId = localStorage.getItem('activeTripId');
      if (activeTripId && !currentTrip) {
        try {
          const res = await tripApi.getTripDetail(activeTripId);
          if (res.data) {
            setCurrentTrip(res.data);
          }
        } catch (err) {
          console.error("Failed to restore active trip", err);
          localStorage.removeItem('activeTripId');
        }
      }
    };
    initActiveTrip();
  }, [currentTrip, setCurrentTrip]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col font-sans text-slate-900 dark:text-slate-100 pb-16 md:pb-0 transition-colors duration-300">
      <Navbar />
      <NavigationTabs />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <MobileNavigation />
    </div>
  );
};
