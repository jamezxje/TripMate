import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, LogOut, Globe, ChevronDown, User, Settings, Moon, Sun } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useThemeStore } from '../../store/useThemeStore';

export const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, logout } = useUserStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-700/60">
              <img src="/logo.png" alt="TripMate Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-xl font-black bg-gradient-to-r from-violet-600 to-indigo-700 bg-clip-text text-transparent tracking-tight">
                TripMate
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase tracking-widest">
                BETA
              </span>
            </div>
          </div>

          {/* Right Actions: i18n, User Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-2xl transition-all duration-200"
              title="Change Language"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{i18n.language || 'VI'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-2xl transition-all duration-200"
              title="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Current User Profile Dropdown */}
            {currentUser && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full hover:bg-slate-100/80 border border-transparent hover:border-slate-200 transition-all duration-200"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-100 to-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {/* Online Badge */}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-bold text-slate-700 leading-none max-w-[120px] truncate">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 mt-1">
                      {currentUser.role === 'LEADER' ? 'Nhóm trưởng' : 'Thành viên'}
                    </span>
                  </div>
                  <ChevronDown className={`hidden md:block w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-soft border border-slate-100 p-2 py-2 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 mb-2 border-b border-slate-50 md:hidden">
                      <p className="text-sm font-bold text-slate-800">{currentUser.fullName}</p>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                    </div>
                    
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors">
                      <User className="w-4 h-4" />
                      Tài khoản của tôi
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors mb-1">
                      <Settings className="w-4 h-4" />
                      Cài đặt
                    </button>
                    
                    <div className="h-px bg-slate-100 my-1"></div>
                    
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
