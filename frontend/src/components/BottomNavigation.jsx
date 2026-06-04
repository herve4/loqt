import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const BottomNavigation = ({ onSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Synthesize a staccato technical beep via browser Web Audio API
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(950, audioCtx.currentTime); // 950Hz
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07); // 70ms decay

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio Context beep initialization failed", e);
    }
  };

  const handleScanClick = () => {
    playBeep();
    navigate('/movements');
  };

  const handleNotificationClick = () => {
    toast(() => (
      <div className="flex flex-col gap-2 font-mono text-xs text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-2 font-bold border-b border-slate-100 dark:border-slate-800 pb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
          <span className="material-symbols-outlined text-[16px] text-primary">notifications</span>
          Alertes Logistiques Actives
        </div>
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 px-2.5 py-1.5 border-l-2 border-red-500">
          <span className="material-symbols-outlined text-xs">warning</span>
          <span>14 Retards de livraison de matériel</span>
        </div>
        <div className="flex items-center gap-2 text-primary bg-primary/5 dark:bg-primary/20 px-2.5 py-1.5 border-l-2 border-primary">
          <span className="material-symbols-outlined text-xs">event</span>
          <span>Réunion planifiée aujourd'hui à 14:00</span>
        </div>
      </div>
    ), {
      duration: 4000,
      id: 'active-alerts-toast',
      style: {
        borderRadius: '0px',
        background: 'var(--color-toast-bg, #ffffff)',
        color: 'var(--color-toast-text, #0f172a)',
        border: '1px solid var(--color-toast-border, #e2e8f0)',
        padding: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }
    });
  };

  const handleLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 z-[1050] flex items-center justify-around md:hidden backdrop-blur-md select-none no-print">
        {/* Dashboard */}
        <button
          onClick={() => navigate('/dashboard')}
          className={`flex flex-col items-center justify-center w-12 h-full active:scale-90 transition-transform cursor-pointer relative ${
            isActive('/dashboard') ? 'text-primary font-bold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {isActive('/dashboard') && (
            <span className="absolute top-0 inset-x-2 h-0.5 bg-primary rounded-none" />
          )}
          <span className="material-symbols-outlined text-[24px]">dashboard</span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Accueil</span>
        </button>

        {/* Search / Inventory */}
        <button
          onClick={onSearch}
          className="flex flex-col items-center justify-center w-12 h-full active:scale-90 transition-transform cursor-pointer relative text-slate-400 dark:text-slate-500"
        >
          <span className="material-symbols-outlined text-[24px]">search</span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Recherche</span>
        </button>

        {/* Center Scanner Action Button */}
        <button
          onClick={handleScanClick}
          className="flex flex-col items-center justify-center size-14 bg-primary text-white active:scale-95 transition-all cursor-pointer relative -translate-y-3 shadow-lg shadow-primary/30 border-4 border-white dark:border-slate-950 rounded-none z-[1051] laser-beam-pulse"
          aria-label="Scanner QR Code"
        >
          <span className="material-symbols-outlined text-[26px]">qr_code_scanner</span>
        </button>

        {/* Notifications */}
        <button
          onClick={handleNotificationClick}
          className="flex flex-col items-center justify-center w-12 h-full active:scale-90 transition-transform cursor-pointer relative text-slate-400 dark:text-slate-500"
        >
          <span className="material-symbols-outlined text-[24px] relative">
            notifications
            <span className="absolute top-0.5 right-0.5 size-1.5 bg-danger rounded-full" />
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Alertes</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => setIsProfileOpen(true)}
          className={`flex flex-col items-center justify-center w-12 h-full active:scale-90 transition-transform cursor-pointer relative ${
            isProfileOpen ? 'text-primary font-bold' : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-[24px]">person</span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5">Profil</span>
        </button>
      </nav>

      {/* Profile Drawer / Bottom Sheet */}
      {isProfileOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsProfileOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-[1060] md:hidden no-print"
          />

          {/* Bottom Sheet */}
          <div className="fixed inset-x-0 bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-[1070] rounded-none transform transition-transform duration-300 ease-out md:hidden no-print animate-in slide-in-from-bottom duration-250">
            {/* Header / Telemetry detail */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-bold">SESSION LOGISTIQUE</span>
                <h3 className="text-xs font-mono font-black uppercase text-slate-900 dark:text-white">Opérateur Actif</h3>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="px-2.5 py-1 border border-slate-200 dark:border-slate-800 text-[9px] font-mono font-bold uppercase tracking-wider rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                [ FERMER ]
              </button>
            </div>

            {/* Profile Content */}
            <div className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 mb-6">
              <div className="size-12 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl font-black">person</span>
              </div>
              <div className="flex-1 min-w-0 font-mono text-xs">
                <p className="font-bold text-slate-900 dark:text-white text-sm uppercase truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tight mt-0.5">
                  Rôle : {user?.role === 'admin' ? 'Administrateur' : 
                          user?.role === 'rln' ? 'Resp. Logistique National' :
                          user?.role === 'rll' ? 'Resp. Logistique Local' :
                          user?.role === 'pasteur' ? 'Pasteur' : 'Utilisateur'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleLogout}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-none active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              Déconnexion
            </button>
          </div>
        </>
      )}

      {/* Pulse Scan effect animation */}
      <style>{`
        @keyframes laser-beam-pulse {
          0%, 100% { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(23, 69, 207, 0.4); }
          50% { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 0 6px rgba(23, 69, 207, 0); }
        }
        .laser-beam-pulse {
          animation: laser-beam-pulse 2s infinite ease-in-out;
        }
      `}</style>
      <ConfirmModal 
        isOpen={isLogoutConfirmOpen}
        title="DÉCONNEXION"
        message="Voulez-vous vraiment vous déconnecter ?"
        onConfirm={async () => {
          setIsLogoutConfirmOpen(false);
          setIsProfileOpen(false);
          await logout();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </>
  );
};

export default BottomNavigation;
