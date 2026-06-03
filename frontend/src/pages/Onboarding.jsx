import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authService, logisticsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Onboarding = () => {
  const { user, updateAuthUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.onboarding_completed) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [formData, setFormData] = useState({
    phone: '',
    region: '',
    eglise: '',
    pole: '',
    role: 'technicien',
  });
  const [error, setError] = useState('');

  const { data: eglisesData } = useQuery({
    queryKey: ['eglises'],
    queryFn: () => logisticsService.getEglises({ page_size: 200 }).then(r => r.data),
  });

  const { data: polesData } = useQuery({
    queryKey: ['poles'],
    queryFn: () => logisticsService.getPoles().then(r => r.data),
  });
  
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => logisticsService.getRegions().then(r => r.data),
  });

  const eglisesRaw = Array.isArray(eglisesData) ? eglisesData : (eglisesData?.results || []);
  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);
  const regionsRaw = Array.isArray(regionsData) ? regionsData : (regionsData?.results || []);

  const regions = regionsRaw
    .filter(r => eglisesRaw.some(e => String(e.region) === String(r.id)))
    .map(r => ({
      ...r,
      nom: r.nom.replace(/^REGION\s+/i, '').trim()
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const eglises = formData.region 
    ? eglisesRaw.filter(e => String(e.region) === String(formData.region))
    : [];

  const updateMutation = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: (response) => {
      toast.success('Profil configuré avec succès !');
      updateAuthUser(response.data.user);
      navigate('/dashboard');
    },
    onError: (err) => {
      const data = err.response?.data;
      if (typeof data === 'object') {
        setError(Object.values(data).flat().join(', '));
      } else {
        setError("Une erreur est survenue lors de la configuration du profil.");
      }
      toast.error('Erreur lors de la configuration.');
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      if (name === 'region') {
        newData.eglise = '';
      }
      return newData;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phone || !formData.eglise || !formData.pole) {
      setError('Veuillez remplir toutes les informations requises.');
      return;
    }

    const payload = {
      phone: formData.phone,
      eglise: formData.eglise,
      pole: formData.pole,
      role: formData.role,
      onboarding_completed: true,
    };

    updateMutation.mutate(payload);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-mono flex items-center justify-center p-4 relative overflow-hidden select-none !bg-slate-50 !text-slate-800">
      {/* Decorative Technical Reticles */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-slate-200 pointer-events-none !border-slate-200" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-slate-200 pointer-events-none !border-slate-200" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-slate-200 pointer-events-none !border-slate-200" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-slate-200 pointer-events-none !border-slate-200" />

      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #1745cf 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      <div className="w-full max-w-lg bg-white border border-slate-200 p-6 md:p-8 relative z-10 animate-in zoom-in-95 duration-300 shadow-md !bg-white !border-slate-200">
        
        {/* Terminal Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-6 !border-slate-200">
          <div className="flex items-center gap-2">
            <span className="relative size-2 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
              <span className="relative size-1.5 rounded-full bg-blue-500" />
            </span>
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase !text-slate-500">CONSOLE D'ONBOARDING LOGISTIQUE</span>
          </div>
          <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-200/50 font-bold uppercase !bg-blue-50 !text-blue-600 !border-blue-200">INITIAL_SETUP_v1.0</span>
        </div>

        {/* Welcome message */}
        <div className="mb-6 space-y-2">
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight !text-slate-900">
            BIENVENUE, {user?.first_name || 'OPÉRATEUR'} {user?.last_name || ''}
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed !text-slate-600">
            Votre compte Google a été authentifié avec succès. Veuillez finaliser votre profil technique pour activer vos autorisations d'accès aux flux logistiques du SGL-CI.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-start gap-2.5 !bg-rose-50 !border-rose-200 !text-rose-600">
            <span className="material-symbols-outlined text-[15px] font-bold mt-0.5">report_problem</span>
            <div className="uppercase tracking-wider text-[10px]">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-650 uppercase tracking-widest block !text-slate-600">NUMÉRO DE TÉLÉPHONE *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm !text-slate-500">call</span>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="+225 07 00 00 00 00"
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-0 transition-all rounded-none font-mono !bg-white !text-slate-900 !border-slate-200"
              />
            </div>
          </div>

          {/* Region and Eglise dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-650 uppercase tracking-widest block !text-slate-600">RÉGION *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm !text-slate-500">map</span>
                <select
                  name="region"
                  required
                  value={formData.region}
                  onChange={handleChange}
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-0 appearance-none cursor-pointer rounded-none font-mono !bg-white !text-slate-900 !border-slate-200"
                >
                  <option value="" className="!bg-white !text-slate-900">SÉLECTIONNER</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id} className="!bg-white !text-slate-900">{r.nom}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm !text-slate-500">expand_more</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-650 uppercase tracking-widest block !text-slate-600">ÉGLISE LOCALE *</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm !text-slate-500">church</span>
                <select
                  name="eglise"
                  required
                  disabled={!formData.region}
                  value={formData.eglise}
                  onChange={handleChange}
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-0 appearance-none cursor-pointer rounded-none font-mono disabled:opacity-40 !bg-white !text-slate-900 !border-slate-200"
                >
                  <option value="" className="!bg-white !text-slate-900">{!formData.region ? "RÉGION REQ" : "SÉLECTIONNER"}</option>
                  {eglises.map(e => (
                    <option key={e.id} value={e.id} className="!bg-white !text-slate-900">{e.nom}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm !text-slate-500">expand_more</span>
              </div>
            </div>
          </div>

          {/* Pole Technique */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-650 uppercase tracking-widest block !text-slate-600">PÔLE DE COMPÉTENCE TECHNIQUE *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm !text-slate-500">handyman</span>
              <select
                name="pole"
                required
                value={formData.pole}
                onChange={handleChange}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-0 appearance-none cursor-pointer rounded-none font-mono !bg-white !text-slate-900 !border-slate-200"
              >
                <option value="" className="!bg-white !text-slate-900">SÉLECTIONNER UN PÔLE</option>
                {poles.map(p => (
                  <option key={p.id} value={p.id} className="!bg-white !text-slate-900">{p.nom}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm !text-slate-500">expand_more</span>
            </div>
          </div>

          {/* Role selection for Google registrations */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-650 uppercase tracking-widest block !text-slate-600">RÔLE LOGISTIQUE DEMANDÉ *</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm !text-slate-500">badge</span>
              <select
                name="role"
                required
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-0 appearance-none cursor-pointer rounded-none font-mono !bg-white !text-slate-900 !border-slate-200"
              >
                <option value="technicien" className="!bg-white !text-slate-900">MEMBRE TECHNICIEN</option>
                <option value="rll" className="!bg-white !text-slate-900">RESPONSABLE LOGISTIQUE LOCAL (RLL)</option>
                <option value="pasteur_local" className="!bg-white !text-slate-900">PASTEUR RESPONSABLE LOCAL</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm !text-slate-500">expand_more</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 rounded-none border border-blue-700 shadow-md shadow-blue-900/10 disabled:opacity-50 disabled:cursor-not-allowed !bg-blue-600 !text-white !border-blue-700"
          >
            {updateMutation.isPending ? 'ENREGISTREMENT...' : 'FINALISER MON PROFIL'}
            {!updateMutation.isPending && <span className="material-symbols-outlined text-sm font-black !text-white">arrow_forward</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
