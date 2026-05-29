import React from 'react';

const ConfirmModal = ({ isOpen, title = "CONFIRMATION REQUISE", message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-950/80 backdrop-blur-md select-none font-mono">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 md:p-8 animate-in zoom-in-95 duration-200 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
          <span className="material-symbols-outlined text-rose-500 text-lg animate-pulse">warning</span>
          <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
            {title}
          </span>
        </div>

        {/* Message */}
        <div className="my-5">
          <p className="text-xs text-slate-300 uppercase tracking-wider leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-slate-800">
          <button 
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all rounded-none border border-slate-800 cursor-pointer active:scale-[0.98]"
          >
            ANNULER
          </button>
          <button 
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-rose-950/20 hover:bg-rose-900/30 text-rose-500 hover:text-rose-450 font-bold text-[10px] uppercase tracking-widest transition-all rounded-none border border-rose-900 cursor-pointer active:scale-[0.98]"
          >
            CONFIRMER
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
