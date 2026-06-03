import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService, logisticsService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

const PendingValidationPage = () => {
  const { user, logout, updateAuthUser } = useAuth();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load Churches and Poles for lookup translation
  const { data: churchesData } = useQuery({
    queryKey: ['churches-selector'],
    queryFn: () => logisticsService.getEglises().then(res => res.data)
  });

  const { data: polesData } = useQuery({
    queryKey: ['poles-selector'],
    queryFn: () => logisticsService.getPoles().then(res => res.data)
  });

  const churches = Array.isArray(churchesData) ? churchesData : (churchesData?.results || []);
  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);

  const getChurchName = (churchId) => {
    if (!churchId) return '-';
    const c = churches.find(ch => ch.id === churchId);
    return c ? c.nom.toUpperCase() : `ÉGLISE #${churchId}`;
  };

  const getPoleName = (poleId) => {
    if (!poleId) return '-';
    const p = poles.find(pl => pl.id === poleId);
    return p ? p.nom.toUpperCase() : `PÔLE #${poleId}`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await authService.getCurrentUser();
      const updatedUser = response.data.user;
      updateAuthUser(updatedUser);
      if (updatedUser.validation_status === 'approved') {
        toast.success('Votre compte a été approuvé ! Accès autorisé.');
        navigate('/dashboard');
      } else {
        toast.error('Votre inscription est toujours en cours de validation.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de la mise à jour du profil.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await logout();
      navigate('/login');
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-mono flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Reticles */}
      <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-slate-800 pointer-events-none" />
      <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-slate-800 pointer-events-none" />
      <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-slate-800 pointer-events-none" />
      <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-slate-800 pointer-events-none" />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-6 md:p-8 relative z-10">
        
        {/* Lock Screen Header */}
        <div className="flex justify-between items-center border-b border-slate-850 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="relative size-2 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-75" />
              <span className="relative size-1.5 rounded-full bg-amber-500" />
            </span>
            <span className="text-[10px] font-bold tracking-widest text-amber-500 uppercase">ACCÈS RESTREINT / SGL-CI</span>
          </div>
          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 border border-amber-500/20 font-bold uppercase">PENDING_VALIDATION</span>
        </div>

        {/* Lock Icon and Text */}
        <div className="mb-6 space-y-3 text-center md:text-left">
          <div className="flex justify-center md:justify-start">
            <div className="size-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 animate-pulse">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
          </div>
          <h1 className="text-lg font-black text-white uppercase tracking-tight">
            INSCRIPTION EN ATTENTE DE VALIDATION
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Votre profil technique a été configuré. L'accès à la console logistique est temporairement bloqué en attente de la validation de votre responsable de département ou de section.
          </p>
        </div>

        {/* User details table */}
        <div className="mb-6 bg-slate-950/40 p-4 border border-slate-850 space-y-2 text-[11px] leading-relaxed uppercase text-slate-400">
          <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
            <span>MEMBRE :</span>
            <span className="text-slate-200 font-bold">{user?.first_name} {user?.last_name}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
            <span>IDENTIFIANT :</span>
            <span className="text-slate-300 font-bold">#{user?.id}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
            <span>EMAIL :</span>
            <span className="text-slate-300 font-bold lowercase">{user?.email}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
            <span>ÉGLISE LOCALE :</span>
            <span className="text-slate-200 font-bold">{user?.eglise_nom?.toUpperCase() || getChurchName(user?.eglise)}</span>
          </div>
          <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
            <span>DÉPARTEMENT / PÔLE :</span>
            <span className="text-slate-200 font-bold">{user?.pole_nom?.toUpperCase() || getPoleName(user?.pole)}</span>
          </div>
          {user?.section && (
            <div className="flex justify-between border-b border-slate-900/50 pb-1.5">
              <span>SECTION :</span>
              <span className="text-slate-200 font-bold">{user.section}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>RÔLE REQUIS :</span>
            <span className="text-amber-500 font-black">{user?.role}</span>
          </div>
        </div>

        {/* Actions buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 rounded-none border border-blue-700 shadow-md disabled:opacity-50"
          >
            {isRefreshing ? 'RAFRAÎCHISSEMENT...' : 'VÉRIFIER LE STATUT'}
            {!isRefreshing && <span className="material-symbols-outlined text-sm font-black">refresh</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 rounded-none border border-slate-800"
          >
            SE DÉCONNECTER
            <span className="material-symbols-outlined text-sm font-black">logout</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default PendingValidationPage;
