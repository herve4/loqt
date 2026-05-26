import React from 'react';

const Header = ({ title, toggleSidebar, showBackButton, onBack, headerActions, onSearch }) => {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 mr-4">
        {toggleSidebar && (
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Ouvrir le menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        {showBackButton && (
          <button 
            onClick={onBack} 
            className="text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white rounded-lg p-1.5 transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Retour"
          >
            <span className="material-symbols-outlined text-sm font-black">arrow_back</span>
          </button>
        )}
        <div className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-white truncate flex-1 min-w-0">
          {title}
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
        {headerActions ? (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {headerActions}
          </div>
        ) : (
          <>
            <div className="hidden sm:flex items-center gap-3 md:gap-4 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/10 text-danger border border-danger/20">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span className="text-xs font-semibold">14 Retards</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <span className="material-symbols-outlined text-[18px]">event_repeat</span>
                <span className="text-xs font-semibold">Réunion à 14:00</span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 relative">
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">notifications</span>
                <span className="absolute top-2 right-2 size-2 bg-danger rounded-full border-2 border-white dark:border-slate-900"></span>
              </button>
              <button 
                onClick={onSearch}
                className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95 transition-all"
                aria-label="Rechercher"
              >
                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">search</span>
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
