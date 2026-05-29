import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const VilleManagerModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [newVilleName, setNewVilleName] = useState('');
  const [newVilleRegionId, setNewVilleRegionId] = useState('');
  const [editingVilleId, setEditingVilleId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingRegionId, setEditingRegionId] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Load Regions
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => logisticsService.getRegions().then(res => res.data),
    enabled: isOpen
  });

  // Load Villes
  const { data: villesData, isLoading } = useQuery({
    queryKey: ['villes-admin'],
    queryFn: () => logisticsService.getVilles().then(res => res.data),
    enabled: isOpen
  });

  const regions = Array.isArray(regionsData) ? regionsData : (regionsData?.results || []);
  const villes = Array.isArray(villesData) ? villesData : (villesData?.results || []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => logisticsService.createVille(data),
    onSuccess: () => {
      toast.success('Ville créée avec succès !');
      setNewVilleName('');
      setNewVilleRegionId('');
      queryClient.invalidateQueries({ queryKey: ['villes'] });
      queryClient.invalidateQueries({ queryKey: ['villes-admin'] });
    },
    onError: () => {
      toast.error("Erreur lors de la création de la ville.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => logisticsService.updateVille(id, data),
    onSuccess: () => {
      toast.success('Ville modifiée avec succès !');
      setEditingVilleId(null);
      queryClient.invalidateQueries({ queryKey: ['villes'] });
      queryClient.invalidateQueries({ queryKey: ['villes-admin'] });
      queryClient.invalidateQueries({ queryKey: ['churches'] });
    },
    onError: () => {
      toast.error('Erreur lors de la modification.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => logisticsService.deleteVille(id),
    onSuccess: () => {
      toast.success('Ville supprimée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['villes'] });
      queryClient.invalidateQueries({ queryKey: ['villes-admin'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.detail;
      toast.error(msg || "Impossible de supprimer cette ville (vérifiez si des églises y sont rattachées).");
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newVilleName.trim() || !newVilleRegionId) return;
    createMutation.mutate({ 
      nom: newVilleName.trim(),
      region: parseInt(newVilleRegionId)
    });
  };

  const handleStartEdit = (ville) => {
    setEditingVilleId(ville.id);
    setEditingName(ville.nom);
    setEditingRegionId(ville.region || '');
  };

  const handleSaveEdit = (id) => {
    if (!editingName.trim() || !editingRegionId) return;
    updateMutation.mutate({ 
      id, 
      data: { 
        nom: editingName.trim(),
        region: parseInt(editingRegionId)
      } 
    });
  };

  const handleDelete = (id, name) => {
    setItemToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md select-none font-mono">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative size-2 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
              <span className="relative size-1.5 rounded-full bg-blue-500" />
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              CONSOLE DE GESTION DES VILLES
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

        {/* Villes list (scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-2 border-b border-slate-800 pb-4">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-800 grid grid-cols-12 gap-2">
            <span className="col-span-5">NOM DE LA VILLE</span>
            <span className="col-span-4">RÉGION LOGISTIQUE</span>
            <span className="col-span-3 text-right">ACTIONS DE PRÉCISION</span>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-500 uppercase tracking-widest animate-pulse">
              Chargement des villes...
            </div>
          ) : villes.length > 0 ? (
            villes.map(v => (
              <div key={v.id} className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-slate-950/40">
                {/* Name field */}
                <div className="col-span-5">
                  {editingVilleId === v.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      style={{ backgroundColor: '#020617', color: '#ffffff' }}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none font-mono"
                    />
                  ) : (
                    <span className="text-xs font-bold text-white uppercase tracking-wide">{v.nom}</span>
                  )}
                </div>

                {/* Region field */}
                <div className="col-span-4">
                  {editingVilleId === v.id ? (
                    <select
                      value={editingRegionId}
                      onChange={(e) => setEditingRegionId(e.target.value)}
                      style={{ backgroundColor: '#020617', color: '#ffffff' }}
                      className="w-full px-2 py-1 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none cursor-pointer font-mono"
                    >
                      <option value="">SÉLECTIONNER</option>
                      {regions.map(r => (
                        <option key={r.id} value={r.id}>{r.nom}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950 px-2 py-0.5 border border-slate-800/60">
                      {v.region_nom || 'Non assignée'}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-3 flex justify-end gap-1.5">
                  {editingVilleId === v.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(v.id)}
                        disabled={updateMutation.isPending}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-none transition-all whitespace-nowrap"
                      >
                        [ ENREG ]
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingVilleId(null)}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-bold text-[9px] uppercase tracking-wider rounded-none transition-all whitespace-nowrap"
                      >
                        [ ANNUL ]
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEdit(v)}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-bold text-[9px] uppercase tracking-wider rounded-none transition-all whitespace-nowrap"
                      >
                        [ ÉDITER ]
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(v.id, v.nom)}
                        disabled={deleteMutation.isPending}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-rose-500 hover:bg-rose-950/20 hover:border-rose-900 font-bold text-[9px] uppercase tracking-wider rounded-none transition-all whitespace-nowrap"
                      >
                        [ X ]
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 uppercase tracking-widest">
              Aucune ville configurée.
            </div>
          )}
        </div>

        {/* Add Ville form */}
        <form onSubmit={handleCreate} className="space-y-3 shrink-0 pt-2 border-t border-slate-800">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">NOUVELLE VILLE LOCALE</label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <input
                type="text"
                required
                value={newVilleName}
                onChange={(e) => setNewVilleName(e.target.value)}
                placeholder="Nom (Ex: SOUBRE)"
                style={{ backgroundColor: '#020617', color: '#ffffff' }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none transition-all font-mono"
              />
            </div>
            <div className="sm:col-span-4">
              <select
                required
                value={newVilleRegionId}
                onChange={(e) => setNewVilleRegionId(e.target.value)}
                style={{ backgroundColor: '#020617', color: '#ffffff' }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none cursor-pointer font-mono"
              >
                <option value="">RÉGION LOGISTIQUE</option>
                {regions.map(r => (
                  <option key={r.id} value={r.id}>{r.nom}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={createMutation.isPending || !newVilleName.trim() || !newVilleRegionId}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-widest transition-all active:scale-[0.98] rounded-none border border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + CRÉER
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="SUPPRESSION DE VILLE"
        message={`Voulez-vous vraiment supprimer définitivement la ville "${itemToDelete?.name}" ?`}
        onConfirm={() => {
          deleteMutation.mutate(itemToDelete.id);
          setDeleteConfirmOpen(false);
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
};

export default VilleManagerModal;
