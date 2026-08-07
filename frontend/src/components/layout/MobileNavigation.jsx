import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Wallet, Receipt, Calculator } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';

export const MobileNavigation = () => {
  const { t } = useTranslation();
  const { currentTrip } = useTripStore();

  if (!currentTrip) {
    return null;
  }

  const navItems = [
    { path: '/', label: t('nav.trips', 'Tổng quan'), icon: Compass },
    { path: '/funds', label: t('nav.fund', 'Quỹ nhóm'), icon: Wallet },
    { path: '/expenses', label: t('nav.expenses', 'Chi tiêu'), icon: Receipt },
    { path: '/planning', label: t('nav.planning', 'Kế hoạch'), icon: Compass },
    { path: '/settlement', label: t('nav.settlement', 'Quyết toán'), icon: Calculator },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 z-50 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors duration-300">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-bold transition-all duration-300 min-h-[44px] ${
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute top-0 w-8 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-b-full shadow-[0_2px_8px_rgba(79,70,229,0.4)] animate-fade-in"></div>
                  )}
                  <Icon className={`w-5 h-5 mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

