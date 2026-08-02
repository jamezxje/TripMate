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
    <div className="hidden md:block bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
  );
};
