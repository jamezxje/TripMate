import React from 'react';

export const Skeleton = ({ className = '', variant = 'rectangular', animation = 'pulse', ...props }) => {
  const baseClasses = 'bg-slate-200/80';
  const animationClasses = animation === 'pulse' ? 'animate-pulse' : animation === 'wave' ? 'animate-[wave_2s_linear_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent bg-[length:200%_100%]' : '';
  
  const variants = {
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md',
  };

  return (
    <div 
      className={`${baseClasses} ${animationClasses} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
        />
      ))}
    </div>
  );
};
