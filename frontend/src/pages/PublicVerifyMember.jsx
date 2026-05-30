import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authService } from '../services/api';

const PublicVerifyMember = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanTime, setScanTime] = useState('');

  useEffect(() => {
    // Obtenir la date/heure actuelle du scan pour authenticité
    const now = new Date();
    setScanTime(now.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }));

    const fetchMemberData = async () => {
      try {
        setLoading(true);
        const res = await authService.verifyMemberPublic(id);
        setMember(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Membre introuvable ou erreur de connexion.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMemberData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-400 p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-none animate-spin"></div>
          <span className="text-xs uppercase tracking-widest animate-pulse">Vérification en cours...</span>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-400 p-6">
        <div className="max-w-[400px] w-full bg-slate-900 border border-red-950 p-8 rounded-none shadow-2xl flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-red-500 text-[64px] mb-4">cancel</span>
          <h2 className="text-red-500 text-lg font-black tracking-widest uppercase mb-2">ÉCHEC DE VÉRIFICATION</h2>
          <p className="text-xs text-slate-500 mb-6">{error || 'Identifiant de membre invalide'}</p>
          <div className="w-full border-t border-slate-800 pt-4 text-[10px] text-slate-600">
            SGL-CI SECURE GATEWAY • SYSTEM TIME: {scanTime}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-300 p-4">
      <div className="max-w-[440px] w-full bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-none shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-slate-700">
        
        {/* Ligne décorative style Swiss-Grid */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>

        {/* En-tête minimaliste */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-500 text-xl">verified_user</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">SGL-CI MEMBER ACCREDITATION</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 font-black tracking-widest uppercase">
            {member.is_active ? 'ACTIF' : 'INACTIF'}
          </span>
        </div>

        {/* Détails du membre */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Avatar avec effet premium */}
          <div className="size-28 border border-slate-800 p-1 mb-4 bg-slate-950/50 hover:border-emerald-500/50 transition-colors duration-300">
            {member.image ? (
              <img 
                src={member.image} 
                alt={member.full_name} 
                className="w-full h-full object-cover grayscale contrast-[1.1] rounded-none"
              />
            ) : (
              <div className="w-full h-full bg-slate-950 flex items-center justify-center text-slate-700">
                <span className="material-symbols-outlined text-[48px]">person</span>
              </div>
            )}
          </div>

          <h2 className="text-slate-100 text-lg font-black tracking-tight uppercase mb-1">
            {member.full_name}
          </h2>
          <span className="text-emerald-400 text-xs font-black tracking-wider uppercase bg-emerald-950/20 px-3 py-1 border border-emerald-900/30">
            {member.role_display}
          </span>
        </div>

        {/* Caractéristiques de structure */}
        <div className="flex flex-col gap-2.5 border-t border-slate-800 pt-4 mb-6 text-xs">
          <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
            <span className="text-slate-500 uppercase tracking-widest text-[9px]">Église Locale</span>
            <span className="text-slate-200 font-bold max-w-[240px] truncate text-right">
              {member.eglise_nom} {member.eglise_ville && `(${member.eglise_ville})`}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
            <span className="text-slate-500 uppercase tracking-widest text-[9px]">Département</span>
            <span className="text-slate-200 font-bold max-w-[240px] truncate text-right">
              {member.departement}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
            <span className="text-slate-500 uppercase tracking-widest text-[9px]">Section</span>
            <span className="text-slate-200 font-bold max-w-[240px] truncate text-right">
              {member.section}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 uppercase tracking-widest text-[9px]">ID Unique</span>
            <span className="text-slate-400 font-bold tracking-widest text-[10px]">
              SGL-CI-{member.id.toString().padStart(5, '0')}
            </span>
          </div>
        </div>

        {/* Métadonnées de scan pour authenticité */}
        <div className="border-t border-slate-800 pt-4 flex flex-col gap-1 text-[9px] text-slate-500 uppercase tracking-widest">
          <div className="flex justify-between">
            <span>Scan Verified</span>
            <span className="text-slate-400 font-bold">{scanTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Gateway Cluster</span>
            <span className="text-slate-400 font-bold">SECURE-PORT-8000</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicVerifyMember;
