import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { NavigationTabs } from './NavigationTabs';
import { MobileNavigation } from './MobileNavigation';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-16 md:pb-0">
      <Navbar />
      <NavigationTabs />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <MobileNavigation />
    </div>
  );
};
