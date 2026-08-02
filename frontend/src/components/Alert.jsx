import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const Alert = ({ type = 'info', title, message, onClose, className = '' }) => {
  const configs = {
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: Info,
      iconColor: 'text-sky-500',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
    },
  };

  const config = configs[type] || configs.info;
  const IconComponent = config.icon;

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${config.bg} ${className}`}>
      <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 text-sm">
        {title && <h4 className="font-bold mb-0.5">{title}</h4>}
        {message && <p className="opacity-90">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:opacity-75 rounded-lg transition-opacity min-h-[32px] min-w-[32px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
