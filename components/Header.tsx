import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  onPrev?: () => void;
  onNext?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle, leftAction, rightAction, onPrev, onNext }) => {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-500 pt-12 pb-12 px-4 rounded-b-[2.5rem] shadow-lg text-white relative z-10 select-none">
      <div className="flex items-center justify-between mb-2">
         {leftAction ? (
           <div className="w-12 flex justify-start">{leftAction}</div>
         ) : (
           <div className="w-12"></div>
         )}
         
         <div className="flex items-center gap-4">
            {onPrev && (
              <button 
                onClick={onPrev} 
                className="p-2 rounded-full hover:bg-white/20 active:bg-white/30 active:scale-90 transition-all"
                aria-label="上一月"
              >
                <ChevronLeft size={32} strokeWidth={3} />
              </button>
            )}
            <h1 className="text-3xl font-black tracking-tight drop-shadow-md">{title}</h1>
            {onNext && (
              <button 
                onClick={onNext} 
                className="p-2 rounded-full hover:bg-white/20 active:bg-white/30 active:scale-90 transition-all"
                aria-label="下一月"
              >
                <ChevronRight size={32} strokeWidth={3} />
              </button>
            )}
         </div>

         {rightAction ? (
            <div className="w-12 flex justify-end">{rightAction}</div>
         ) : (
            <div className="w-12"></div>
         )}
      </div>
      {subtitle && <p className="text-blue-100 text-lg font-medium text-center -mt-1 opacity-90">{subtitle}</p>}
    </div>
  );
};

export default Header;