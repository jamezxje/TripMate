import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Compass, Wallet, Receipt, Calculator } from 'lucide-react';

export const MobileNavigation = () => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/', label: t('nav.trips', 'Chuyến đi'), icon: Compass },
    { path: '/funds', label: t('nav.fund', 'Quỹ nhóm'), icon: Wallet },
    { path: '/expenses', label: t('nav.expenses', 'Chi tiêu'), icon: Receipt },
    { path: '/settlement', label: t('nav.settlement', 'Quyết toán'), icon: Calculator },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-lg px-2 py-1">
      <nav className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-semibold transition-colors min-h-[44px] ${
                  isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
