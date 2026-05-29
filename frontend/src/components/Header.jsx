import React from 'react';
import NotificationPanel from './NotificationPanel';

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

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {headerActions && (
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 mr-2">
            {headerActions}
          </div>
        )}

        {/* Notification Bell */}
        <NotificationPanel />

        {/* Search */}
        <button 
          onClick={onSearch}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95 transition-all"
          aria-label="Rechercher"
        >
          <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">search</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
