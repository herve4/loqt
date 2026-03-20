import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { logisticsService } from '../services/api';

// ─── Sub-components ──────────────────────────────────────────────────────────

const MovementStatusBadge = ({ status }) => {
  const styles = {
    'IN':         'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    'OUT':        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'PRET':       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'default':    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  const labels = { IN: 'Reçu', OUT: 'En Transit', PRET: 'En Cours' };
  const cls = styles[status] || styles.default;
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${cls}`}>
      {labels[status] || status}
    </span>
  );
};

const StatCard = ({ label, value, color }) => (
  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
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
          quantite: 1,
          evenement: destination || null,
          responsable: responsableId || null,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['movements']);
      setSelectedItems([]);
      alert('Mouvement confirmé avec succès !');
    },
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
      setSelectedItems([...selectedItems, item]);
    }
    setSearchQuery('');
  };

  const removeItem = (id) => setSelectedItems(selectedItems.filter(i => i.id !== id));

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
        <Header title="Equipment Movements" />

        <div className="flex-1 max-w-[1280px] mx-auto w-full p-6 md:p-10">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* ── Left Column: Check-out / Check-in form ── */}
            <div className="flex-1 space-y-8">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setActiveTab('checkout')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all ${
                      activeTab === 'checkout'
                        ? 'border-b-2 border-primary bg-primary/5 text-primary'
                        : 'border-b-2 border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">outbound</span>
                    Sortie (Expédition)
                  </button>
                  <button
                    onClick={() => setActiveTab('checkin')}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 font-bold transition-all ${
                      activeTab === 'checkin'
                        ? 'border-b-2 border-primary bg-primary/5 text-primary'
                        : 'border-b-2 border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="material-symbols-outlined">hail</span>
                    Entrée (Retour)
                  </button>
                </div>

                <div className="p-6 space-y-6">

                  {/* Destination + Responsible */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {activeTab === 'checkout' ? 'Destination (Événement / Église)' : 'Origine (Événement / Église)'}
                      </label>
                      <div className="relative">
                        <select
                          value={destination}
                          onChange={e => setDestination(e.target.value)}
                          className="w-full h-12 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary appearance-none px-4 text-sm"
                        >
                          <option value="">Sélectionner événement ou église</option>
                          {evenements.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.titre}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none">expand_more</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Responsable</label>
                      <div className="relative">
                        <select
                          value={responsableId}
                          onChange={e => setResponsableId(e.target.value)}
                          className="w-full h-12 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary appearance-none px-4 text-sm"
                        >
                          <option value="">Sélectionner le personnel</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-3 text-slate-400 pointer-events-none">person_search</span>
                      </div>
                    </div>
                  </div>

                  {/* Equipment Search */}
                  <div className="space-y-3 relative">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Ajouter du Matériel</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400">search</span>
                        <input
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="w-full h-12 pl-10 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-primary focus:border-primary text-sm"
                          placeholder="Recherche par nom, catégorie ou ID..."
                        />
                      </div>
                      <button className="h-12 px-6 flex items-center gap-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors">
                        <span className="material-symbols-outlined">qr_code_scanner</span>
                        <span className="hidden sm:inline">Scanner QR</span>
                      </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {searchQuery.length >= 2 && searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden" style={{top:'100%'}}>
                        {searchResults.slice(0, 6).map(item => (
                          <button
                            key={item.id}
                            onClick={() => addItem(item)}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-b border-slate-50 dark:border-slate-800 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.nom}</p>
                              <p className="text-xs text-slate-500 font-mono">{item.identifiant_unique || `EQ-${item.id}`}</p>
                            </div>
                            <span className="material-symbols-outlined text-primary text-xl">add_circle</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Items List */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                    <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Matériel Sélectionné ({selectedItems.length})
                      </span>
                      {selectedItems.length > 0 && (
                        <button onClick={() => setSelectedItems([])} className="text-xs font-bold text-red-500 hover:underline">
                          Effacer Tout
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-64 overflow-y-auto">
                      {selectedItems.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <span className="material-symbols-outlined text-4xl block mb-2">inventory_2</span>
                          <p className="text-sm">Aucun matériel sélectionné.</p>
                          <p className="text-xs mt-1">Recherchez ci-dessus pour ajouter des items.</p>
                        </div>
                      ) : selectedItems.map(item => (
                        <div key={item.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded bg-white dark:bg-slate-700 flex items-center justify-center text-primary border border-slate-200 dark:border-slate-600">
                              <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{item.nom}</p>
                              <p className="text-xs text-slate-500 uppercase font-mono">{item.identifiant_unique || `EQ-${item.id}`}</p>
                            </div>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    <button
                      onClick={() => confirmMutation.mutate()}
                      disabled={confirmMutation.isPending || selectedItems.length === 0}
                      className="flex-1 h-14 bg-primary text-white font-bold rounded-lg shadow-lg shadow-primary/20 hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {confirmMutation.isPending ? 'Confirmation...' : 'Confirmer le Mouvement & Imprimer'}
                    </button>
                    <button
                      onClick={() => setSelectedItems([])}
                      className="h-14 px-8 border border-slate-300 dark:border-slate-700 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Sauvegarder Brouillon
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
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                  <h3 className="font-bold text-sm">Mouvements Actifs</h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{totalCount} au total</span>
                </div>

                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {movementsLoading && !isPlaceholderData ? (
                    <div className="p-10 text-center"><div className="animate-spin size-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div></div>
                  ) : movements.length === 0 ? (
                    <p className="p-6 text-sm text-center text-slate-400">Aucun mouvement actif.</p>
                  ) : movements.map(mv => (
                    <div key={mv.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                      <div className="flex justify-between mb-2">
                        <MovementStatusBadge status={mv.type_mouvement} />
                        <span className="text-[10px] text-slate-400 font-medium">{timeAgo(mv.date_mouvement)}</span>
                      </div>
                      <h4 className="text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                        {mv.evenement_titre || mv.eglise_destination_nom || `Lot #${mv.batch_id || mv.id}`}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
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
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="size-7 flex items-center justify-center rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <span className="text-[10px] font-bold text-slate-500">Page {page} / {totalPages}</span>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="size-7 flex items-center justify-center rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-30"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Map Widget */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div
                  className="h-40 relative"
                  style={{
                    backgroundImage: 'linear-gradient(rgba(23,69,207,0.15), rgba(23,69,207,0.15)), url(https://maps.googleapis.com/maps/api/staticmap)',
                    backgroundColor: '#dde7f5',
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <span className="material-symbols-outlined text-primary text-4xl drop-shadow-md">location_on</span>
                      <div className="bg-white dark:bg-slate-900 px-3 py-1 rounded-full shadow-lg text-[10px] font-bold mt-1">Suivi en Direct Actif</div>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-500 italic">Traçabilité de {inTransitCount} véhicules de transport actifs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EquipmentMovements;
