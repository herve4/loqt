
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppView, Notification } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Events from './components/Events';
import FleetMap from './components/FleetMap';
import Churches from './components/Churches';
import QuickAssistant from './components/QuickAssistant';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';

const SettingsView: React.FC = () => (
  <div className="flex items-center justify-center h-[60vh] text-slate-500">
    <div className="text-center animate-in zoom-in duration-300">
      <div className="text-6xl mb-6 grayscale opacity-50">⚙️</div>
      <h2 className="text-2xl font-black text-slate-200 uppercase tracking-widest">Configuration</h2>
      <p className="text-slate-500 mt-2">Gérez les paramètres du cluster LOQT et les nœuds d'API.</p>
      <div className="mt-8 flex gap-4 justify-center">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20">Paramètres Cloud</button>
        <button className="px-6 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-700">Logs Base de Données</button>
      </div>
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', type: 'info', message: 'Bienvenue sur LOQT Pro. Système en ligne.', time: 'À l\'instant', read: false },
    { id: '2', type: 'warning', message: 'L\'entrepôt A atteint 80% de sa capacité.', time: 'il y a 1h', read: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  // Determine active view from path
  const getActiveView = () => {
    const path = location.pathname;
    if (path === '/') return AppView.DASHBOARD;
    if (path.startsWith('/inventory')) return AppView.INVENTORY;
    if (path.startsWith('/events')) return AppView.EVENTS;
    if (path.startsWith('/map')) return AppView.MAP;
    if (path.startsWith('/churches')) return AppView.CHURCHES;
    if (path.startsWith('/settings')) return AppView.SETTINGS;
    return AppView.DASHBOARD;
  };

  const activeView = getActiveView();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="flex bg-slate-950 min-h-screen font-['Inter'] selection:bg-blue-600 selection:text-white">
      <Sidebar activeView={activeView} setActiveView={() => { }} />

      <main className="flex-1 ml-64 min-h-screen p-8 lg:p-12 relative overflow-x-hidden text-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between mb-8 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full shadow-sm border border-slate-800 font-medium text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
              <span>🏠</span>
              <span>Accueil</span>
            </div>
            <span className="text-slate-700">/</span>
            <span className="font-black text-blue-500 uppercase tracking-tighter text-lg italic">{activeView}</span>
          </div>

          <div className="flex items-center gap-6">
            {/* Search and User profile UI... truncated for brevity but kept in mind */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-3 rounded-2xl transition-all relative ${showNotifications ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 shadow-sm'}`}
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 rounded-full border-2 border-slate-950 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {/* Notification Dropdown UI */}
              </div>
              <div className="h-10 w-[1px] bg-slate-800 mx-1"></div>
              <button className="flex items-center gap-3 p-1 pr-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-700 transition-all group">
                <img src="https://picsum.photos/32/32?grayscale" className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-800" alt="User" />
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">Session Utilisateur</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Connecté</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pb-24">
          <Routes>
            <Route path="/" element={<Dashboard setActiveView={() => { }} />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/events" element={<Events />} />
            <Route path="/map" element={<FleetMap />} />
            <Route path="/churches" element={<Churches />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </div>
      </main>
      <QuickAssistant />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/*" element={<MainLayout />} />
      </Route>
    </Routes>
  );
};


export default App;
