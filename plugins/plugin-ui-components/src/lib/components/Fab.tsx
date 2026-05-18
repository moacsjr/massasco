import React from 'react';

export interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Fab: React.FC<FabProps> = ({ className = '', children, ...props }) => {
  return (
    <button
      {...props}
      className={`
        fixed bottom-20 md:bottom-6 right-6
        w-14 h-14 rounded-full border-none
        bg-brand text-black
        text-[28px] font-bold
        cursor-pointer
        shadow-lg shadow-brand/30
        flex items-center justify-center
        z-sticky
        hover:bg-yellow-400 transition-colors
        ${className}
      `}
    >
      {children}
    </button>
  );
};
