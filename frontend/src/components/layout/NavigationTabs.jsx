import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Calendar, Wallet, Receipt, Calculator, RefreshCw } from 'lucide-react';
import { useTripStore } from '../../store/useTripStore';

export const NavigationTabs = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTrip, clearCurrentTrip } = useTripStore();

  // Hide navigation tabs completely when no trip is selected
  if (!currentTrip) {
    return null;
  }

  const navItems = [
    { path: '/', label: t('nav.trips', 'Chuyến đi'), icon: Compass },
    { path: '/planning', label: t('nav.planning', 'Kế hoạch'), icon: Calendar },
    { path: '/funds', label: t('nav.fund', 'Quỹ chung'), icon: Wallet },
    { path: '/expenses', label: t('nav.expenses', 'Chi tiêu'), icon: Receipt },
    { path: '/settlement', label: t('nav.settlement', 'Quyết toán'), icon: Calculator },
  ];

  const handleSwitchTrip = () => {
    clearCurrentTrip();
    navigate('/');
  };

  return (
    <div className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex items-center justify-between">
          <nav className="inline-flex p-1 space-x-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 min-h-[40px] relative ${
                      isActive
                        ? 'text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-700 shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-600/50'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Active Trip Info & Switch Trip Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 px-3.5 py-1.5 rounded-2xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {currentTrip.name}
              </span>
            </div>

            <button
              onClick={handleSwitchTrip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-all border border-slate-200/60 dark:border-slate-700/60"
              title="Đổi sang chuyến đi khác"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t('trip.switch', 'Đổi chuyến đi')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

