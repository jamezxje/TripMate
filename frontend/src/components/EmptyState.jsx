import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = '',
  children
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col items-center justify-center p-8 text-center bg-white/50 border border-slate-200/50 rounded-3xl border-dashed ${className}`}
    >
      <div className="w-20 h-20 mb-4 rounded-full bg-slate-100/80 flex items-center justify-center text-slate-400">
        {Icon && <Icon className="w-10 h-10" strokeWidth={1.5} />}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
      
      {children ? (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {children}
        </div>
      ) : actionLabel && onAction ? (
        <Button onClick={onAction} icon={Icon} className="px-6 rounded-full shadow-md">
          {actionLabel}
        </Button>
      ) : null}
    </motion.div>
  );
};
