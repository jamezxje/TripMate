import React, { useEffect } from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { useThemeStore } from './store/useThemeStore';
import { Toaster } from 'react-hot-toast';

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#fff',
          color: '#334155',
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          padding: '16px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }} />
      <AppRoutes />
    </>
  );
}

export default App;
