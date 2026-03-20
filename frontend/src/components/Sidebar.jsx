import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const isActive = (path) => location.pathname === path;
  const activeClass = "bg-primary/10 text-primary font-medium";
  const inactiveClass = "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors";

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await logout();
    }
  };

  return (
    <aside className="w-64 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-screen shadow-sm z-20">
      <div className="p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2 text-white">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-none tracking-tight">SGL-CI</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Gestion Logistique</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          <Link 
            to="/dashboard" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/dashboard') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm">Tableau de Bord</span>
          </Link>
          <Link 
            to="/events" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/events') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">event_note</span>
            <span className="text-sm">Événements</span>
          </Link>
          <Link 
            to="/chronograms/library" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/chronograms/library') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">book_online</span>
            <span className="text-sm">Bibliothèque</span>
          </Link>
          <Link 
            to="/events/calendar" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/events/calendar') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined font-variation-settings-fill">calendar_month</span>
            <span className="text-sm font-medium">Calendrier</span>
          </Link>
          <Link 
            to="/inventory" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/inventory') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">inventory_2</span>
            <span className="text-sm">Inventaire</span>
          </Link>
          <Link 
            to="/churches" 
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/churches') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">church</span>
            <span className="text-sm">Églises</span>
          </Link>
          <Link
            to="/movements"
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/movements') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">swap_horiz</span>
            <span className="text-sm">Mouvements</span>
          </Link>
          <Link
            to="/meetings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/meetings') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="text-sm">Réunions</span>
          </Link>
          <Link
            to="/report"
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/report') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">assignment</span>
            <span className="text-sm">Signalements</span>
          </Link>
          <Link
            to="/budget"
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/budget') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span className="text-sm">Budget</span>
          </Link>
          <Link
            to="/training"
            className={`flex items-center gap-3 px-3 py-2.5 rounded ${isActive('/training') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined">school</span>
            <span className="text-sm">Formation</span>
          </Link>
          <Link
            to="/training/hub"
            className={`flex items-center gap-3 px-6 py-2 rounded ${isActive('/training/hub') ? activeClass : inactiveClass}`}
          >
            <span className="material-symbols-outlined size-4 text-xs">auto_stories</span>
            <span className="text-xs">Hub E-Learning</span>
          </Link>
          <a className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mt-4" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm">Paramètres</span>
          </a>
        </nav>
      </div>
      <div className="mt-auto p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">person</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-semibold truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-slate-500 truncate uppercase">
              {user?.role === 'admin' ? 'Administrateur' : 
               user?.role === 'rln' ? 'Resp. Logistique National' :
               user?.role === 'rll' ? 'Resp. Logistique Local' :
               user?.role === 'pasteur' ? 'Pasteur' : 'Utilisateur'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm font-medium"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
