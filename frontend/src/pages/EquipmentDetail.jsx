import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { logisticsService } from '../services/api';
import MaterielFormModal from '../components/MaterielFormModal';
import DefectReportModal from '../components/DefectReportModal';

// ─── Sub-components ──────────────────────────────────────────────────────────

const InfoBlock = ({ label, value, icon }) => (
  <div className="group border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/40 p-3 hover:bg-slate-100/70 dark:hover:bg-slate-900/80 transition-all duration-200">
    <div className="flex items-center gap-1.5 text-slate-500 uppercase tracking-widest text-[9px] font-mono font-bold">
      {icon && <span className="material-symbols-outlined text-[11px]">{icon}</span>}
      <span>{label}</span>
    </div>
    <p className="font-mono font-bold text-sm mt-1 text-slate-900 dark:text-white truncate">{value || '—'}</p>
  </div>
);

const MovementTypeBadge = ({ type }) => {
  if (type === 'IN')
    return <span className="px-2 py-0.5 bg-emerald-500 text-white border border-emerald-600 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">CHECK-IN</span>;
  if (type === 'OUT')
    return <span className="px-2 py-0.5 bg-amber-500 text-white border border-amber-600 rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">CHECK-OUT</span>;
  return <span className="px-2 py-0.5 bg-slate-800 text-white rounded-none text-[10px] font-mono font-bold uppercase tracking-wider">{type}</span>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const EquipmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('movements');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const dropdownButtonRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClick = (e) => {
      if (dropdownButtonRef.current && !dropdownButtonRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isDropdownOpen]);

  // Lock scroll on the Layout's scrollable container when bottom sheet is open
  useEffect(() => {
    const scrollEl = document.querySelector('[data-scroll-container]');
    if (!scrollEl) return;
    if (isDropdownOpen) {
      scrollEl.style.overflow = 'hidden';
    } else {
      scrollEl.style.overflow = '';
    }
    return () => {
      scrollEl.style.overflow = '';
    };
  }, [isDropdownOpen]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);

  // Mobile Touch Swipe Handling
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50; // swipe left -> next image
    const isRightSwipe = distance < -50; // swipe right -> prev image

    if (isLeftSwipe && allImages.length > 1) {
      handleNextImage();
    } else if (isRightSwipe && allImages.length > 1) {
      handlePrevImage();
    }

    // Reset
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const deleteMutation = useMutation({
    mutationFn: () => logisticsService.deleteMateriel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Matériel supprimé avec succès !');
      navigate('/inventory');
    },
    onError: (err) => {
      toast.error(`Erreur lors de la suppression : ${err.message}`);
    }
  });

  const { data: materiel, isLoading } = useQuery({
    queryKey: ['materiel', id],
    queryFn: () => logisticsService.getMaterielById(id).then(r => r.data),
    enabled: !!id,
  });

  const { data: movementsData } = useQuery({
    queryKey: ['materiel-movements', id],
    queryFn: () => logisticsService.getMaterielMovements(id).then(r => r.data),
    enabled: !!id,
  });

  const { data: defectsData } = useQuery({
    queryKey: ['materiel-defects', id],
    queryFn: () => logisticsService.getMaterielDefects(id).then(r => r.data),
    enabled: !!id,
  });

  const movements = movementsData?.results || [];
  const defects = defectsData?.results || [];

  const allImages = [];
  if (materiel?.image) {
    allImages.push({ id: 'primary', image: materiel.image });
  }
  if (materiel?.images_materiel && materiel.images_materiel.length > 0) {
    const getFilename = (url) => {
      if (!url) return '';
      const parts = url.split('/');
      return parts[parts.length - 1];
    };
    const primaryFilename = getFilename(materiel?.image);

    materiel.images_materiel.forEach((img) => {
      const imgFilename = getFilename(img.image);
      if (!primaryFilename || imgFilename !== primaryFilename) {
        allImages.push(img);
      }
    });
  }

  const activeImageUrl = selectedImage || materiel?.image || '';

  const handleOpenLightbox = () => {
    const idx = allImages.findIndex(img => img.image === activeImageUrl);
    if (idx !== -1) {
      setLightboxImageIndex(idx);
    } else {
      setLightboxImageIndex(0);
    }
    setIsLightboxOpen(true);
  };

  const handlePrevImage = () => {
    setLightboxImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setLightboxImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsLightboxOpen(false);
    }
  };

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft' && allImages.length > 1) {
        handlePrevImage();
      } else if (e.key === 'ArrowRight' && allImages.length > 1) {
        handleNextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, lightboxImageIndex, allImages.length]);

  const statusStyle = () => {
    const s = materiel?.etat;
    if (s === 'OP') return {
      color: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      border: 'border-emerald-500',
      dot: 'bg-emerald-500',
      glow: 'shadow-[0_0_12px_#10b981]',
      label: 'Opérationnel'
    };
    if (s === 'PA') return {
      color: 'text-red-500 dark:text-red-400',
      bg: 'bg-red-500/10 dark:bg-red-500/20',
      border: 'border-red-500',
      dot: 'bg-red-500',
      glow: 'shadow-[0_0_12px_#ef4444]',
      label: 'En Panne'
    };
    if (s === 'RE') return {
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      border: 'border-amber-500',
      dot: 'bg-amber-500',
      glow: 'shadow-[0_0_12px_#f59e0b]',
      label: 'En Réparation'
    };
    return {
      color: 'text-slate-500',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500',
      dot: 'bg-slate-500',
      glow: 'shadow-[0_0_12px_#64748b]',
      label: s || 'Inconnu'
    };
  };

  const currentStatus = statusStyle();

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-950">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
      <div className="text-center relative">
        <div className="relative size-16 flex items-center justify-center border border-slate-200 dark:border-slate-800 border-t-slate-900 dark:border-t-white rounded-none mx-auto mb-4 animate-spin duration-300">
          <span className="material-symbols-outlined text-3xl font-black">qr_code_2</span>
        </div>
        <p className="text-xs font-mono font-bold tracking-widest text-slate-900 dark:text-white uppercase animate-pulse">
          INITIALISATION DE LA CONSOLE LOGISTIQUE...
        </p>
      </div>
    </div>
  );

  return (
    <Layout
      title={
        <div className="flex items-center gap-2">
          <span className="truncate">{materiel?.nom || 'Fiche Équipement'}</span>
          <span className="text-[10px] font-mono bg-slate-900 text-white dark:bg-slate-800 px-1.5 py-0.5 font-bold shrink-0">
            {materiel?.identifiant_unique || `EQ-${id}`}
          </span>
        </div>
      }
      showBackButton={true}
      onBack={() => navigate(-1)}
      headerActions={
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setIsFormModalOpen(true)}
            className="hidden md:flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 h-10 text-xs font-mono font-bold uppercase tracking-widest shadow-xs active:scale-95 transition-all gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs font-black">edit</span>
            Mettre à jour
          </button>
          
          <div ref={dropdownButtonRef} className="relative">
            <button 
              onClick={() => {
                if (!isDropdownOpen && dropdownButtonRef.current) {
                  const rect = dropdownButtonRef.current.getBoundingClientRect();
                  setDropdownPos({
                    top: rect.bottom + 8,
                    right: window.innerWidth - rect.right,
                  });
                }
                setIsDropdownOpen(!isDropdownOpen);
              }}
              className="flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-350 w-10 h-10 rounded-none hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">more_vert</span>
            </button>
          </div>

          {/* Actions menu: bottom sheet on mobile (portal), dropdown on desktop */}
          {isDropdownOpen && (
            <>
              {/* Transparent overlay to close on desktop outside click */}
              <div
                className="fixed inset-0 z-[1400] hidden md:block"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Desktop dropdown (md+) — stays in-tree, no overflow issue on desktop */}
              <div 
                style={{ top: dropdownPos.top, right: dropdownPos.right }}
                className="fixed w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-[1500] rounded-none hidden md:block"
              >
                <button 
                  onClick={() => { setIsFormModalOpen(true); setIsDropdownOpen(false); }}
                  className="w-full px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 cursor-pointer border-b border-slate-100 dark:border-slate-800"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Modifier
                </button>
                <button 
                  onClick={() => { setIsDeleteConfirmOpen(true); setIsDropdownOpen(false); }}
                  className="w-full px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Supprimer
                </button>
              </div>
            </>
          )}

          {/* Mobile bottom sheet — PORTAL to document.body to escape overflow:hidden ancestors */}
          {isDropdownOpen && typeof document !== 'undefined' && createPortal(
            <div className="md:hidden">
              {/* Dark overlay */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(2,6,23,0.65)' }}
                onClick={() => setIsDropdownOpen(false)}
              />
              {/* Bottom sheet panel */}
              <div
                style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 99999 }}
                className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-bottom duration-200"
              >
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-400">Actions</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">{materiel?.nom}</p>
                </div>
                <button
                  onClick={() => { setIsFormModalOpen(true); setIsDropdownOpen(false); }}
                  className="w-full px-5 py-4 text-left text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 cursor-pointer border-b border-slate-100 dark:border-slate-800 active:bg-slate-100"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Modifier cet équipement
                </button>
                <button
                  onClick={() => { setIsDeleteConfirmOpen(true); setIsDropdownOpen(false); }}
                  className="w-full px-5 py-4 text-left text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors flex items-center gap-3 cursor-pointer active:bg-red-50"
                >
                  <span className="material-symbols-outlined">delete</span>
                  Supprimer définitivement
                </button>
                {/* Space for bottom nav bar (h-16 = 64px) */}
                <div style={{ height: 80 }} />
              </div>
            </div>,
            document.body
          )}
        </div>
      }
    >
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-8 grid-tech">
        <style>{`
          @keyframes laser-scan {
            0%, 100% { top: 0%; opacity: 0.15; }
            50% { top: 100%; opacity: 0.85; }
          }
          @keyframes radar-pulse {
            0% { transform: scale(0.5); opacity: 0.8; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          @keyframes sweep-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .laser-glow {
            box-shadow: 0 0 10px 1px #10b981;
          }
          .laser-glow-danger {
            box-shadow: 0 0 10px 1px #ef4444;
          }
          .laser-glow-warning {
            box-shadow: 0 0 10px 1px #f59e0b;
          }
          .grid-tech {
            background-size: 20px 20px;
            background-image: 
              linear-gradient(to right, rgba(15, 23, 42, 0.03) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(15, 23, 42, 0.03) 1px, transparent 1px);
          }
          .dark .grid-tech {
            background-image: 
              linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        `}</style>

        <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-8">
          
          {/* Main Workspace Frame */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Left Column (Tactical Data) ── */}
            <div className="lg:col-span-2 space-y-8">

              {/* Technical Profile Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900/50 p-6 shadow-sm relative overflow-hidden">
                {/* Decorative Tech Grid Details */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
                  <svg width="100%" height="100%"><line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="2" strokeDasharray="4"/></svg>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 relative z-10">
                  {/* Camera Viewport Framing for image */}
                  <div className="relative shrink-0 w-full md:w-52 flex flex-col items-center">
                    <div className="relative w-full aspect-square md:w-52 md:h-52 bg-slate-950 border border-slate-100 dark:border-slate-900 p-1 overflow-hidden group">
                      
                      {/* Live Target corners */}
                      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-500 pointer-events-none z-20" />
                      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-500 pointer-events-none z-20" />
                      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-500 pointer-events-none z-20" />
                      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-500 pointer-events-none z-20" />
                      
                      {/* Scanner Beam Animation */}
                      <div className={`absolute left-0 right-0 h-0.5 pointer-events-none z-20 animate-[laser-scan_3.5s_infinite_ease-in-out] ${
                        materiel?.etat === 'PA' ? 'bg-red-500 laser-glow-danger' : 
                        materiel?.etat === 'RE' ? 'bg-amber-500 laser-glow-warning' : 
                        'bg-emerald-500 laser-glow'
                      }`} />

                      {/* Equipment Image or Fallback Grid */}
                      <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
                        {activeImageUrl ? (
                          <div 
                            className="relative w-full h-full group/img cursor-zoom-in overflow-hidden" 
                            onClick={handleOpenLightbox}
                          >
                            <img 
                              src={activeImageUrl} 
                              alt={materiel.nom} 
                              className="w-full h-full object-cover grayscale group-hover/img:grayscale-0 group-hover/img:scale-[1.03] transition-all duration-500 ease-out" 
                            />
                            {/* Hover Technical Tag */}
                            <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                              <div className="bg-slate-900/90 text-white font-mono text-[9px] py-1 px-2 border border-slate-700/50 uppercase tracking-widest flex items-center gap-1.5 shadow-md">
                                <span className="material-symbols-outlined text-[10px]">zoom_in</span>
                                <span>Agrandir</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-500 font-mono text-center">
                            <span className="material-symbols-outlined text-5xl">settings_input_component</span>
                            <span className="text-[9px] uppercase tracking-wider">NO IMAGE LIVE FEED</span>
                          </div>
                        )}

                        {/* Camera Center Reticle */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                          <div className="w-6 h-6 border border-dashed border-white rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Multi-Image Thumbnails row (Swiss-Minimalist Option A) */}
                    {allImages.length > 1 && (
                      <div className="w-full mt-2 flex flex-wrap gap-1.5 justify-start">
                        {allImages.map((img) => (
                          <button
                            key={img.id}
                            onClick={() => setSelectedImage(img.image)}
                            className={`size-10 bg-slate-900 p-0.5 border rounded-none overflow-hidden transition-all duration-150 active:scale-95 cursor-pointer ${
                              activeImageUrl === img.image
                                ? 'border-emerald-500 ring-1 ring-emerald-500'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                            }`}
                          >
                            <img src={img.image} alt="Miniature" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Technical Identifier Tag */}
                    <div className="w-full bg-slate-900 dark:bg-slate-800 text-white font-mono text-[9px] py-1 px-3 mt-2 uppercase tracking-widest text-center">
                      SENSORS CONNECTED: L1_CAM_V
                    </div>
                  </div>

                  {/* Metadata and Readouts */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Live System Status Light */}
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="relative size-3.5 flex items-center justify-center">
                          <span className={`absolute inset-0 rounded-full animate-ping opacity-60 ${currentStatus.dot}`} />
                          <span className={`relative size-2 rounded-full ${currentStatus.dot} ${currentStatus.glow}`} />
                        </div>
                        <span className={`font-mono text-xs uppercase font-black tracking-widest ${currentStatus.color}`}>
                          SYSTEM STATUS: {currentStatus.label}
                        </span>
                      </div>
                      
                      <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {materiel?.nom}
                      </h1>
                      
                      {materiel?.description ? (
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-3 leading-relaxed border-l-2 border-slate-200 dark:border-slate-800 pl-3">
                          {materiel.description}
                        </p>
                      ) : (
                        <p className="text-xs font-mono text-slate-400 dark:text-slate-600 italic mt-3 border-l-2 border-slate-200 dark:border-slate-850 pl-3">
                          Aucun descriptif technique fourni pour ce matériel logistique.
                        </p>
                      )}
                    </div>
                    
                    {/* Readout Panels Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                      <InfoBlock label="Catégorie" value={materiel?.categorie_nom} icon="category" />
                      <InfoBlock label="Affectation" value={materiel?.eglise_nom} icon="home" />
                      <InfoBlock label="Quantité" value={materiel?.quantite} icon="inventory_2" />
                      <InfoBlock label="Mouvements" value={`${materiel?.mouvements_count || 0} TOTAL`} icon="swap_horiz" />
                      <InfoBlock label="Signalements" value={`${materiel?.defauts_count || 0} LOGS`} icon="warning" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Segmented Control / Dynamic Tabs Panel */}
              <div className="bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200/60 dark:border-slate-900 flex flex-col md:flex-row gap-1">
                {[
                  { key: 'movements',   label: 'Historique des Mouvements', icon: 'swap_horiz' },
                  { key: 'maintenance', label: 'Journal de Maintenance', icon: 'build' },
                  { key: 'defects',     label: 'Signalements de Pannes', icon: 'report_problem' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex-1 py-3 px-4 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-150 rounded-none active:scale-[0.98] ${
                      activeTab === tab.key
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/55 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Viewport Frame */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 shadow-xs overflow-hidden">
                
                {/* Tab: Movements */}
                {activeTab === 'movements' && (
                  <div>
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/10">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-slate-900 dark:bg-white"></span>
                        <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">LEDGER - LOGISTIQUE DE TRANSFERT</h3>
                      </div>
                      <Link to="/movements" className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 font-mono text-[10px] uppercase font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-1">
                        Voir Tout <span className="material-symbols-outlined text-[10px] font-black">arrow_right_alt</span>
                      </Link>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-900">
                            <th className="px-6 py-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Horodatage</th>
                            <th className="px-6 py-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Vecteur d'Origine / Destination</th>
                            <th className="px-6 py-3 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Responsable Signataire</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-mono">
                          {movements.length === 0 ? (
                            <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-mono tracking-wide uppercase">Aucun transfert consigné dans la base.</td></tr>
                          ) : movements.map(mv => (
                            <tr key={mv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap font-bold">
                                {new Date(mv.date_mouvement).toLocaleDateString('fr-FR', {
                                  year: 'numeric', month: '2-digit', day: '2-digit'
                                })}
                              </td>
                              <td className="px-6 py-4"><MovementTypeBadge type={mv.type_mouvement} /></td>
                              <td className="px-6 py-4 text-slate-900 dark:text-slate-300">
                                <span className="font-bold">{mv.eglise_origine_nom || '?'}</span> 
                                <span className="mx-2 text-slate-400">→</span> 
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {mv.eglise_destination_nom || mv.evenement_titre || 'Siège central'}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-400 uppercase">{mv.responsable_nom || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Maintenance */}
                {activeTab === 'maintenance' && (
                  <div className="p-6 space-y-4">
                    {defects.filter(d => d.repare).length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800">
                        <span className="material-symbols-outlined text-4xl block mb-2 text-slate-400">build_circle</span>
                        <p className="font-mono text-xs uppercase tracking-wider text-slate-500">Aucun cycle de maintenance consigné.</p>
                      </div>
                    ) : defects.filter(d => d.repare).map(d => (
                      <div key={d.id} className="border border-slate-100 dark:border-slate-900 p-4 bg-slate-50/50 dark:bg-slate-900/20 flex items-start gap-4 hover:bg-slate-100/70 dark:hover:bg-slate-900/40 hover:shadow-xs transition-all">
                        <div className="size-9 bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white shrink-0">
                          <span className="material-symbols-outlined text-sm font-black">build</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <p className="font-mono font-bold text-sm text-slate-900 dark:text-white uppercase">{d.description?.substring(0, 50) || 'INTERVENTION TECHNIQUE'}</p>
                            <span className="text-[9px] font-mono bg-emerald-500 text-white px-2 py-0.5 font-bold uppercase tracking-wider">RESOLU</span>
                          </div>
                          <p className="text-[10px] font-mono text-slate-500">
                            INTERVENTION EFFECTUEE LE : {new Date(d.date_signalement).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs font-mono text-slate-600 dark:text-slate-400 pt-2 leading-relaxed">{d.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: Defects */}
                {activeTab === 'defects' && (
                  <div className="p-6 space-y-4">
                    {defects.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800">
                        <span className="material-symbols-outlined text-4xl block mb-2 text-emerald-500">check_circle</span>
                        <p className="font-mono text-xs uppercase tracking-wider text-slate-500">Intégrité matérielle intacte. Zéro panne signalée.</p>
                      </div>
                    ) : defects.map(d => (
                      <div key={d.id} className="border border-slate-100 dark:border-slate-900 p-4 bg-slate-50/50 dark:bg-slate-900/20 flex items-start gap-4 hover:bg-slate-100/70 dark:hover:bg-slate-900/40 hover:shadow-xs transition-all">
                        <div className={`size-9 flex items-center justify-center text-white shrink-0 ${
                          d.niveau_gravite === 'Critical' ? 'bg-red-500 border-red-600' : 'bg-amber-500 border-amber-600'
                        }`}>
                          <span className="material-symbols-outlined text-sm font-black">report_problem</span>
                        </div>
                        <div className="space-y-1 w-full">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-mono font-bold text-sm text-slate-900 dark:text-white uppercase">{d.description?.substring(0, 50) || 'INCIDENT DECLARE'}</p>
                            <div className="flex gap-2">
                              <span className={`text-[9px] font-mono px-2 py-0.5 font-bold uppercase tracking-wider ${
                                d.niveau_gravite === 'Critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                              }`}>{d.niveau_gravite || 'Moyen'}</span>
                              {d.repare ? (
                                <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-500 text-white font-bold uppercase tracking-wider">CORRIGÉ</span>
                              ) : (
                                <span className="text-[9px] font-mono px-2 py-0.5 bg-red-950 text-red-300 font-bold uppercase tracking-wider animate-pulse">ACTIF</span>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] font-mono text-slate-500">
                            DECLARATION LOGUEE LE : {new Date(d.date_signalement).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs font-mono text-slate-600 dark:text-slate-400 pt-2 leading-relaxed">{d.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tab Footer: Last Technical Maintenance Info */}
              {activeTab === 'movements' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-6 shadow-xs">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-base font-black text-slate-950 dark:text-white">build</span>
                    <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">Dernière Maintenance Diagnostic</h3>
                  </div>
                  {defects.filter(d => d.repare).length > 0 ? (
                    defects.filter(d => d.repare).slice(0, 1).map(d => (
                      <div key={d.id} className="flex items-start gap-4 p-4 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="size-9 bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white font-mono text-sm shrink-0 font-bold">DX</div>
                        <div>
                          <p className="font-mono font-bold text-xs uppercase text-slate-900 dark:text-white">INTERVENTION DE MAINTENANCE RELEVEE</p>
                          <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                            Validé en service le {new Date(d.date_signalement).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{d.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-4 p-4 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/20">
                      <div className="size-9 bg-slate-900 dark:bg-slate-800 flex items-center justify-center text-white font-mono text-sm shrink-0 font-bold">DX</div>
                      <div className="space-y-1">
                        <p className="font-mono font-bold text-xs uppercase text-slate-900 dark:text-white">NETTOYAGE & CONTROLE DE RUTILISATION</p>
                        <p className="text-[9px] font-mono text-slate-500">Alerte de routine : Aucune anomalie active consignée.</p>
                        <p className="text-xs font-mono text-slate-600 dark:text-slate-400 pt-1 leading-relaxed">
                          La révision périodique de cet équipement est déclarée conforme. Si un problème survient, veuillez utiliser le module de panne rapide.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── Right Column (Stamps & Controllers) ── */}
            <div className="space-y-8">

               {/* Physical Stamp QR Card with peeling outline */}
               <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-6 shadow-xs flex flex-col items-center relative overflow-hidden">
                 <h3 className="font-mono font-bold text-xs uppercase tracking-widest text-slate-900 dark:text-white mb-5 w-full text-center border-b border-slate-100 dark:border-slate-900 pb-2">
                   Étiquette QR Physique
                 </h3>
                 
                 <div 
                   onClick={() => setIsQrModalOpen(true)}
                   className="w-full aspect-square bg-white dark:bg-slate-950 p-4 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col justify-between items-center relative group cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-all"
                 >
                   {/* Brand bar */}
                   <div className="w-full flex justify-between items-center text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-900 pb-1.5 pointer-events-none">
                     <span className="text-[8px] font-mono font-bold uppercase tracking-widest">SGL-CI LOGISTICS</span>
                     <span className="text-[7px] font-mono font-bold bg-slate-900 dark:bg-slate-800 text-white px-1 py-0.2 uppercase">STAMP</span>
                   </div>

                   {/* QR Code Graphic Area */}
                   <div className="size-36 p-1 bg-white border border-slate-100 flex items-center justify-center relative shrink-0">
                     {materiel?.qr_code ? (
                       <img src={materiel.qr_code} alt="QR Code d'équipement" className="w-full h-full object-contain" />
                     ) : (
                       <div className="flex flex-col items-center gap-1.5 text-center text-slate-400">
                         <span className="material-symbols-outlined text-4xl">qr_code_2</span>
                         <span className="text-[8px] font-mono uppercase tracking-widest">GENERATING LABELS</span>
                       </div>
                     )}
                     
                     {/* Overlay print trigger display */}
                     <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="material-symbols-outlined text-white text-3xl animate-bounce">print</span>
                       <span className="font-mono text-[9px] text-white uppercase tracking-widest font-bold mt-1">Imprimer</span>
                     </div>
                   </div>

                   {/* Mock Barcode for High Aesthetics */}
                   <div className="w-full flex flex-col items-center gap-0.5 mt-2 pointer-events-none">
                     <svg className="w-32 h-6 text-slate-900 dark:text-white fill-current opacity-70" viewBox="0 0 100 20">
                       {/* Alternating lines to represent authentic barcode */}
                       <rect x="0" y="0" width="2" height="20" />
                       <rect x="4" y="0" width="1" height="20" />
                       <rect x="7" y="0" width="3" height="20" />
                       <rect x="12" y="0" width="1" height="20" />
                       <rect x="15" y="0" width="2" height="20" />
                       <rect x="19" y="0" width="4" height="20" />
                       <rect x="25" y="0" width="1" height="20" />
                       <rect x="28" y="0" width="2" height="20" />
                       <rect x="32" y="0" width="3" height="20" />
                       <rect x="37" y="0" width="1" height="20" />
                       <rect x="40" y="0" width="2" height="20" />
                       <rect x="44" y="0" width="4" height="20" />
                       <rect x="50" y="0" width="1" height="20" />
                       <rect x="53" y="0" width="3" height="20" />
                       <rect x="58" y="0" width="2" height="20" />
                       <rect x="62" y="0" width="1" height="20" />
                       <rect x="65" y="0" width="4" height="20" />
                       <rect x="71" y="0" width="2" height="20" />
                       <rect x="75" y="0" width="3" height="20" />
                       <rect x="80" y="0" width="1" height="20" />
                       <rect x="83" y="0" width="2" height="20" />
                       <rect x="87" y="0" width="4" height="20" />
                       <rect x="93" y="0" width="1" height="20" />
                       <rect x="96" y="0" width="3" height="20" />
                     </svg>
                     <p className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                       {materiel?.identifiant_unique || `EQ-${id}-SGL-CI`}
                     </p>
                   </div>
                 </div>

                 <button
                   onClick={() => setIsQrModalOpen(true)}
                   className="mt-4 w-full py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-mono text-xs uppercase tracking-widest font-black shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                 >
                   <span className="material-symbols-outlined text-sm font-black">print</span>
                   Lancer l'impression
                 </button>
               </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-6 shadow-sm">
                <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-4">
                  Commandes Rapides
                </h3>
                <div className="space-y-4">
                  <Link
                    to={`/movements?addItemId=${id}`}
                    className="w-full h-12 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-[0.98] transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">swap_horiz</span>
                    INITIER UN MOVEMENT
                  </Link>
                  <button
                    onClick={() => setIsDefectModalOpen(true)}
                    className="w-full h-12 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 font-mono text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">report_problem</span>
                    SIGNALER UNE PANNE
                  </button>
                </div>
              </div>

              {/* Telemetry widget */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-900 p-6 shadow-sm relative overflow-hidden">
                <h3 className="font-mono font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white mb-4">
                  Géolocalisation & Télémetrie
                </h3>
                
                <div className="h-44 bg-slate-950 border border-slate-800 relative flex items-center justify-center overflow-hidden">
                  
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, #10b981 0, #10b981 1px, transparent 0, transparent 20px), repeating-linear-gradient(90deg, #10b981 0, #10b981 1px, transparent 0, transparent 20px)',
                    backgroundSize: '20px 20px'
                  }} />

                  {/* High Tech Vector Map Overlay */}
                  <svg className="absolute inset-0 w-full h-full text-emerald-500/20 stroke-current fill-none pointer-events-none" viewBox="0 0 200 100">
                    {/* Simulated topology lines */}
                    <path d="M 0,40 Q 40,20 80,45 T 160,30 T 200,60" strokeWidth="0.5" strokeDasharray="3 3" />
                    <path d="M 0,60 Q 50,75 100,55 T 180,80 T 200,70" strokeWidth="0.5" strokeDasharray="1 4" />
                    {/* Radar scan concentric circles */}
                    <circle cx="100" cy="50" r="25" strokeWidth="0.5" strokeDasharray="2" />
                    <circle cx="100" cy="50" r="45" strokeWidth="0.5" />
                    <circle cx="100" cy="50" r="65" strokeWidth="0.5" strokeDasharray="4 4" />
                    
                    {/* Spinning radar swept angle */}
                    <g transform="translate(100, 50)" className="animate-[sweep-spin_6s_infinite_linear]">
                      <path d="M 0,0 L 70,-40" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1.5" />
                      <polygon points="0,0 70,-40 75,-20" fill="rgba(16, 185, 129, 0.08)" />
                    </g>
                    
                    {/* Simulated site target points */}
                    <circle cx="45" cy="30" r="2" fill="#10b981" />
                    <text x="50" y="32" fill="#10b981" fontSize="5" fontFamily="monospace" opacity="0.6">AN-A</text>
                    <circle cx="150" cy="65" r="2" fill="#10b981" />
                    <text x="155" y="67" fill="#10b981" fontSize="5" fontFamily="monospace" opacity="0.6">CP-D</text>
                  </svg>
                  
                  {/* Central glowing target reticle */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="relative size-10 flex items-center justify-center">
                      <span className="absolute inset-0 rounded-full bg-emerald-500/20 border border-emerald-500 animate-[radar-pulse_2s_infinite_ease-out]" />
                      <span className="absolute size-5 rounded-full bg-emerald-500/30 border-2 border-emerald-400" />
                      <span className="absolute size-1.5 rounded-full bg-emerald-400" />
                      <span className="material-symbols-outlined text-white text-xs font-black drop-shadow-[0_0_4px_#10b981]">location_on</span>
                    </div>
                  </div>

                  {/* Corner telemetry coordinates readouts */}
                  <div className="absolute bottom-2 left-2 text-[8px] font-mono text-emerald-500/80 bg-slate-950/80 px-1.5 py-0.5 border border-emerald-500/10 select-none">
                    LAT: 5.3484 N / LON: 4.0244 W
                  </div>
                  <div className="absolute top-2 right-2 text-[8px] font-mono text-emerald-500/80 bg-slate-950/80 px-1.5 py-0.5 border border-emerald-500/10 select-none">
                    SYS: ACTIF
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <span className="material-symbols-outlined text-slate-900 dark:text-slate-400 text-sm font-black">home_pin</span>
                  <p className="text-xs font-mono font-bold uppercase text-slate-900 dark:text-white">
                    AFFECTATION : {materiel?.eglise_nom || 'Siège logistique central'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Formulaire de modification */}
      {isFormModalOpen && (
        <MaterielFormModal item={materiel} onClose={() => setIsFormModalOpen(false)} />
      )}

      {/* Confirmation de suppression */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 relative flex flex-col rounded-none shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-red-500 text-2xl animate-pulse">warning</span>
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-900 dark:text-white">Attention : Action Irréversible</h3>
            </div>

            {/* Content */}
            <div className="space-y-3 my-2 text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>Vous êtes sur le point de supprimer définitivement le matériel logistique suivant de l'inventaire actif :</p>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 border-l-2 border-red-500 flex flex-col gap-1">
                <span className="font-bold text-slate-900 dark:text-white uppercase">{materiel?.nom}</span>
                <span className="text-[10px] text-slate-500">ID : {materiel?.identifiant_unique || `EQ-${id}`}</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-red-500">
                Remarque : Cette action le masquera de la console mais préservera les journaux historiques de transfert.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)} 
                disabled={deleteMutation.isPending}
                className="h-11 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-300 font-mono font-bold uppercase tracking-widest text-[10px] rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button 
                onClick={() => deleteMutation.mutate()} 
                disabled={deleteMutation.isPending}
                className="h-11 bg-red-600 hover:bg-red-700 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-none active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Suppression..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* High Contrast printable label generation modal */}
      {isQrModalOpen && (
        <QrPrintModal item={materiel} onClose={() => setIsQrModalOpen(false)} />
      )}

      {/* Lightbox / Visionneuse Plein Écran */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 no-print"
            onClick={handleBackdropClick}
          >
            {/* Minimalist Close button [ FERMER ] */}
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-6 right-6 border border-slate-800 bg-slate-950 text-slate-400 font-mono text-[10px] uppercase font-bold tracking-widest py-2 px-4 hover:border-white hover:text-white transition-all duration-150 rounded-none cursor-pointer active:scale-95"
            >
              [ FERMER ]
            </button>

            {/* Counter indicator */}
            <div className="absolute top-6 left-6 font-mono text-[10px] text-slate-500 uppercase tracking-widest font-bold hidden md:block">
              FICHE TECHNIQUE VISUELLE — IMAGE {String(lightboxImageIndex + 1).padStart(2, '0')} / {String(allImages.length).padStart(2, '0')}
            </div>

            {/* Main Centered Image Container */}
            <div 
              className="relative flex items-center justify-center max-w-[85vw] max-h-[70vh] touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Left Navigation Arrow */}
              {allImages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                  className="absolute -left-16 md:-left-20 top-1/2 -translate-y-1/2 w-10 h-10 border border-slate-850 bg-slate-950/60 text-slate-400 hover:text-white hover:border-white hover:bg-slate-900 transition-all flex items-center justify-center rounded-none cursor-pointer select-none active:scale-90"
                >
                  <span className="material-symbols-outlined text-[15px] font-black">arrow_back_ios_new</span>
                </button>
              )}

              {/* High resolution image with transition */}
              <motion.img
                key={lightboxImageIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                src={allImages[lightboxImageIndex]?.image}
                alt="Matériel grand format"
                draggable="false"
                className="max-w-[75vw] max-h-[65vh] md:max-w-[80vw] md:max-h-[70vh] object-contain border border-slate-800 bg-slate-900/40 p-1.5 shadow-2xl select-none"
              />

              {/* Right Navigation Arrow */}
              {allImages.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                  className="absolute -right-16 md:-right-20 top-1/2 -translate-y-1/2 w-10 h-10 border border-slate-850 bg-slate-950/60 text-slate-400 hover:text-white hover:border-white hover:bg-slate-900 transition-all flex items-center justify-center rounded-none cursor-pointer select-none active:scale-90"
                >
                  <span className="material-symbols-outlined text-[15px] font-black">arrow_forward_ios</span>
                </button>
              )}
            </div>

            {/* Thumbnail Navigation Row */}
            {allImages.length > 1 && (
              <div className="absolute bottom-8 flex gap-2 bg-slate-950/40 p-1.5 border border-slate-900/60 backdrop-blur-xs max-w-[90vw] overflow-x-auto">
                {allImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={(e) => { e.stopPropagation(); setLightboxImageIndex(idx); }}
                    className={`w-11 h-11 p-0.5 border rounded-none overflow-hidden transition-all duration-150 active:scale-95 cursor-pointer shrink-0 ${
                      lightboxImageIndex === idx
                        ? 'border-emerald-500 ring-1 ring-emerald-500'
                        : 'border-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <img src={img.image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isDefectModalOpen && (
        <DefectReportModal item={materiel} onClose={() => setIsDefectModalOpen(false)} />
      )}
    </Layout>
  );
};

const QrPrintModal = ({ item, onClose }) => {
  if (!item) return null;
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/qr-transit/' + item.id)}`;

  const handleDownloadQr = () => {
    const qrUrl = item.qr_code || qrDataUrl;
    if (!qrUrl) return;

    fetch(qrUrl)
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const filename = `QR_${item.identifiant_unique || 'EQUIPEMENT'}_${item.nom?.replace(/\s+/g, '_')}.png`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(error => {
        const a = document.createElement('a');
        a.href = qrUrl;
        a.download = `QR_${item.identifiant_unique || 'EQUIPEMENT'}.png`;
        a.target = '_blank';
        a.click();
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 no-print">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-qr-card, #printable-qr-card * {
            visibility: visible !important;
          }
          #printable-qr-card {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 70mm !important;
            height: 70mm !important;
            border: none !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            align-items: center !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-6 relative flex flex-col rounded-none shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6">
          <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-900 dark:text-white">Générateur d'Étiquette QR</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-lg font-black">close</span>
          </button>
        </div>

        {/* Asymmetrical Printable QR Card */}
        <div 
          id="printable-qr-card" 
          className="bg-slate-50 dark:bg-slate-800/40 p-4 flex flex-col items-center justify-between gap-4 text-slate-900 dark:text-slate-100"
        >
          {/* Brand header */}
          <div className="w-full flex justify-between items-center pb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 font-mono">SGL-CI LOGISTICS</span>
            <span className="text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider bg-slate-900 dark:bg-slate-700 text-white font-mono">MATÉRIEL</span>
          </div>

          {/* Core Content */}
          <div className="flex flex-col items-center gap-3 py-2 w-full text-center">
            {/* QR Image */}
            <div className="size-36 bg-white p-2 flex items-center justify-center shrink-0">
              <img 
                src={item.qr_code || qrDataUrl} 
                alt="QR Code d'équipement" 
                className="w-full h-full object-contain" 
              />
            </div>
            
            {/* Metadata info */}
            <div className="space-y-1 w-full">
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate">{item.nom}</h4>
              <p className="text-[10px] font-mono text-slate-500 uppercase">{item.categorie_nom || "Équipement"}</p>
              <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate">{item.eglise_nom || "Siège National"}</p>
            </div>
          </div>

          {/* Footer Identifier Bar */}
          <div className="w-full bg-slate-900 text-white py-1.5 px-3 flex items-center justify-center rounded-none font-mono text-xs tracking-wider font-bold">
            {item.identifiant_unique || `EQ-${String(item.id).padStart(5, '0')}`}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <button 
            onClick={onClose} 
            className="h-11 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-350 font-mono text-[9px] font-bold uppercase tracking-wider rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button 
            onClick={handleDownloadQr} 
            className="h-11 border border-slate-900 dark:border-white text-slate-900 dark:text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-none hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Télécharger
          </button>
          <button 
            onClick={() => window.print()} 
            className="h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-mono text-[9px] font-bold uppercase tracking-wider rounded-none hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm font-black">print</span>
            Imprimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetail;
