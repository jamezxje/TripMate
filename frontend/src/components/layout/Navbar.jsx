import React from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, LogOut, Globe } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { Badge } from '../Badge';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, logout } = useUserStore();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };


  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Compass className="w-6 h-6 animate-pulse-slow" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight">
                TripMate
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                v1.0
              </span>
            </div>
          </div>

          {/* Right Actions: User info, Role switch, i18n, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
              title="Change Language"
            >
              <Globe className="w-4 h-4 text-slate-500" />
              <span className="uppercase">{i18n.language || 'VI'}</span>
            </button>

            {/* Current User */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                  {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                </div>
                <span className="hidden md:inline-block text-sm font-semibold text-slate-700 max-w-[120px] truncate">
                  {currentUser.fullName}
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
