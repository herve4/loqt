import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import toast from 'react-hot-toast';

const EgliseFormModal = ({ isOpen, onClose, churchToEdit = null }) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    nom: '',
    phone: '',
    pays: 'Côte d\'Ivoire',
    region: '',
    ville: '',
    pasteur: '',
    is_active: true,
    is_national_hq: false
  });

  const [error, setError] = useState('');

  // Queries to load select options
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => logisticsService.getRegions().then(res => res.data),
    enabled: isOpen
  });

  const { data: villesData } = useQuery({
    queryKey: ['villes', formData.region],
    queryFn: () => logisticsService.getVilles({ region: formData.region }).then(res => res.data),
    enabled: isOpen && !!formData.region
  });

  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => logisticsService.getMembers().then(res => res.data),
    enabled: isOpen
  });

  const regions = Array.isArray(regionsData) ? regionsData : (regionsData?.results || []);
  const villes = Array.isArray(villesData) ? villesData : (villesData?.results || []);
  const membersRaw = Array.isArray(membersData) ? membersData : (membersData?.results || []);

  // Filter members to show potential pastors
  const pastors = membersRaw.filter(m => m.role === 'pasteur_local' || m.role === 'rll' || m.is_staff || m.role === 'technicien');

  useEffect(() => {
    if (churchToEdit) {
      setFormData({
        nom: churchToEdit.nom || '',
        phone: churchToEdit.phone || '',
        pays: churchToEdit.pays || 'Côte d\'Ivoire',
        region: churchToEdit.region || '',
        ville: churchToEdit.ville || '',
        pasteur: churchToEdit.pasteur || '',
        is_active: churchToEdit.is_active !== undefined ? churchToEdit.is_active : true,
        is_national_hq: churchToEdit.is_national_hq !== undefined ? churchToEdit.is_national_hq : false
      });
    } else {
      setFormData({
        nom: '',
        phone: '',
        pays: 'Côte d\'Ivoire',
        region: '',
        ville: '',
        pasteur: '',
        is_active: true,
        is_national_hq: false
      });
    }
    setError('');
  }, [churchToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      if (name === 'region') {
        updated.ville = ''; // reset ville if region changes
      }
      return updated;
    });
  };

  const mutation = useMutation({
    mutationFn: (data) => {
      if (churchToEdit) {
        return logisticsService.updateEglise(churchToEdit.id, data);
      }
      return logisticsService.createEglise(data);
    },
    onSuccess: () => {
      toast.success(churchToEdit ? 'Église modifiée avec succès !' : 'Église créée avec succès !');
      queryClient.invalidateQueries({ queryKey: ['churches'] });
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      onClose();
    },
    onError: (err) => {
      const data = err.response?.data;
      if (typeof data === 'object') {
        setError(Object.values(data).flat().join(', '));
      } else {
        setError("Une erreur est survenue lors de l'enregistrement de l'église.");
      }
      toast.error("Erreur d'enregistrement.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.nom || !formData.ville) {
      setError("Le nom de l'église et la ville sont obligatoires.");
      return;
    }

    const payload = {
      nom: formData.nom,
      phone: formData.phone || null,
      pays: formData.pays,
      region: formData.region ? parseInt(formData.region) : null,
      ville: parseInt(formData.ville),
      pasteur: formData.pasteur ? parseInt(formData.pasteur) : null,
      is_active: formData.is_active,
      is_national_hq: formData.is_national_hq
    };

    mutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md select-none font-mono">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 p-6 md:p-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="relative size-2 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
              <span className="relative size-1.5 rounded-full bg-blue-500" />
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              {churchToEdit ? "MODIFICATION DE L'ÉGLISE" : "NOUVELLE ÉGLISE LOCALE"}
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

        {error && (
          <div className="mb-4 p-3 bg-rose-950/20 border border-rose-900 text-rose-400 text-xs flex items-start gap-2">
            <span className="material-symbols-outlined text-sm font-bold mt-0.5">report_problem</span>
            <div className="uppercase tracking-wider text-[9px]">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-slate-300">
          {/* Nom */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">NOM DE L'ÉGLISE *</label>
            <input
              type="text"
              name="nom"
              required
              value={formData.nom}
              onChange={handleChange}
              placeholder="Ex: ABOBO MARAHOUÉ"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none transition-all"
            />
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">NUMÉRO DE TÉLÉPHONE</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+225 07 00 00 00 00"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none transition-all"
              />
            </div>

            {/* Pays */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">PAYS</label>
              <input
                type="text"
                name="pays"
                value={formData.pays}
                onChange={handleChange}
                placeholder="Côte d'Ivoire"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none transition-all font-mono"
              />
            </div>
          </div>

          {/* Grid fields for Region / Ville */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Region */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">RÉGION LOGISTIQUE</label>
              <div className="relative">
                <select
                  name="region"
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none appearance-none cursor-pointer"
                >
                  <option value="">SÉLECTIONNER</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.nom}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm">expand_more</span>
              </div>
            </div>

            {/* Ville */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">VILLE D'IMPLANTATION *</label>
              <div className="relative">
                <select
                  name="ville"
                  required
                  disabled={!formData.region}
                  value={formData.ville}
                  onChange={handleChange}
                  className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="">{!formData.region ? "RÉGION LOGISTIQUE REQUISE" : "SÉLECTIONNER"}</option>
                  {villes.map(v => (
                    <option key={v.id} value={v.id}>{v.nom}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm">expand_more</span>
              </div>
            </div>
          </div>

          {/* Pasteur */}
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">PASTEUR RESPONSABLE LOCAL</label>
            <div className="relative">
              <select
                name="pasteur"
                value={formData.pasteur}
                onChange={handleChange}
                className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 text-xs text-white focus:border-slate-500 focus:outline-none focus:ring-0 rounded-none appearance-none cursor-pointer"
              >
                <option value="">NON ASSIGNÉ</option>
                {pastors.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} ({p.email || p.phone})
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm">expand_more</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6 py-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="size-4 bg-slate-950 border border-slate-800 text-blue-600 focus:ring-0 rounded-none cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">EST ACTIVE</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                name="is_national_hq"
                checked={formData.is_national_hq}
                onChange={handleChange}
                className="size-4 bg-slate-950 border border-slate-800 text-blue-600 focus:ring-0 rounded-none cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-hover:text-white transition-colors">SIÈGE NATIONAL</span>
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all rounded-none border border-slate-800"
            >
              ANNULER
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-[2] py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 rounded-none border border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'ENREGISTREMENT...' : (churchToEdit ? 'ENREGISTRER LES MODIFICATIONS' : "CRÉER L'ÉGLISE LOCALE")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EgliseFormModal;
