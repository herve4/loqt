import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const CategoryManagerModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  
  // Category States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  // Active selection for Subcategories
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Subcategory States
  const [newSousName, setNewSousName] = useState('');
  const [editingSousId, setEditingSousId] = useState(null);
  const [editingSousName, setEditingSousName] = useState('');
  const [deleteSousConfirmOpen, setDeleteSousConfirmOpen] = useState(false);
  const [itemSousToDelete, setItemSousToDelete] = useState(null);

  // Load Categories
  const { data: categoriesData, isLoading: isLoadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => logisticsService.getCategories().then(res => res.data),
    enabled: isOpen
  });

  // Load Subcategories
  const { data: sousCatsData, isLoading: isLoadingSous } = useQuery({
    queryKey: ['sous-categories'],
    queryFn: () => logisticsService.getSousCategories().then(res => res.data),
    enabled: isOpen
  });

  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.results || []);
  const sousCategories = Array.isArray(sousCatsData) ? sousCatsData : (sousCatsData?.results || []);

  // Automatically select first category if none selected
  React.useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // CATEGORIES MUTATIONS
  const createCatMutation = useMutation({
    mutationFn: (data) => logisticsService.createCategory(data),
    onSuccess: (res) => {
      toast.success('Catégorie créée avec succès !');
      setNewCategoryName('');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      // Select the new category
      setSelectedCategory(res.data);
    },
    onError: () => {
      toast.error('Erreur lors de la création de la catégorie.');
    }
  });

  const updateCatMutation = useMutation({
    mutationFn: ({ id, data }) => logisticsService.updateCategory(id, data),
    onSuccess: (res) => {
      toast.success('Catégorie modifiée avec succès !');
      setEditingCategoryId(null);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      if (selectedCategory?.id === res.data.id) {
        setSelectedCategory(res.data);
      }
    },
    onError: () => {
      toast.error('Erreur lors du renommage.');
    }
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id) => logisticsService.deleteCategory(id),
    onSuccess: () => {
      toast.success('Catégorie supprimée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setSelectedCategory(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.detail;
      toast.error(msg || 'Impossible de supprimer cette catégorie (vérifiez si des matériels y sont rattachés).');
    }
  });

  // SUBCATEGORIES MUTATIONS
  const createSousMutation = useMutation({
    mutationFn: (data) => logisticsService.createSousCategory(data),
    onSuccess: () => {
      toast.success('Sous-catégorie créée !');
      setNewSousName('');
      queryClient.invalidateQueries({ queryKey: ['sous-categories'] });
    },
    onError: () => {
      toast.error('Erreur lors de la création de la sous-catégorie.');
    }
  });

  const updateSousMutation = useMutation({
    mutationFn: ({ id, data }) => logisticsService.updateSousCategory(id, data),
    onSuccess: () => {
      toast.success('Sous-catégorie renommée !');
      setEditingSousId(null);
      queryClient.invalidateQueries({ queryKey: ['sous-categories'] });
    },
    onError: () => {
      toast.error('Erreur de modification.');
    }
  });

  const deleteSousMutation = useMutation({
    mutationFn: (id) => logisticsService.deleteSousCategory(id),
    onSuccess: () => {
      toast.success('Sous-catégorie supprimée !');
      queryClient.invalidateQueries({ queryKey: ['sous-categories'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.detail;
      toast.error(msg || 'Impossible de supprimer.');
    }
  });

  // Handlers for Category
  const handleCreateCat = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createCatMutation.mutate({ nom: newCategoryName.trim() });
  };

  const handleStartEditCat = (cat) => {
    setEditingCategoryId(cat.id);
    setEditingName(cat.nom);
  };

  const handleSaveEditCat = (id) => {
    if (!editingName.trim()) return;
    updateCatMutation.mutate({ id, data: { nom: editingName.trim() } });
  };

  const handleDeleteCat = (id, name) => {
    setItemToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  // Handlers for Subcategory
  const handleCreateSous = (e) => {
    e.preventDefault();
    if (!newSousName.trim() || !selectedCategory) return;
    createSousMutation.mutate({
      nom: newSousName.trim(),
      categorie: selectedCategory.id
    });
  };

  const handleStartEditSous = (sc) => {
    setEditingSousId(sc.id);
    setEditingSousName(sc.nom);
  };

  const handleSaveEditSous = (id) => {
    if (!editingSousName.trim()) return;
    updateSousMutation.mutate({
      id,
      data: {
        nom: editingSousName.trim(),
        categorie: selectedCategory.id
      }
    });
  };

  const handleDeleteSous = (id, name) => {
    setItemSousToDelete({ id, name });
    setDeleteSousConfirmOpen(true);
  };

  if (!isOpen) return null;

  // Filter subcategories for the active selected category
  const activeSousCategories = selectedCategory
    ? sousCategories.filter(sc => sc.categorie === selectedCategory.id)
    : [];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md select-none font-mono">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative size-2 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
              <span className="relative size-1.5 rounded-full bg-blue-500" />
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              CONSOLE DE GESTION DES CATÉGORIES ET SOUS-CATÉGORIES
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-[9px] bg-slate-950 border border-slate-800 text-slate-400 hover:border-slate-500 hover:text-white px-2 py-1 font-bold uppercase transition-all"
          >
            [ FERMER ]
          </button>
        </div>

        {/* Double Column Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden my-2">
          
          {/* LEFT PANEL: CATEGORIES (Col 6) */}
          <div className="md:col-span-6 flex flex-col overflow-hidden min-h-[30vh]">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pb-1.5 border-b border-slate-850 block mb-2">
              📂 CATÉGORIES PRINCIPALES
            </span>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-1.5">
              {isLoadingCats ? (
                <div className="text-center py-8 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">
                  Chargement des catégories...
                </div>
              ) : categories.length > 0 ? (
                categories.map(c => {
                  const isSelected = selectedCategory?.id === c.id;
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => !editingCategoryId && setSelectedCategory(c)}
                      className={`grid grid-cols-12 gap-2 items-center px-2 py-1.5 border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-800/40 border-slate-700' 
                          : 'bg-slate-950/20 border-slate-900/60 hover:bg-slate-950/40 hover:border-slate-800'
                      }`}
                    >
                      {/* Name input/label */}
                      <div className="col-span-8 flex items-center gap-2">
                        {editingCategoryId === c.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            style={{ backgroundColor: '#020617', color: '#ffffff' }}
                            className="w-full px-2 py-0.5 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none rounded-none font-mono"
                          />
                        ) : (
                          <span className={`text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                            {c.nom}
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="col-span-4 flex justify-end gap-1">
                        {editingCategoryId === c.id ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEditCat(c.id);
                              }}
                              className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-none"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategoryId(null);
                              }}
                              className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-bold text-[9px] uppercase tracking-wider rounded-none"
                            >
                              X
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditCat(c);
                              }}
                              className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white font-bold text-[9px] uppercase tracking-wider rounded-none"
                            >
                              Édit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCat(c.id, c.nom);
                              }}
                              className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 text-rose-500 hover:text-rose-400 font-bold text-[9px] uppercase tracking-wider rounded-none"
                            >
                              X
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-[10px] text-slate-500 uppercase tracking-widest">
                  Aucune catégorie principale.
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCat} className="space-y-1 mt-3 shrink-0">
              <label className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block">CREER UNE CATEGORIE PRINCIPALE</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: SON & AUDIO"
                  style={{ backgroundColor: '#020617', color: '#ffffff' }}
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none rounded-none font-mono"
                />
                <button
                  type="submit"
                  disabled={createCatMutation.isPending || !newCategoryName.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-widest rounded-none border border-blue-700"
                >
                  + CREER
                </button>
              </div>
            </form>
          </div>

          {/* RIGHT PANEL: SUBCATEGORIES OF SELECTED CATEGORY (Col 6) */}
          <div className="md:col-span-6 flex flex-col overflow-hidden border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-6">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pb-1.5 border-b border-slate-850 block mb-2">
              🏷️ SOUS-CATÉGORIES {selectedCategory ? `[ ${selectedCategory.nom} ]` : ''}
            </span>

            {/* Subcategories list */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-1.5">
              {!selectedCategory ? (
                <div className="text-center py-8 text-[10px] text-slate-500 uppercase tracking-widest">
                  Sélectionnez une catégorie principale pour gérer ses sous-catégories.
                </div>
              ) : isLoadingSous ? (
                <div className="text-center py-8 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">
                  Chargement des sous-catégories...
                </div>
              ) : activeSousCategories.length > 0 ? (
                activeSousCategories.map(sc => (
                  <div 
                    key={sc.id} 
                    className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 bg-slate-950/30 border border-slate-900/60"
                  >
                    {/* Name input/label */}
                    <div className="col-span-8">
                      {editingSousId === sc.id ? (
                        <input
                          type="text"
                          value={editingSousName}
                          onChange={(e) => setEditingSousName(e.target.value)}
                          style={{ backgroundColor: '#020617', color: '#ffffff' }}
                          className="w-full px-2 py-0.5 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none rounded-none font-mono"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                          {sc.nom}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-4 flex justify-end gap-1">
                      {editingSousId === sc.id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleSaveEditSous(sc.id)}
                            className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-none"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingSousId(null)}
                            className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-bold text-[9px] uppercase tracking-wider rounded-none"
                          >
                            X
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEditSous(sc)}
                            className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white font-bold text-[9px] uppercase tracking-wider rounded-none"
                          >
                            Édit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSous(sc.id, sc.nom)}
                            className="px-1.5 py-0.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-rose-500 hover:text-rose-400 font-bold text-[9px] uppercase tracking-wider rounded-none"
                          >
                            X
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[10px] text-slate-500 uppercase tracking-widest">
                  Aucune sous-catégorie dans ce segment.
                </div>
              )}
            </div>

            {/* Subcategory form */}
            {selectedCategory && (
              <form onSubmit={handleCreateSous} className="space-y-1 mt-3 shrink-0">
                <label className="text-[8px] font-bold text-slate-450 uppercase tracking-widest block">CREER UNE SOUS-CATEGORIE DANS {selectedCategory.nom}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newSousName}
                    onChange={(e) => setNewSousName(e.target.value)}
                    placeholder="Ex: MICROPHONE SANS FIL"
                    style={{ backgroundColor: '#020617', color: '#ffffff' }}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none rounded-none font-mono"
                  />
                  <button
                    type="submit"
                    disabled={createSousMutation.isPending || !newSousName.trim()}
                    className="px-3 py-1.5 bg-blue-605 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-widest rounded-none border border-blue-700"
                  >
                    + CREER
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* Confirmation Category Delete */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="SUPPRESSION DE CATÉGORIE PRINCIPALE"
        message={`Voulez-vous vraiment supprimer définitivement la catégorie "${itemToDelete?.name}" ? Tous les matériels rattachés pourraient être orphelins.`}
        onConfirm={() => {
          deleteCatMutation.mutate(itemToDelete.id);
          setDeleteConfirmOpen(false);
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      {/* Confirmation Subcategory Delete */}
      <ConfirmModal
        isOpen={deleteSousConfirmOpen}
        title="SUPPRESSION DE SOUS-CATÉGORIE"
        message={`Voulez-vous vraiment supprimer la sous-catégorie "${itemSousToDelete?.name}" ?`}
        onConfirm={() => {
          deleteSousMutation.mutate(itemSousToDelete.id);
          setDeleteSousConfirmOpen(false);
        }}
        onCancel={() => setDeleteSousConfirmOpen(false)}
      />
    </div>
  );
};

export default CategoryManagerModal;
