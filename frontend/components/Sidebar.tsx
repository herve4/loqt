
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppView } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: AppView.DASHBOARD, label: 'Tableau de bord', icon: '📊', path: '/' },
    { id: AppView.EVENTS, label: 'Événements', icon: '📅', path: '/events' },
    { id: AppView.CHURCHES, label: 'Églises & Villes', icon: '⛪', path: '/churches' },
    { id: AppView.INVENTORY, label: 'Inventaire', icon: '📦', path: '/inventory' },
    { id: AppView.MAP, label: 'Carte flotte', icon: '🗺️', path: '/map' },
    { id: AppView.SETTINGS, label: 'Configuration', icon: '⚙️', path: '/settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-slate-950 h-screen text-white flex flex-col fixed left-0 top-0 transition-all duration-300 z-50 border-r border-white/5 shadow-2xl">
      <div className="p-6 flex items-center">
        <Link to="/" className="flex flex-col gap-1 group">
          {/* SGLCI Logo SVG */}
          <svg viewBox="0 0 320 80" className="h-12 w-auto" xmlns="http://www.w3.org/2000/svg">
            {/* Gear */}
            <g fill="#2563EB">
              <path d="M38,14 L42,14 L43.5,20.5 C45.5,21.3 47.4,22.4 49,23.7 L55.5,21.5 L59.5,27.5 L54.5,32 C54.8,34 54.8,36 54.5,38 L59.5,42.5 L55.5,48.5 L49,46.3 C47.4,47.6 45.5,48.7 43.5,49.5 L42,56 L38,56 L36.5,49.5 C34.5,48.7 32.6,47.6 31,46.3 L24.5,48.5 L20.5,42.5 L25.5,38 C25.2,36 25.2,34 25.5,32 L20.5,27.5 L24.5,21.5 L31,23.7 C32.6,22.4 34.5,21.3 36.5,20.5 Z" />
              <circle cx="40" cy="35" r="8" fill="#0f172a" />
              {/* S inside gear */}
              <text x="40" y="39.5" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif" fill="#2563EB" fontStyle="italic">S</text>
            </g>
            {/* GLCI text */}
            <text x="62" y="46" fontSize="32" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" fill="#2563EB" letterSpacing="-1">GLCI</text>
            {/* Subtitle */}
            <text x="10" y="70" fontSize="8" fontFamily="Arial, sans-serif" fill="#94a3b8" letterSpacing="0.5">Système de gestion de Logistique CI</text>
          </svg>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-8 overflow-y-auto">
        <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Système Central</p>
        <ul className="space-y-1.5">
          {menuItems.slice(0, 5).map((item) => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${activeView === item.id
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                  }`}
              >
                {activeView === item.id && (
                  <div className="absolute left-0 top-0 w-1.5 h-full bg-white/40"></div>
                )}
                <span className={`text-xl transition-transform duration-500 ${activeView === item.id ? 'scale-110' : 'group-hover:scale-125'}`}>{item.icon}</span>
                <span className="font-bold tracking-tight text-sm uppercase">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {user?.is_staff && (
          <>
            <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-widest mt-12 mb-4">Administration</p>
            <ul className="space-y-1.5">
              <li>
                <Link
                  to="/settings"
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${activeView === AppView.SETTINGS
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                    }`}
                >
                  <span className="text-xl">⚙️</span>
                  <span className="font-bold tracking-tight text-sm uppercase">Config. Cluster</span>
                </Link>
              </li>
            </ul>
          </>
        )}
      </nav>

      <div className="p-6 mt-auto border-t border-white/5 bg-white/5">
        <div className="flex items-center gap-4 p-2">
          <div className="relative">
            <img src="https://picsum.photos/48/48?grayscale" className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500/20" alt="Avatar" />
            <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950"></span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black truncate leading-none">{user?.username || 'Utilisateur'}</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{user?.is_staff ? 'Administrateur' : 'Membre'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto text-slate-600 hover:text-white transition-colors"
            title="S'identifier comme un autre nœud"
          >
            🚪
          </button>
        </div>
      </div>
    </div>
  );
};


export default Sidebar;
