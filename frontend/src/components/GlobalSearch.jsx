import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logisticsService } from '../services/api';

const GlobalSearch = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ materiels: [], eglises: [], evenements: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Focus input automatically on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Listen for Escape key to close search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Debounced live API search
  useEffect(() => {
    if (!query.trim()) {
      setResults({ materiels: [], eglises: [], evenements: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const [materielsRes, eglisesRes, evenementsRes] = await Promise.all([
          logisticsService.getMateriels({ search: query, page_size: 5 }),
          logisticsService.getEglises({ search: query, page_size: 5 }),
          logisticsService.getEvenements({ search: query, page_size: 5 })
        ]);

        const rawMateriels = Array.isArray(materielsRes.data) ? materielsRes.data : (materielsRes.data?.results || []);
        const rawEglises = Array.isArray(eglisesRes.data) ? eglisesRes.data : (eglisesRes.data?.results || []);
        const rawEvenements = Array.isArray(evenementsRes.data) ? evenementsRes.data : (evenementsRes.data?.results || []);

        setResults({
          materiels: rawMateriels.slice(0, 4),
          eglises: rawEglises.slice(0, 4),
          evenements: rawEvenements.slice(0, 4)
        });
      } catch (error) {
        console.error("Global search query failed", error);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleItemClick = (path) => {
    onClose();
    navigate(path);
  };

  const hasResults = results.materiels.length > 0 || results.eglises.length > 0 || results.evenements.length > 0;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg z-[2000] flex flex-col p-4 sm:p-10 no-print font-mono animate-in fade-in duration-200">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto pb-4 border-b border-slate-800">
        <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-black">SYSTÈME DE RECHERCHE UNIFIÉ — SGL-CI</span>
        <button
          onClick={onClose}
          className="px-3 py-1.5 border border-slate-800 bg-slate-950 text-slate-400 font-mono text-[9px] font-bold uppercase tracking-widest rounded-none hover:border-white hover:text-white transition-all active:scale-95 cursor-pointer"
        >
          [ ESC / FERMER ]
        </button>
      </div>

      {/* Main Search Box */}
      <div className="w-full max-w-4xl mx-auto mt-8 sm:mt-16 relative">
        <div className="flex items-center gap-3 border-b-2 border-slate-800 focus-within:border-primary py-3 transition-colors">
          <span className="material-symbols-outlined text-slate-500 text-2xl select-none">search</span>
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-0 focus:ring-0 outline-none text-base sm:text-xl font-bold text-white placeholder:text-slate-600 uppercase tracking-tight py-1"
            placeholder="Rechercher matériel, église, événement..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading && (
            <span className="material-symbols-outlined text-primary text-2xl animate-spin select-none">progress_activity</span>
          )}
        </div>
      </div>

      {/* Results or Shortcuts Container */}
      <div className="w-full max-w-4xl mx-auto flex-1 overflow-y-auto mt-8 pb-10">
        {query.trim() === '' ? (
          /* Swiss-Minimalist Logistics Shortcuts */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Raccourcis Logistiques</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => handleItemClick('/inventory')}
                className="flex items-center gap-4 p-4 border border-slate-900 bg-slate-900/30 hover:border-slate-700 transition-colors text-left group cursor-pointer"
              >
                <div className="size-10 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-xl">inventory_2</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">[ INVENTAIRE COMPLET ]</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Consulter l'état des stocks nationaux</p>
                </div>
              </button>

              <button
                onClick={() => handleItemClick('/movements/history')}
                className="flex items-center gap-4 p-4 border border-slate-900 bg-slate-900/30 hover:border-slate-700 transition-colors text-left group cursor-pointer"
              >
                <div className="size-10 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-xl">history</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">[ HISTORIQUE DES FLUX ]</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Consulter le registre des mouvements</p>
                </div>
              </button>

              <button
                onClick={() => handleItemClick('/meetings')}
                className="flex items-center gap-4 p-4 border border-slate-900 bg-slate-900/30 hover:border-slate-700 transition-colors text-left group cursor-pointer"
              >
                <div className="size-10 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-xl">groups</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">[ CONSOLE DES RÉUNIONS ]</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Procès-verbaux et planification de direction</p>
                </div>
              </button>

              <button
                onClick={() => handleItemClick('/training/hub')}
                className="flex items-center gap-4 p-4 border border-slate-900 bg-slate-900/30 hover:border-slate-700 transition-colors text-left group cursor-pointer"
              >
                <div className="size-10 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <span className="material-symbols-outlined text-xl">auto_stories</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">[ HUB D'APPRENTISSAGE ]</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tutoriels et manuels d'équipements</p>
                </div>
              </button>
            </div>
          </div>
        ) : loading ? (
          /* Scanning Laser Loading Animation */
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-slate-700 animate-spin select-none">progress_activity</span>
            <p className="text-[10px] tracking-wider text-slate-500 uppercase font-black">Recherche dans la base de données...</p>
          </div>
        ) : hasResults ? (
          /* Search Results */
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Matériels (Equipment) */}
            {results.materiels.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">inventory_2</span>
                  Équipements Logistiques ({results.materiels.length})
                </h3>
                <div className="space-y-2">
                  {results.materiels.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(`/inventory/${item.id}`)}
                      className="p-3 border border-slate-900 hover:border-primary/50 bg-slate-900/20 hover:bg-slate-900/40 flex items-center justify-between gap-4 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-slate-400 group-hover:border-slate-600 transition-colors">
                          <span className="material-symbols-outlined text-base">construction</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-primary transition-colors uppercase truncate">{item.nom}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{item.categorie_nom || "Matériel"} • Affecté à {item.eglise_nom || "Siège National"}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-400 px-2 py-0.5 border border-slate-800 shrink-0 uppercase">
                        {item.identifiant_unique || `EQ-${item.id}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Églises (Churches) */}
            {results.eglises.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">church</span>
                  Églises & Implantations ({results.eglises.length})
                </h3>
                <div className="space-y-2">
                  {results.eglises.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(`/churches`)}
                      className="p-3 border border-slate-900 hover:border-primary/50 bg-slate-900/20 hover:bg-slate-900/40 flex items-center justify-between gap-4 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-slate-400 group-hover:border-slate-600 transition-colors">
                          <span className="material-symbols-outlined text-base">home_pin</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-primary transition-colors uppercase truncate">{item.nom}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">Région : {item.region_nom || "Cote d'Ivoire"}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-400 px-2 py-0.5 border border-slate-800 shrink-0 uppercase">
                        IMPLANTATION
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Événements (Events) */}
            {results.evenements.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">event_note</span>
                  Événements Opérationnels ({results.evenements.length})
                </h3>
                <div className="space-y-2">
                  {results.evenements.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(`/events/${item.id}`)}
                      className="p-3 border border-slate-900 hover:border-primary/50 bg-slate-900/20 hover:bg-slate-900/40 flex items-center justify-between gap-4 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-slate-400 group-hover:border-slate-600 transition-colors">
                          <span className="material-symbols-outlined text-base">event_repeat</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-200 group-hover:text-primary transition-colors uppercase truncate">{item.titre}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">Lieu : {item.lieu || "Non spécifié"} • Début : {item.date_debut ? new Date(item.date_debut).toLocaleDateString('fr-FR') : "N/A"}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-mono font-bold bg-slate-900 text-slate-400 px-2 py-0.5 border border-slate-800 shrink-0 uppercase">
                        {item.type_evenement || "Événement"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Empty / No Results State */
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <span className="material-symbols-outlined text-4xl text-slate-700">search_off</span>
            <p className="text-sm font-bold text-slate-400">AUCUN ENREGISTREMENT TROUVÉ POUR "{query.toUpperCase()}"</p>
            <p className="text-xs text-slate-600">Vérifiez l'orthographe ou essayez un identifiant unique technique.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalSearch;
