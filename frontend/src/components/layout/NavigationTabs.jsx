import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Wallet, Receipt, Calculator } from 'lucide-react';

export const NavigationTabs = () => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('nav.trips', 'Chuyến đi'), icon: Compass },
    { path: '/funds', label: t('nav.fund', 'Quỹ nhóm'), icon: Wallet },
    { path: '/expenses', label: t('nav.expenses', 'Chi tiêu'), icon: Receipt },
    { path: '/settlement', label: t('nav.settlement', 'Quyết toán'), icon: Calculator },
  ];

  return (
    <div className="hidden md:block bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          <nav className="inline-flex p-1 space-x-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-2xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
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
        </div>
      </div>
    </div>
  );
};
