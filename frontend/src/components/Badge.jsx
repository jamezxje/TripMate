import React from 'react';

export const Badge = ({ children, variant = 'info', size = 'md', className = '' }) => {
  const baseStyles = 'inline-flex items-center gap-1.5 font-semibold rounded-full select-none';

  const variants = {
    planning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    ongoing: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    settled: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    closed: 'bg-slate-100 text-slate-600 border border-slate-200/60',
    leader: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    member: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    positive: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    negative: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/60',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3.5 py-1.5 text-sm',
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant] || variants.info} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
};
