import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const PoleManagerModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [newPoleName, setNewPoleName] = useState('');
  const [editingPoleId, setEditingPoleId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Load Poles
  const { data: polesData, isLoading } = useQuery({
    queryKey: ['poles'],
    queryFn: () => logisticsService.getPoles().then(res => res.data),
    enabled: isOpen
  });

  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => logisticsService.createPole(data),
    onSuccess: () => {
      toast.success('Département créé avec succès !');
      setNewPoleName('');
      queryClient.invalidateQueries({ queryKey: ['poles'] });
    },
    onError: () => {
      toast.error('Erreur lors de la création du département.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => logisticsService.deletePole(id),
    onSuccess: () => {
      toast.success('Département supprimé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['poles'] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.detail;
      toast.error(msg || 'Impossible de supprimer ce département.');
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newPoleName.trim()) return;
    createMutation.mutate({ nom: newPoleName.trim() });
  };

  const handleDelete = (id, name) => {
    setItemToDelete({ id, name });
    setDeleteConfirmOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md select-none font-mono">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 md:p-8 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative size-2 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
              <span className="relative size-1.5 rounded-full bg-blue-500" />
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              CONSOLE DE GESTION DES DÉPARTEMENTS
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

        {/* Poles list (scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 my-4 space-y-2 border-b border-slate-800 pb-4">
          <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pb-1 border-b border-slate-800 grid grid-cols-12 gap-2">
            <span className="col-span-8">NOM DU DÉPARTEMENT / PÔLE</span>
            <span className="col-span-4 text-right">ACTIONS</span>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-xs text-slate-500 uppercase tracking-widest animate-pulse">
              Chargement des départements...
            </div>
          ) : poles.length > 0 ? (
            poles.map(p => (
              <div key={p.id} className="grid grid-cols-12 gap-2 items-center py-1.5 border-b border-slate-950/40">
                <div className="col-span-8">
                  <span className="text-xs font-bold text-white uppercase tracking-wide">{p.nom}</span>
                </div>

                {/* Actions */}
                <div className="col-span-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDelete(p.id, p.nom)}
                    disabled={deleteMutation.isPending}
                    className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-rose-500 hover:bg-rose-950/20 hover:border-rose-900 font-bold text-[9px] uppercase tracking-wider rounded-none transition-all whitespace-nowrap"
                  >
                    [ SUPPRIMER ]
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 uppercase tracking-widest">
              Aucun département configuré.
            </div>
          )}
        </div>

        {/* Add Pole form */}
        <form onSubmit={handleCreate} className="space-y-3 shrink-0 pt-2">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">NOUVEAU DÉPARTEMENT TECHNIQUE</label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={newPoleName}
                onChange={(e) => setNewPoleName(e.target.value)}
                placeholder="Ex: PÔLE INTENDANCE & ACCUEIL"
                style={{ backgroundColor: '#020617', color: '#ffffff' }}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none transition-all font-mono"
              />
              <button
                type="submit"
                disabled={createMutation.isPending || !newPoleName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[9px] uppercase tracking-widest transition-all active:scale-[0.98] rounded-none border border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + CRÉER
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        title="SUPPRESSION DE DÉPARTEMENT"
        message={`Voulez-vous vraiment supprimer définitivement le département "${itemToDelete?.name}" ? Tous les membres associés n'auront plus de pôle assigné.`}
        onConfirm={() => {
          deleteMutation.mutate(itemToDelete.id);
          setDeleteConfirmOpen(false);
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
};

export default PoleManagerModal;
