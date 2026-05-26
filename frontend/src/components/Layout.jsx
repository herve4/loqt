import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import GlobalSearch from './GlobalSearch';

const Layout = ({ children, title, showBackButton, onBack, headerActions }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Header 
          title={title} 
          toggleSidebar={toggleSidebar} 
          showBackButton={showBackButton}
          onBack={onBack}
          headerActions={headerActions}
          onSearch={() => setIsSearchOpen(true)}
        />
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNavigation onSearch={() => setIsSearchOpen(true)} />

      {/* Fullscreen Search Overlay */}
      {isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}
    </div>
  );
};

export default Layout;
