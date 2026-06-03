import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { logisticsService } from '../services/api';
import MaterielFormModal from '../components/MaterielFormModal';
import DefectReportModal from '../components/DefectReportModal';
import ImportMaterielModal from '../components/ImportMaterielModal';
import * as XLSX from 'xlsx';

const Inventory = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [church, setChurch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [selectedQrItem, setSelectedQrItem] = useState(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [reportingDefectItem, setReportingDefectItem] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const fetchAllFilteredMateriels = async () => {
    try {
      const res = await logisticsService.getMateriels({
        page_size: 10000,
        search: search || undefined,
        categorie: category || undefined,
        eglise: church || undefined,
        etat: status || undefined
      });
      return res.data?.results || [];
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la récupération des données pour l'export.");
      return [];
    }
  };

  const handleExportXLSX = async () => {
    const loadToastId = toast.loading("Préparation de l'export Excel...");
    const items = await fetchAllFilteredMateriels();
    if (items.length === 0) {
      toast.error("Aucune donnée à exporter.", { id: loadToastId });
      return;
    }

    const exportData = items.map(item => ({
      "IDENTIFIANT_UNIQUE": item.identifiant_unique || `EQ-${item.id}`,
      "NOM": item.nom,
      "DESCRIPTION": item.description || '',
      "QUANTITE": item.quantite,
      "CATEGORIE": item.categorie_nom || '',
      "EGLISE_ORIGINE": item.eglise_nom || 'Siège National',
      "STATUT": item.etat
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventaire");
    XLSX.writeFile(workbook, "SGL-CI_Inventaire_Materiel.xlsx");
    toast.success("Export Excel terminé !", { id: loadToastId });
  };

  const handleExportCSV = async () => {
    const loadToastId = toast.loading("Préparation de l'export CSV...");
    const items = await fetchAllFilteredMateriels();
    if (items.length === 0) {
      toast.error("Aucune donnée à exporter.", { id: loadToastId });
      return;
    }

    const exportData = items.map(item => ({
      "IDENTIFIANT_UNIQUE": item.identifiant_unique || `EQ-${item.id}`,
      "NOM": item.nom,
      "DESCRIPTION": item.description || '',
      "QUANTITE": item.quantite,
      "CATEGORIE": item.categorie_nom || '',
      "EGLISE_ORIGINE": item.eglise_nom || 'Siège National',
      "STATUT": item.etat
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SGL-CI_Inventaire_Materiel.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export CSV terminé !", { id: loadToastId });
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "IDENTIFIANT_UNIQUE": "EQ-99999",
        "NOM": "Exemple d'équipement (Nom requis)",
        "DESCRIPTION": "Exemple de description facultative",
        "QUANTITE": 1,
        "CATEGORIE": "SON & AUDIO",
        "EGLISE_ORIGINE": "Eglise Centrale",
        "STATUT": "OP"
      },
      {
        "IDENTIFIANT_UNIQUE": "",
        "NOM": "Instructions importantes",
        "DESCRIPTION": "1. STATUTS valides : OP (Opérationnel), RE (Réparation), PA (Panne), PE (Perdu).",
        "QUANTITE": "",
        "CATEGORIE": "2. La CATEGORIE et l'EGLISE_ORIGINE doivent correspondre aux noms existants.",
        "EGLISE_ORIGINE": "3. IDENTIFIANT_UNIQUE est requis pour la mise à jour, laissez vide pour créer.",
        "STATUT": ""
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Modele_Import");
    XLSX.writeFile(workbook, "SGL-CI_Modele_Import_Inventaire.xlsx");
    toast.success("Modèle d'import téléchargé !");
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => logisticsService.deleteMateriel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setDeletingItem(null);
      setSelectedItemIds(prev => prev.filter(itemId => itemId !== deletingItem?.id));
      toast.success('Matériel supprimé avec succès !');
    },
    onError: (err) => {
      toast.error(`Erreur lors de la suppression : ${err.message}`);
    }
  });

  // Récupérer les catégories et églises pour les filtres
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => logisticsService.getCategories().then(res => res.data)
  });

  const { data: churchesData } = useQuery({
    queryKey: ['churches-list-minimal'],
    queryFn: () => logisticsService.getEglises({ page_size: 100 }).then(res => res.data)
  });

  const { data: materielsData, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['inventory', page, search, category, church, status],
    queryFn: () => logisticsService.getMateriels({ 
      page, 
      search: search || undefined,
      categorie: category || undefined,
      eglise: church || undefined,
      etat: status || undefined
    }).then(res => res.data),
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000 
  });

  const materiels = materielsData?.results || [];
  const totalCount = materielsData?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  const isCategoriesPaginated = !Array.isArray(categoriesData) && categoriesData?.results;
  const categories = isCategoriesPaginated ? categoriesData.results : (Array.isArray(categoriesData) ? categoriesData : []);

  const isChurchesPaginated = !Array.isArray(churchesData) && churchesData?.results;
  const churches = isChurchesPaginated ? churchesData.results : (Array.isArray(churchesData) ? churchesData : []);

  // Helpers pour la multi-sélection
  const visibleIds = materiels.map(item => item.id);
  const isAllSelected = visibleIds.length > 0 && visibleIds.every(id => selectedItemIds.includes(id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItemIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedItemIds(prev => {
        const union = [...prev];
        visibleIds.forEach(id => {
          if (!union.includes(id)) union.push(id);
        });
        return union;
      });
    }
  };

  const handleToggleItem = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  return (
    <Layout title="Inventaire du Matériel">
      <main className="p-8 w-full max-w-[1600px] mx-auto pb-32">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Inventaire du Matériel</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gestion centrale des équipements des églises régionales.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Actions de Données Dropdown */}
            <div className="relative group">
              <button 
                type="button"
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">database</span>
                <span>Actions de Données</span>
                <span className="material-symbols-outlined text-sm font-black">expand_more</span>
              </button>
              {/* Dropdown Options */}
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg py-1.5 z-40 hidden group-hover:block animate-in fade-in duration-100">
                <button
                  type="button"
                  onClick={handleExportXLSX}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none focus:outline-none"
                >
                  <span className="material-symbols-outlined text-base">download_for_offline</span>
                  Exporter en XLSX
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none focus:outline-none"
                >
                  <span className="material-symbols-outlined text-base">csv</span>
                  Exporter en CSV
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none focus:outline-none"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  Importer XLSX / CSV
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none focus:outline-none"
                >
                  <span className="material-symbols-outlined text-base">file_download</span>
                  Télécharger le Modèle
                </button>
              </div>
            </div>

            <button 
              type="button"
              onClick={() => { setEditingItem(null); setIsFormModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all shadow-sm cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              <span>Ajout Rapide</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <FilterSelect 
            label="Catégorie" 
            icon="category" 
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            options={categories.map(c => ({ value: c.id, label: c.nom }))} 
          />
          <FilterSelect 
            label="Église d'Origine" 
            icon="church" 
            value={church}
            onChange={(e) => { setChurch(e.target.value); setPage(1); }}
            options={churches.map(c => ({ value: c.id, label: c.nom }))} 
          />
          <FilterSelect 
            label="Statut" 
            icon="info" 
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[
              { value: 'OP', label: 'Opérationnel' },
              { value: 'RE', label: 'En réparation' },
              { value: 'PA', label: 'En panne' },
              { value: 'PE', label: 'Perdu' }
            ]} 
          />
          <div className="relative group">
            <label className="block text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 uppercase">Recherche</label>
            <div className="flex items-center h-10 w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-none px-3 focus-within:border-slate-400 dark:focus-within:border-slate-600 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all duration-200">
              <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
              <input 
                className="w-full bg-transparent border-0 focus:border-0 border-transparent focus:border-transparent focus:ring-0 focus:ring-transparent outline-none focus:outline-none text-sm placeholder:text-slate-400 text-slate-700 dark:text-slate-300 py-1" 
                placeholder="Nom, ID, Description..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className={`size-5 mx-auto border flex items-center justify-center transition-all cursor-pointer rounded-none outline-none focus:ring-0 select-none ${
                        isAllSelected
                          ? 'bg-primary border-primary text-white'
                          : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                    >
                      {isAllSelected && (
                        <span className="material-symbols-outlined text-sm font-black select-none">check</span>
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">Visuel</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Église d'Origine</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading && !isPlaceholderData ? (
                  <tr><td colSpan="8" className="px-6 py-4 text-center">Chargement de l'inventaire...</td></tr>
                ) : materiels.length > 0 ? (
                  materiels.map(item => (
                    <tr key={item.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${selectedItemIds.includes(item.id) ? 'bg-slate-50/50 dark:bg-slate-800/10' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.id)}
                          className={`size-5 mx-auto border flex items-center justify-center transition-all cursor-pointer rounded-none outline-none focus:ring-0 select-none ${
                            selectedItemIds.includes(item.id)
                              ? 'bg-primary border-primary text-white'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                          }`}
                        >
                          {selectedItemIds.includes(item.id) && (
                            <span className="material-symbols-outlined text-sm font-black select-none">check</span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{item.identifiant_unique || `EQ-${item.id}`}</td>

                      <td className="px-6 py-4">
                        <Link 
                          to={`/inventory/${item.id}`} 
                          className="block size-10 hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          {item.images_materiel && item.images_materiel.length > 0 ? (
                            <img 
                              src={item.images_materiel[0].image} 
                              alt={item.nom} 
                              className="size-10 object-cover border border-slate-200 dark:border-slate-800 rounded-none bg-slate-100 dark:bg-slate-800"
                            />
                          ) : item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.nom} 
                              className="size-10 object-cover border border-slate-200 dark:border-slate-800 rounded-none bg-slate-100 dark:bg-slate-800"
                            />
                          ) : (
                            <div className="size-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600">
                              <span className="material-symbols-outlined text-lg">image_not_supported</span>
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/inventory/${item.id}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors">{item.nom}</Link>
                        <div className="text-xs text-slate-500">Qté: {item.quantite}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.categorie_nom || item.categorie}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{item.eglise_nom || 'Siège National'}</td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={item.etat} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/movements?addItemId=${item.id}`} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-primary flex items-center justify-center cursor-pointer active:scale-90 transition-transform" title="Check-out">
                            <span className="material-symbols-outlined text-xl">output</span>
                          </Link>
                          <button 
                            onClick={() => setReportingDefectItem(item)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 flex items-center justify-center cursor-pointer active:scale-90 transition-transform border-0 outline-none focus:outline-none focus:ring-0" 
                            title="Signaler un défaut"
                          >
                            <span className="material-symbols-outlined text-xl">report_problem</span>
                          </button>
                          <button 
                            onClick={() => setSelectedQrItem(item)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform" 
                            title="Imprimer Étiquette QR"
                          >
                            <span className="material-symbols-outlined text-xl">qr_code_2</span>
                          </button>
                          <button 
                            onClick={() => { setEditingItem(item); setIsFormModalOpen(true); }}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center cursor-pointer active:scale-90 transition-transform" 
                            title="Modifier"
                          >
                            <span className="material-symbols-outlined text-xl">edit</span>
                          </button>
                          <button 
                            onClick={() => setDeletingItem(item)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500 flex items-center justify-center cursor-pointer active:scale-90 transition-transform" 
                            title="Supprimer"
                          >
                            <span className="material-symbols-outlined text-xl">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="px-6 py-4 text-center py-20">Aucun matériel trouvé correspondant à vos critères.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 py-8">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Précédent
            </button>
            <span className="text-sm font-bold text-slate-500">
              Page <span className="text-primary">{page}</span> sur {totalPages}
            </span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
            >
              Suivant
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}

        {/* Floating Batch Actions Bar */}
        {selectedItemIds.length > 0 && (
          <>
            <style>{`
              @keyframes slideUp {
                from { transform: translate(-50%, 20px); opacity: 0; }
                to { transform: translate(-50%, 0); opacity: 1; }
              }
            `}</style>
            <div 
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl px-6 py-4 flex items-center justify-between gap-8 border border-slate-800 dark:border-slate-200 rounded-none max-w-lg w-[calc(100%-2rem)]"
              style={{
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 text-primary dark:bg-primary/10 dark:text-primary size-9 flex items-center justify-center rounded-none font-mono font-bold text-xs shrink-0">
                  {selectedItemIds.length}
                </div>
                <div>
                  <h4 className="text-xs font-mono font-black uppercase tracking-widest leading-none">Matériel Sélectionné</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">Prêt pour une opération de sortie groupée</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setSelectedItemIds([])}
                  className="h-10 px-4 border border-slate-700 dark:border-slate-300 text-slate-350 dark:text-slate-600 hover:bg-slate-800 dark:hover:bg-slate-100 font-mono text-[9px] font-bold uppercase tracking-wider rounded-none active:scale-95 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <Link
                  to={`/movements?addItemIds=${selectedItemIds.join(',')}`}
                  className="h-10 px-4 bg-primary text-white font-mono text-[9px] font-bold uppercase tracking-wider rounded-none hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm font-black">output</span>
                  Sortie Groupée
                </Link>
              </div>
            </div>
          </>
        )}
        </main>
      {isFormModalOpen && (
        <MaterielFormModal 
          item={editingItem} 
          onClose={() => { 
            setIsFormModalOpen(false); 
            setEditingItem(null); 
          }} 
        />
      )}

      {isImportModalOpen && (
        <ImportMaterielModal
          categories={categories}
          churches={churches}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
          }}
        />
      )}

      {deletingItem && (
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
                <span className="font-bold text-slate-900 dark:text-white uppercase">{deletingItem.nom}</span>
                <span className="text-[10px] text-slate-500">ID : {deletingItem.identifiant_unique || `EQ-${deletingItem.id}`}</span>
              </div>
              <p className="text-[10px] uppercase font-bold text-red-500">
                Remarque : Cette action le masquera de la console mais préservera les journaux historiques de transfert.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setDeletingItem(null)} 
                disabled={deleteMutation.isPending}
                className="h-11 border border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-300 font-mono font-bold uppercase tracking-widest text-[10px] rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button 
                onClick={() => deleteMutation.mutate(deletingItem.id)} 
                disabled={deleteMutation.isPending}
                className="h-11 bg-red-600 hover:bg-red-700 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-none active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleteMutation.isPending ? "Suppression..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedQrItem && (
        <QrPrintModal item={selectedQrItem} onClose={() => setSelectedQrItem(null)} />
      )}

      {reportingDefectItem && (
        <DefectReportModal item={reportingDefectItem} onClose={() => setReportingDefectItem(null)} />
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
      .catch(() => {
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

const FilterSelect = ({ label, icon, options, value, onChange }) => (
  <div className="relative group">
    <label className="block text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 uppercase">{label}</label>
    <div className="flex items-center h-10 w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-none px-3 focus-within:border-slate-400 dark:focus-within:border-slate-600 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all duration-200">
      <span className="material-symbols-outlined text-slate-400 text-lg mr-2">{icon}</span>
      <select 
        className="w-full bg-transparent border-0 focus:border-0 border-transparent focus:border-transparent focus:ring-0 focus:ring-transparent outline-none focus:outline-none text-sm appearance-none cursor-pointer text-slate-700 dark:text-slate-300 py-1"
        value={value}
        onChange={onChange}
      >
        <option value="" className="bg-white dark:bg-slate-900">Tous/Toutes ({label})</option>
        {options.map(opt => <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">{opt.label}</option>)}
      </select>
      <span className="material-symbols-outlined text-slate-400 text-lg pointer-events-none">expand_more</span>
    </div>
  </div>
);

export default Inventory;
