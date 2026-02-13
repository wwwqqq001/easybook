import React from 'react';
import { Delete } from 'lucide-react';

interface NumberPadProps {
  onNumber: (num: string) => void;
  onDelete: () => void;
  onConfirm: () => void;
  onClear: () => void;
}

const NumberPad: React.FC<NumberPadProps> = ({ onNumber, onDelete, onConfirm, onClear }) => {
  const baseBtnClass = "h-[4.5rem] text-3xl font-bold rounded-2xl shadow-sm border-b-[3px] active:border-b-0 active:translate-y-[3px] active:shadow-inner transition-all flex items-center justify-center select-none touch-manipulation";
  
  const numBtnClass = `${baseBtnClass} bg-white text-slate-800 border-slate-200 active:bg-slate-50`;
  const actionBtnClass = `${baseBtnClass} bg-slate-100 text-slate-600 border-slate-200`;
  const deleteBtnClass = `${baseBtnClass} bg-red-50 text-red-500 border-red-100`;
  const confirmBtnClass = `${baseBtnClass} row-span-2 bg-blue-600 text-white border-blue-800 active:bg-blue-700 h-full shadow-blue-200`;

  return (
    <div className="grid grid-cols-4 gap-3 p-4 bg-slate-50 pb-8 rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-30 relative">
      <button onClick={() => onNumber('7')} className={numBtnClass}>7</button>
      <button onClick={() => onNumber('8')} className={numBtnClass}>8</button>
      <button onClick={() => onNumber('9')} className={numBtnClass}>9</button>
      <button onClick={onDelete} className={deleteBtnClass}><Delete size={32} strokeWidth={2.5} /></button>

      <button onClick={() => onNumber('4')} className={numBtnClass}>4</button>
      <button onClick={() => onNumber('5')} className={numBtnClass}>5</button>
      <button onClick={() => onNumber('6')} className={numBtnClass}>6</button>
      <button onClick={onClear} className={`${actionBtnClass} text-xl font-bold`}>清空</button>

      <button onClick={() => onNumber('1')} className={numBtnClass}>1</button>
      <button onClick={() => onNumber('2')} className={numBtnClass}>2</button>
      <button onClick={() => onNumber('3')} className={numBtnClass}>3</button>
      
      <div className="row-span-2">
         <button onClick={onConfirm} className={confirmBtnClass}>
           <span className="text-2xl font-bold">完成</span>
         </button>
      </div>

      <button onClick={() => onNumber('0')} className={`${numBtnClass} col-span-2`}>0</button>
      <button onClick={() => onNumber('.')} className={numBtnClass}>.</button>
    </div>
  );
};

export default NumberPad;