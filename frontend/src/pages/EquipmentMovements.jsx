import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { logisticsService } from '../services/api';
import QrScannerModal from '../components/QrScannerModal';

// ─── Sub-components ──────────────────────────────────────────────────────────

const MovementStatusBadge = ({ status }) => {
  const styles = {
    'IN':         'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/40',
    'OUT':        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40',
    'PRET':       'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/40',
    'default':    'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/40',
  };
  const labels = { IN: 'Reçu', OUT: 'En Transit', PRET: 'En Cours' };
  const cls = styles[status] || styles.default;
  return (
    <span className={`px-2 py-0.5 border font-mono text-[9px] font-bold uppercase rounded-none tracking-wider ${cls}`}>
      {labels[status] || status}
    </span>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded-none border border-slate-200 dark:border-slate-800 shadow-none flex flex-col gap-1">
    <p className="text-[10px] font-mono font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const EquipmentMovements = () => {
  const queryClient = useQueryClient();

  // Tab state: 'checkout' | 'checkin'
  const [activeTab, setActiveTab] = useState('checkout');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Form state
  const [destination, setDestination] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // URL search query integration
  const [searchParams, setSearchParams] = useSearchParams();
  const addItemId = searchParams.get('addItemId');
  const addItemIds = searchParams.get('addItemIds');

  // Preload equipment if addItemId or addItemIds is present
  const idsToPreload = [];
  if (addItemIds) {
    idsToPreload.push(...addItemIds.split(',').filter(Boolean));
  } else if (addItemId) {
    idsToPreload.push(addItemId);
  }
  const preloadKey = idsToPreload.join(',');

  const { data: preloadedItems } = useQuery({
    queryKey: ['materiels-preload', preloadKey],
    queryFn: async () => {
      if (idsToPreload.length === 0) return [];
      const promises = idsToPreload.map(id => logisticsService.getMaterielById(id).then(r => r.data));
      return Promise.all(promises);
    },
    enabled: idsToPreload.length > 0,
  });

  useEffect(() => {
    if (preloadedItems && preloadedItems.length > 0) {
      setSelectedItems(prev => {
        const newItems = [...prev];
        preloadedItems.forEach(item => {
          if (!newItems.some(i => i.id === item.id)) {
            newItems.push({ ...item, selectedQuantity: 1 });
          }
        });
        return newItems;
      });
      // Clean query parameters to prevent duplicate preloads on re-renders/refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('addItemId');
      newParams.delete('addItemIds');
      setSearchParams(newParams, { replace: true });
    }
  }, [preloadedItems, searchParams, setSearchParams]);

  // ── Data queries ─────────────────────────────────────────────────────────
  const { data: movementsData, isLoading: movementsLoading, isPlaceholderData } = useQuery({
    queryKey: ['movements', page],
    queryFn: () => logisticsService.getMovements({ page }).then(r => r.data),
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000
  });

  const { data: materielsData } = useQuery({
    queryKey: ['materiels-search', searchQuery],
    queryFn: () => logisticsService.getMateriels({ search: searchQuery, limit: 10 }).then(r => r.data),
    enabled: searchQuery.length >= 2,
  });

  const { data: evenementsData } = useQuery({
    queryKey: ['evenements'],
    queryFn: () => logisticsService.getEvenements({ limit: 100 }).then(r => r.data),
  });

  const { data: staffData } = useQuery({
    queryKey: ['staff'],
    queryFn: () => logisticsService.getMembers().then(r => r.data),
  });

  // ── Mutation ──────────────────────────────────────────────────────────────
  const confirmMutation = useMutation({
    mutationFn: () => {
      const batchId = `MVT-${Date.now()}`;
      const promises = selectedItems.map(item =>
        logisticsService.postMovement({
          materiel: item.id,
          type_mouvement: activeTab === 'checkout' ? 'OUT' : 'IN',
          eglise_origine: 1, // TODO: from session user's church
          batch_id: batchId,
          quantite: item.selectedQuantity || 1,
          evenement: destination || null,
          responsable: responsableId || null,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSelectedItems([]);
      toast.success('Mouvements enregistrés avec succès !');
    },
    onError: (err) => {
      toast.error(`Erreur lors de la confirmation : ${err.message}`);
    }
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isPaginated = !Array.isArray(movementsData) && movementsData?.results;
  const movements = isPaginated ? movementsData.results : (Array.isArray(movementsData) ? movementsData : []);
  const totalCount = isPaginated ? movementsData.count : movements.length;
  const totalPages = isPaginated ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  const searchResults = materielsData?.results || [];
  const evenements = evenementsData?.results || evenementsData || [];
  const members = staffData?.results || staffData || [];

  const addItem = (item) => {
    if (!selectedItems.find(i => i.id === item.id)) {
      setSelectedItems([...selectedItems, { ...item, selectedQuantity: 1 }]);
    }
    setSearchQuery('');
  };

  const removeItem = (id) => setSelectedItems(selectedItems.filter(i => i.id !== id));

  const handleQrScanSuccess = (itemId) => {
    const alreadySelected = selectedItems.find(item => item.id === itemId);
    if (alreadySelected) {
      updateItemQuantity(itemId, (alreadySelected.selectedQuantity || 1) + 1);
      toast.success(`Quantité de "${alreadySelected.nom}" incrémentée.`);
      return;
    }

    logisticsService.getMaterielById(itemId)
      .then(res => {
        const item = res.data;
        if (item) {
          setSelectedItems(prev => {
            if (!prev.some(i => i.id === item.id)) {
              return [...prev, { ...item, selectedQuantity: 1 }];
            }
            return prev;
          });
          toast.success(`Matériel "${item.nom}" ajouté.`);
        }
      })
      .catch(err => {
        console.error('Failed to fetch equipment details for QR code:', err);
        toast.error(`Erreur d'acquisition : matériel ID #${itemId} introuvable.`);
      });
  };

  const updateItemQuantity = (id, newQty) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.id === id) {
        const maxQty = activeTab === 'checkout' ? (item.quantite !== undefined ? item.quantite : 9999) : 9999;
        const minQty = maxQty === 0 ? 0 : 1;
        const qty = Math.max(minQty, Math.min(newQty, maxQty));
        return { ...item, selectedQuantity: qty };
      }
      return item;
    }));
  };

  const isFormValid = () => {
    if (selectedItems.length === 0) return false;
    if (!destination) return false;
    if (!responsableId) return false;
    
    if (activeTab === 'checkout') {
      const hasInvalidItem = selectedItems.some(item => {
        const qty = item.selectedQuantity || 1;
        const stock = item.quantite !== undefined ? item.quantite : 0;
        return qty <= 0 || qty > stock;
      });
      if (hasInvalidItem) return false;
    }
    return true;
  };

  const inTransitCount = movements.filter(m => m.type_mouvement === 'OUT').length;
  const pendingReturnCount = movements.filter(m => m.type_mouvement === 'PRET').length;

  // ─ Time display helper
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header title="Mouvements de Matériel" />

        <div className="flex-1 max-w-[1280px] w-full mx-auto p-6 md:p-10 pb-24">
          
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase font-mono">Contrôle des Flux</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-mono text-xs">Traitement unifié des expéditions et des retours d'équipements.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Left Column: Check-out / Check-in form ── */}
            <div className="flex-1 space-y-8">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden rounded-none shadow-none">

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 font-mono text-xs">
                  <button
                    onClick={() => {
                      setActiveTab('checkout');
                      // Reset selected items quantities based on new context
                      setSelectedItems(prev => prev.map(item => ({ ...item, selectedQuantity: 1 })));
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'checkout'
                        ? 'border-b-2 border-primary bg-slate-50 dark:bg-slate-950 text-primary'
                        : 'border-b-2 border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-855'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">outbound</span>
                    SORTIE (CHECK-OUT)
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('checkin');
                      setSelectedItems(prev => prev.map(item => ({ ...item, selectedQuantity: 1 })));
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-black uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'checkin'
                        ? 'border-b-2 border-primary bg-slate-50 dark:bg-slate-950 text-primary'
                        : 'border-b-2 border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-855'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">hail</span>
                    ENTRÉE (CHECK-IN)
                  </button>
                </div>

                <div className="p-6 space-y-6">

                  {/* Destination + Responsible */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
                        {activeTab === 'checkout' ? 'Destination (Événement)' : 'Origine (Événement)'}
                      </label>
                      <div className="relative">
                        <select
                          value={destination}
                          onChange={e => setDestination(e.target.value)}
                          className="w-full h-12 rounded-none border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-0 focus:outline-none appearance-none px-4 text-xs font-mono text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                        >
                          <option value="" className="bg-white dark:bg-slate-900">Sélectionner un événement</option>
                          {evenements.map(ev => (
                            <option key={ev.id} value={ev.id} className="bg-white dark:bg-slate-900">{ev.titre}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 pointer-events-none text-lg">expand_more</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Responsable du mouvement</label>
                      <div className="relative">
                        <select
                          value={responsableId}
                          onChange={e => setResponsableId(e.target.value)}
                          className="w-full h-12 rounded-none border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-0 focus:outline-none appearance-none px-4 text-xs font-mono text-slate-800 dark:text-slate-200 transition-all cursor-pointer"
                        >
                          <option value="" className="bg-white dark:bg-slate-900">Sélectionner le personnel</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900">{m.first_name} {m.last_name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3.5 text-slate-400 pointer-events-none text-lg">person_search</span>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Search */}
                  <div className="space-y-3 relative">
                    <label className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Ajouter du Matériel</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-3.5 text-slate-400 text-lg">search</span>
                        <input
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full h-12 pl-10 rounded-none border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 focus:ring-0 focus:outline-none text-xs font-mono placeholder:text-slate-400 text-slate-800 dark:text-slate-200 transition-all"
                          placeholder="Recherche par nom ou identifiant..."
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="h-12 px-5 flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-none hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
                        <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider">Scanner QR</span>
                      </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {searchQuery.length >= 2 && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-none shadow-none overflow-hidden font-mono text-xs" style={{top:'100%'}}>
                        {searchResults.slice(0, 6).map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => addItem(item)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 text-left border-b border-slate-100 dark:border-slate-850 last:border-0 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="size-8 shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 rounded-none overflow-hidden">
                                {item.images_materiel && item.images_materiel.length > 0 ? (
                                  <img src={item.images_materiel[0].image} alt={item.nom} className="size-full object-cover" />
                                ) : item.image ? (
                                  <img src={item.image} alt={item.nom} className="size-full object-cover" />
                                ) : (
                                  <div className="size-full flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-xs">inventory_2</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{item.nom}</p>
                                <p className="text-[10px] text-slate-500">{item.identifiant_unique || `EQ-${item.id}`}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                Stock: {item.quantite}
                              </span>
                              <span className="material-symbols-outlined text-primary text-lg">add_circle</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Items List */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-none overflow-hidden bg-slate-50 dark:bg-slate-955/20">
                    <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center font-mono text-[10px]">
                      <span className="font-black uppercase tracking-wider text-slate-500">
                        MATÉRIEL PRÉPARÉ ({selectedItems.length})
                      </span>
                      {selectedItems.length > 0 && (
                        <button 
                          type="button"
                          onClick={() => setSelectedItems([])} 
                          className="font-bold text-red-500 hover:underline cursor-pointer uppercase"
                        >
                          Effacer tout
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-80 overflow-y-auto">
                      {selectedItems.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-mono">
                          <span className="material-symbols-outlined text-4xl block mb-2">inventory_2</span>
                          <p className="text-xs uppercase font-bold tracking-wider">Aucun matériel sélectionné</p>
                          <p className="text-[10px] mt-1 text-slate-500">Recherchez ou sélectionnez des équipements à traiter</p>
                        </div>
                      ) : selectedItems.map(item => {
                        const hasStockLimit = activeTab === 'checkout';
                        const isStockEmpty = hasStockLimit && (item.quantite === undefined || item.quantite <= 0);
                        const selectedQty = item.selectedQuantity || 1;
                        const stock = item.quantite !== undefined ? item.quantite : 0;
                        const isOverStock = hasStockLimit && selectedQty > stock;

                        return (
                          <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              {/* Visual Thumbnail */}
                              <div className="size-10 shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 rounded-none overflow-hidden">
                                {item.images_materiel && item.images_materiel.length > 0 ? (
                                  <img src={item.images_materiel[0].image} alt={item.nom} className="size-full object-cover" />
                                ) : item.image ? (
                                  <img src={item.image} alt={item.nom} className="size-full object-cover" />
                                ) : (
                                  <div className="size-full flex items-center justify-center text-slate-400">
                                    <span className="material-symbols-outlined text-lg">inventory_2</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">{item.nom}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-500 font-mono tracking-wider">{item.identifiant_unique || `EQ-${item.id}`}</span>
                                  <span className="text-[10px] text-slate-300 dark:text-slate-800">•</span>
                                  <span className={`text-[10px] px-1.5 py-0.2 font-mono ${
                                    isStockEmpty 
                                      ? 'bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-400 font-bold' 
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400'
                                  }`}>
                                    {isStockEmpty ? 'Rupture de Stock' : `Stock: ${item.quantite}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                              {/* Quantity Selector */}
                              <div className={`flex items-center border rounded-none h-8 font-mono select-none ${
                                isOverStock
                                  ? 'border-red-500 bg-red-50/10'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-955'
                              }`}>
                                <button
                                  type="button"
                                  onClick={() => updateItemQuantity(item.id, selectedQty - 1)}
                                  disabled={selectedQty <= 1}
                                  className="w-8 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm font-black">remove</span>
                                </button>
                                <div className="w-10 text-center text-xs font-bold text-slate-800 dark:text-slate-200 border-x border-slate-150 dark:border-slate-800/80 h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
                                  {selectedQty}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => updateItemQuantity(item.id, selectedQty + 1)}
                                  disabled={hasStockLimit && selectedQty >= stock}
                                  className="w-8 h-full flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-20 transition-colors cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-sm font-black">add</span>
                                </button>
                              </div>

                              {/* Delete Action */}
                              <button 
                                type="button"
                                onClick={() => removeItem(item.id)} 
                                className="size-8 flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:border-red-500/25 active:scale-95 transition-all rounded-none cursor-pointer"
                                title="Retirer"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => confirmMutation.mutate()}
                      disabled={confirmMutation.isPending || !isFormValid()}
                      className="flex-1 h-14 bg-primary hover:bg-primary/95 text-white font-mono text-xs font-black uppercase tracking-widest rounded-none transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {confirmMutation.isPending ? (
                        <>
                          <div className="size-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                          <span>ENREGISTREMENT...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm font-black">check_circle</span>
                          <span>CONFIRMER LE MOUVEMENT</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItems([])}
                      disabled={selectedItems.length === 0}
                      className="h-14 px-8 border border-slate-200 dark:border-slate-800 font-mono text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all rounded-none cursor-pointer disabled:opacity-20 active:scale-95"
                    >
                      EFFACER TOUT
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right Column: Stats & Recent Movements ── */}
            <div className="lg:w-96 space-y-6">

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="En Transit"     value={inTransitCount}    color="text-primary" />
                <StatCard label="Attente Retour"  value={pendingReturnCount} color="text-orange-500" />
              </div>

              {/* Recent Movements */}
              <div className="bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 overflow-hidden shadow-none">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 font-mono text-xs">
                  <h3 className="font-black uppercase tracking-wider">Mouvements Actifs</h3>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{totalCount} au total</span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {movementsLoading && !isPlaceholderData ? (
                    <div className="p-10 text-center"><div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></div>
                  ) : movements.length === 0 ? (
                    <p className="p-6 text-xs text-center text-slate-400 font-mono uppercase tracking-wider">Aucun mouvement actif.</p>
                  ) : movements.map(mv => (
                    <div key={mv.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-905/40 transition-colors cursor-pointer group">
                      <div className="flex justify-between mb-2">
                        <MovementStatusBadge status={mv.type_mouvement} />
                        <span className="text-[10px] text-slate-500 font-mono">{timeAgo(mv.date_mouvement)}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors tracking-tight">
                        {mv.evenement_titre || mv.eglise_destination_nom || `Lot #${mv.batch_id || mv.id}`}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <span className="material-symbols-outlined text-[14px]">
                          {mv.type_mouvement === 'IN' ? 'warehouse' : 'local_shipping'}
                        </span>
                        {mv.type_mouvement === 'IN' ? 'Entrée' : 'Sortie'} • {mv.materiel_nom}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Mini Pagination for Sidebar */}
                {totalPages > 1 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/20 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 font-mono text-[10px]">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="size-7 flex items-center justify-center rounded-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <span className="font-bold text-slate-500 uppercase">Page {page} / {totalPages}</span>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="size-7 flex items-center justify-center rounded-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Map Widget */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden rounded-none">
                <div
                  className="h-40 relative"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(23,69,207,0.15), rgba(23,69,207,0.15)), url(https://maps.googleapis.com/maps/api/staticmap)',
                    backgroundColor: '#dde7f5',
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-primary text-4xl drop-shadow-none">location_on</span>
                      <div className="bg-white dark:bg-slate-900 px-2 py-0.5 border border-slate-200 dark:border-slate-800 text-[9px] font-mono font-bold uppercase tracking-wider mt-1">Suivi en Direct Actif</div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">Traçabilité de {inTransitCount} véhicules de transport actifs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {isScannerOpen && (
        <QrScannerModal 
          onClose={() => setIsScannerOpen(false)} 
          onScanSuccess={handleQrScanSuccess} 
        />
      )}
    </div>
  );
};

export default EquipmentMovements;
