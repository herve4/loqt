import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import DefectReportModal from '../components/DefectReportModal';

const QRTransit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);

  // Monitor online status
  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Fetch material from API with caching and automatic local storage fallback
  const { data: item, isLoading } = useQuery({
    queryKey: ['materiel-transit', id],
    queryFn: async () => {
      const cacheKey = `qr-transit-cache-${id}`;
      try {
        const res = await logisticsService.getMaterielById(id);
        const freshData = res.data;
        if (freshData) {
          localStorage.setItem(cacheKey, JSON.stringify(freshData));
        }
        return freshData;
      } catch (err) {
        // Fallback to cache on network failure
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch (e) {
            console.error("Error parsing cached QR transit item:", e);
          }
        }
        throw err;
      }
    },
    retry: 1,
    enabled: !!id,
  });

  // Status mapping helpers
  const getStatusDetails = (status) => {
    switch (status) {
      case 'OP':
        return { label: 'OPÉRATIONNEL', color: 'bg-emerald-500 text-emerald-500', glow: 'shadow-emerald-500/50' };
      case 'PA':
        return { label: 'EN PANNE', color: 'bg-red-500 text-red-500', glow: 'shadow-red-500/50' };
      case 'RE':
        return { label: 'EN RÉPARATION', color: 'bg-amber-500 text-amber-500', glow: 'shadow-amber-500/50' };
      case 'PE':
        return { label: 'PERDU', color: 'bg-slate-500 text-slate-500', glow: 'shadow-slate-500/50' };
      default:
        return { label: 'STATUT INCONNU', color: 'bg-slate-400 text-slate-400', glow: 'shadow-slate-400/50' };
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-slate-900 dark:border-white border-t-transparent animate-spin rounded-none"></div>
          <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Identification de l'équipement...</p>
        </div>
      </div>
    );
  }

  // Error/Not found state (if neither fetched nor cached is available)
  if (!item) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-between p-6 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="border-b-2 border-slate-900 dark:border-slate-800 pb-4">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-500">SYSTEM ERROR</span>
          <h1 className="text-xl font-black uppercase tracking-tight mt-1">Matériel introuvable</h1>
        </div>

        {/* Technical Error Box */}
        <div className="my-auto py-12 text-center space-y-6">
          <div className="inline-flex size-20 border-2 border-dashed border-red-500 text-red-500 items-center justify-center rounded-none mx-auto">
            <span className="material-symbols-outlined text-4xl">error_outline</span>
          </div>
          <div className="space-y-2 max-w-sm mx-auto">
            <h2 className="font-bold text-sm uppercase tracking-wider font-mono">Code QR non enregistré</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono leading-relaxed">
              L'identifiant matériel <span className="text-slate-900 dark:text-white font-bold">#{id}</span> n'existe pas en base de données et aucune version locale n'est en cache. Veuillez vérifier l'étiquette physique.
            </p>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="space-y-3">
          <Link
            to="/inventory"
            className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 rounded-none hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            Retourner à l'inventaire
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="w-full h-14 border-2 border-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-300 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 rounded-none hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            Page précédente
          </button>
        </div>
      </div>
    );
  }

  // Loaded successfully (Online or Cached)
  const status = getStatusDetails(item.etat);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-between p-6 text-slate-900 dark:text-white">
      {/* Dynamic Offline Banner */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-slate-950 py-1.5 px-4 font-mono text-[9px] font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 z-50">
          <span className="material-symbols-outlined text-xs">wifi_off</span>
          <span>⚡ Mode Hors-ligne : Rendu depuis le cache local</span>
        </div>
      )}

      {/* Brand Header */}
      <div className={`border-b-2 border-slate-900 dark:border-slate-800 pb-4 ${isOffline ? 'mt-6' : ''}`}>
        <div className="flex justify-between items-center">
          <span className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-500">SGL-CI LOGISTICS • QR TRANSIT</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">SYS_ACTIVE</span>
          </span>
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight mt-1 truncate">{item.nom}</h1>
      </div>

      {/* Equipment Technical Sheet */}
      <div className="my-auto py-8 space-y-6">
        {/* Status HUD Block */}
        <div className="border-2 border-slate-900 dark:border-slate-800 p-5 bg-slate-50 dark:bg-slate-900/40 relative rounded-none flex items-center justify-between">
          <div className="space-y-1">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">Égligibilité Technique</span>
            <p className={`font-mono text-sm font-black tracking-wider ${status.color}`}>
              {status.label}
            </p>
          </div>
          {/* Pulsing indicator */}
          <div className={`size-6 rounded-full border-4 border-white dark:border-slate-900 shadow-md ${status.color} ${status.glow} animate-pulse`}></div>
        </div>

        {/* Spec details grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between min-h-[72px]">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">Identifiant</span>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
              {item.identifiant_unique || `EQ-${String(item.id).padStart(5, '0')}`}
            </span>
          </div>
          <div className="border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between min-h-[72px]">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">Catégorie</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase">
              {item.categorie_nom || item.categorie || '—'}
            </span>
          </div>
          <div className="border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between min-h-[72px] col-span-2">
            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase">Localisation Principale</span>
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {item.eglise_nom || 'Siège National'}
            </span>
          </div>
        </div>
      </div>

      {/* Fast Mobile Action Targets */}
      <div className="space-y-3">
        {/* Action 1: Transfer Equipment */}
        <Link
          to={`/movements?addItemId=${item.id}`}
          className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 rounded-none hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-lg">local_shipping</span>
          Transférer l'équipement
        </Link>

        {/* Action 2: Report Defect */}
        <button
          onClick={() => setIsDefectModalOpen(true)}
          className="w-full h-14 border-2 border-orange-500 text-orange-600 dark:text-orange-500 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 rounded-none bg-orange-50/50 dark:bg-orange-950/10 hover:bg-orange-100/30 active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">report_problem</span>
          Signaler un défaut / Panne
        </button>

        {/* Action 3: View Full Inventory Sheet */}
        <Link
          to={`/inventory/${item.id}`}
          className="w-full h-12 border-2 border-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-300 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 rounded-none hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">settings_input_component</span>
          Fiche d'inventaire complète
        </Link>
      </div>
      {isDefectModalOpen && (
        <DefectReportModal item={item} onClose={() => setIsDefectModalOpen(false)} />
      )}
    </div>
  );
};

export default QRTransit;
