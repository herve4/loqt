import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { logisticsService } from '../services/api';

const MaterielFormModal = ({ item = null, onClose }) => {
  const queryClient = useQueryClient();
  const isEditMode = !!item;

  // Local Form State
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    quantite: 1,
    etat: 'OP',
    categorie: '',
    sous_categorie: '',
    eglise: '',
    identifiant_unique: ''
  });

  const [formError, setFormError] = useState('');
  
  // Inline category creation states
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Inline subcategory creation states
  const [isCreatingSousCategory, setIsCreatingSousCategory] = useState(false);
  const [newSousCategoryName, setNewSousCategoryName] = useState('');
  
  // Image handling states
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]); // File objects
  const [newPreviews, setNewPreviews] = useState([]); // Blob URLs
  const [imageToDelete, setImageToDelete] = useState(null); // id of image to delete

  // Hydrate form in Edit Mode
  useEffect(() => {
    if (item) {
      setFormData({
        nom: item.nom || '',
        description: item.description || '',
        quantite: item.quantite || 1,
        etat: item.etat || 'OP',
        categorie: item.categorie || '',
        sous_categorie: item.sous_categorie || '',
        eglise: item.eglise || '',
        identifiant_unique: item.identifiant_unique || ''
      });
      setExistingImages(item.images_materiel || []);
      setNewImages([]);
      setNewPreviews([]);
      setImageToDelete(null);
    }
  }, [item]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      newPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  // Fetch Categories, Subcategories & Churches for selects
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => logisticsService.getCategories().then(res => res.data)
  });

  const { data: sousCatsData } = useQuery({
    queryKey: ['sous-categories'],
    queryFn: () => logisticsService.getSousCategories().then(res => res.data)
  });

  const { data: churchesData } = useQuery({
    queryKey: ['churches-list-minimal'],
    queryFn: () => logisticsService.getEglises({ page_size: 100 }).then(res => res.data)
  });

  const categories = categoriesData?.results || (Array.isArray(categoriesData) ? categoriesData : []);
  const sousCategories = sousCatsData?.results || (Array.isArray(sousCatsData) ? sousCatsData : []);
  const churches = churchesData?.results || (Array.isArray(churchesData) ? churchesData : []);

  // Mutation for POST (Create)
  const createMutation = useMutation({
    mutationFn: (data) => logisticsService.postMateriel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Matériel créé avec succès !');
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setFormError(`Erreur de création : ${msg}`);
      toast.error(`Erreur de création : ${msg}`);
    }
  });

  // Mutation for PATCH (Edit)
  const editMutation = useMutation({
    mutationFn: (data) => logisticsService.patchMateriel(item.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['materiel', String(item.id)] });
      toast.success('Matériel mis à jour avec succès !');
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      setFormError(`Erreur de mise à jour : ${msg}`);
      toast.error(`Erreur de mise à jour : ${msg}`);
    }
  });

  // Mutation for DELETE IMAGE
  const deleteImageMutation = useMutation({
    mutationFn: (id) => logisticsService.deleteMaterielImage(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['materiel', String(item.id)] });
      setExistingImages(prev => prev.filter(img => img.id !== variables));
      toast.success('Image supprimée de la galerie !');
    },
    onError: (err) => {
      toast.error(`Erreur lors de la suppression de l'image : ${err.message}`);
    }
  });

  // Mutation for creating category inline
  const createCategoryMutation = useMutation({
    mutationFn: (name) => logisticsService.createCategory({ nom: name }),
    onSuccess: (res) => {
      toast.success('Catégorie créée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormData(prev => ({ ...prev, categorie: String(res.data.id) }));
      setIsCreatingCategory(false);
      setNewCategoryName('');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la catégorie.');
    }
  });

  const handleCreateCategoryInline = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createCategoryMutation.mutate(newCategoryName.trim());
  };

  // Mutation for creating subcategory inline
  const createSousCategoryMutation = useMutation({
    mutationFn: (name) => logisticsService.createSousCategory({
      nom: name,
      categorie: parseInt(formData.categorie)
    }),
    onSuccess: (res) => {
      toast.success('Sous-catégorie créée !');
      queryClient.invalidateQueries({ queryKey: ['sous-categories'] });
      setFormData(prev => ({ ...prev, sous_categorie: String(res.data.id) }));
      setIsCreatingSousCategory(false);
      setNewSousCategoryName('');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la sous-catégorie.');
    }
  });

  const handleCreateSousCategoryInline = (e) => {
    e.preventDefault();
    if (!newSousCategoryName.trim() || !formData.categorie) return;
    createSousCategoryMutation.mutate(newSousCategoryName.trim());
  };

  const handleDeleteExistingImage = (id) => {
    setImageToDelete(id);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setNewImages(prev => [...prev, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nom.trim()) {
      setFormError('Le nom du matériel est requis.');
      return;
    }
    if (!formData.categorie) {
      setFormError('Veuillez sélectionner une catégorie.');
      return;
    }

    const payload = new FormData();
    payload.append('nom', formData.nom);
    payload.append('description', formData.description);
    payload.append('quantite', parseInt(formData.quantite, 10) || 1);
    payload.append('etat', formData.etat);
    payload.append('categorie', parseInt(formData.categorie, 10));
    
    if (formData.sous_categorie) {
      payload.append('sous_categorie', parseInt(formData.sous_categorie, 10));
    }
    if (formData.eglise) {
      payload.append('eglise', parseInt(formData.eglise, 10));
    }
    if (formData.identifiant_unique) {
      payload.append('identifiant_unique', formData.identifiant_unique);
    }

    // Append multiple images
    newImages.forEach(file => {
      payload.append('uploaded_images', file);
    });

    if (isEditMode) {
      editMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || editMutation.isPending || deleteImageMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg p-6 relative flex flex-col rounded-none shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
            {isEditMode ? 'Mettre à jour le Matériel' : 'Ajouter un nouveau Matériel'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {formError && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-xs font-mono font-bold p-3 mb-6">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Nom du Matériel *</label>
            <input 
              type="text"
              required
              className="w-full h-11 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-855 px-3 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white rounded-none"
              placeholder="ex: Enceinte Amplifiée 500W"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Quantité */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Quantité</label>
              <input 
                type="number"
                min="1"
                required
                className="w-full h-11 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-855 px-3 text-sm font-mono focus:outline-none focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white rounded-none"
                value={formData.quantite}
                onChange={(e) => setFormData({ ...formData, quantite: parseInt(e.target.value, 10) || 1 })}
              />
            </div>

            {/* État */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">État Opérationnel</label>
              <select
                className="w-full h-11 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-855 px-3 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white rounded-none cursor-pointer"
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
              >
                <option value="OP">Opérationnel</option>
                <option value="RE">En réparation</option>
                <option value="PA">En panne</option>
                <option value="PE">Perdu</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Catégorie */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Catégorie *</label>
              <select
                required
                className="w-full h-11 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-855 px-3 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white rounded-none cursor-pointer"
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value, sous_categorie: '' })}
              >
                <option value="">-- Choisir une Catégorie --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>

              {!isCreatingCategory ? (
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="mt-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[12px] font-bold">add</span>
                  [ + CRÉER UNE CATÉGORIE ]
                </button>
              ) : (
                <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-1.5 font-mono">
                  <span className="text-[9px] font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest block font-sans">Nouvelle Catégorie</span>
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Ex: SON & AUDIO"
                      className="flex-1 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 text-[11px] focus:outline-none text-slate-900 dark:text-white rounded-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategoryInline}
                      disabled={createCategoryMutation.isPending || !newCategoryName.trim()}
                      className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-none active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                      {createCategoryMutation.isPending ? '...' : 'Créer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="h-8 w-8 flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-950 rounded-none transition-all cursor-pointer shrink-0"
                    >
                      <span className="material-symbols-outlined text-[13px] font-bold">close</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sous-Catégorie */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Sous-Catégorie</label>
              <select
                disabled={!formData.categorie}
                className="w-full h-11 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-855 px-3 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white rounded-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                value={formData.sous_categorie}
                onChange={(e) => setFormData({ ...formData, sous_categorie: e.target.value })}
              >
                <option value="">{!formData.categorie ? "-- Catégorie requise --" : "-- Choisir une Sous-Catégorie --"}</option>
                {formData.categorie && sousCategories.filter(sc => sc.categorie === parseInt(formData.categorie)).map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.nom}
                  </option>
                ))}
              </select>

              {formData.categorie && (
                <>
                  {!isCreatingSousCategory ? (
                    <button
                      type="button"
                      onClick={() => setIsCreatingSousCategory(true)}
                      className="mt-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px] font-bold">add</span>
                      [ + CRÉER UNE SOUS-CATÉGORIE ]
                    </button>
                  ) : (
                    <div className="mt-2.5 p-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-1.5 font-mono">
                      <span className="text-[9px] font-bold text-slate-405 dark:text-slate-400 uppercase tracking-widest block font-sans">Nouvelle Sous-Catégorie</span>
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={newSousCategoryName}
                          onChange={(e) => setNewSousCategoryName(e.target.value)}
                          placeholder="Ex: MICRO SANS FIL"
                          className="flex-1 h-8 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-2 text-[11px] focus:outline-none text-slate-900 dark:text-white rounded-none font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleCreateSousCategoryInline}
                          disabled={createSousCategoryMutation.isPending || !newSousCategoryName.trim()}
                          className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-none active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                          {createSousCategoryMutation.isPending ? '...' : 'Créer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingSousCategory(false);
                            setNewSousCategoryName('');
                          }}
                          className="h-8 w-8 flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-950 rounded-none transition-all cursor-pointer shrink-0"
                        >
                          <span className="material-symbols-outlined text-[13px] font-bold">close</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Église */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Église d'Origine</label>
              <select
                className="w-full h-11 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-855 px-3 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white rounded-none cursor-pointer"
                value={formData.eglise}
                onChange={(e) => setFormData({ ...formData, eglise: e.target.value })}
              >
                <option value="">Siège National</option>
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Identifiant Unique */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Identifiant Unique (Optionnel)</label>
              <input 
                type="text"
                className="w-full h-11 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-855 px-3 text-sm font-mono focus:outline-none focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white rounded-none"
                placeholder="ex: EQ-MOJO-01 (laisser vide pour auto-générer)"
                value={formData.identifiant_unique}
                onChange={(e) => setFormData({ ...formData, identifiant_unique: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Description & Notes Techniques</label>
            <textarea 
              rows="2"
              className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-855 p-3 text-sm focus:outline-none focus:border-slate-900 dark:focus:border-white text-slate-900 dark:text-white rounded-none resize-none"
              placeholder="Spécifications techniques, historique d'entretien..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Multi-Image Upload Area (Swiss-Minimalist) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Galerie Images du Matériel</label>
            
            <div className="flex flex-col gap-3">
              {/* Drop/Click Zone */}
              <label className="w-full h-20 border border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-900 dark:hover:border-slate-400 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.99]">
                <input 
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-slate-450 text-xl">add_photo_alternate</span>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mt-1">SÉLECTIONNER DES IMAGES</span>
              </label>

              {/* Existing Images Gallery */}
              {existingImages.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-slate-450 uppercase tracking-wider">IMAGES ENREGISTRÉES ({existingImages.length}) :</span>
                  <div className="flex flex-wrap gap-2">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative size-16 bg-slate-950 border border-slate-100 dark:border-slate-900 group overflow-hidden">
                        <img 
                          src={img.image} 
                          alt="Matériel" 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-200" 
                        />
                        {/* Hover Overlay Delete */}
                        <div 
                          onClick={() => handleDeleteExistingImage(img.id)}
                          className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-150 active:scale-90"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Gallery */}
              {newPreviews.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-wider">NOUVELLES IMAGES À UPLOADER ({newPreviews.length}) :</span>
                  <div className="flex flex-wrap gap-2">
                    {newPreviews.map((url, index) => (
                      <div key={url} className="relative size-16 bg-slate-950 border border-slate-100 dark:border-slate-900 group overflow-hidden">
                        <img 
                          src={url} 
                          alt="Prévisualisation" 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-200" 
                        />
                        {/* Hover Overlay Delete */}
                        <div 
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-150 active:scale-90"
                        >
                          <span className="material-symbols-outlined text-base">close</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button 
              type="button"
              disabled={isLoading}
              onClick={onClose} 
              className="h-11 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-300 font-bold uppercase tracking-widest text-xs rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={isLoading}
              className="h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-widest text-xs rounded-none hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Traitement...</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Custom Swiss-Minimalist Confirmation Popup */}
      {imageToDelete !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm p-6 relative flex flex-col rounded-none shadow-2xl text-center">
            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="size-12 bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 rounded-none">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
            </div>

            {/* Content */}
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">
              SUPPRESSION DÉFINITIVE
            </h4>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-6">
              Voulez-vous vraiment supprimer définitivement cette image ? Cette action est irréversible et mettra à jour instantanément la galerie.
            </p>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImageToDelete(null)}
                className="h-10 border border-slate-800 text-slate-300 font-bold uppercase tracking-widest text-[10px] rounded-none hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteImageMutation.mutate(imageToDelete);
                  setImageToDelete(null);
                }}
                className="h-10 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest text-[10px] rounded-none active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterielFormModal;
