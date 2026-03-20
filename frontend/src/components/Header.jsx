import React from 'react';

const Header = ({ title }) => {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/10 text-danger border border-danger/20">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span className="text-xs font-semibold">14 Retards</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            <span className="material-symbols-outlined text-[18px]">event_repeat</span>
            <span className="text-xs font-semibold">Réunion à 14:00</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 relative">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">notifications</span>
            <span className="absolute top-2 right-2 size-2 bg-danger rounded-full border-2 border-white dark:border-slate-900"></span>
          </button>
          <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">search</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
