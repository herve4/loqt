import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UsersList from './UsersList';
import RegionManagerModal from '../components/RegionManagerModal';
import VilleManagerModal from '../components/VilleManagerModal';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('members'); // 'members' or 'system'
  
  // Modals for Regions & Villes
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isVilleOpen, setIsVilleOpen] = useState(false);

  // Security Gate: strictly restrict settings to super_admin
  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const tabStyle = (tabId) => {
    const active = activeTab === tabId;
    return `py-2.5 px-6 font-bold text-[10px] uppercase tracking-widest transition-all rounded-none border border-slate-800 cursor-pointer ${
      active 
        ? 'bg-slate-800 text-white border-slate-700 shadow-md' 
        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-900 hover:bg-slate-900/50'
    }`;
  };

  return (
    <div className="p-4 md:p-8 space-y-6 font-mono text-slate-100 min-h-screen">
      
      {/* Cockpit Page Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-sm font-black tracking-widest text-slate-100 uppercase">
          [ CONSOLE GLOBALE DE CONFIGURATION SGL-CI ]
        </h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
          CONCENTRATEUR DE PARAMÈTRES ADMINISTRATIFS ET STRUCTURELS DU CLUSTER LOQT
        </p>
      </div>

      {/* Tabs selectors */}
      <div className="flex gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => setActiveTab('members')}
          className={tabStyle('members')}
        >
          👥 UTILISATEURS & ACCÈS
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={tabStyle('system')}
        >
          ⚙️ CONFIGURATION SYSTEME
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'members' ? (
        <div className="animate-in fade-in duration-200">
          <UsersList />
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
          
          {/* Diagnostics Section */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8 space-y-6">
            <h2 className="text-xs font-black text-slate-200 tracking-widest uppercase border-b border-slate-800 pb-3">
              [ DIAGNOSTICS & ÉTAT DES NŒUDS LOQT ]
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[10px] leading-relaxed uppercase">
              
              <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-850">
                <p className="text-slate-450 font-black tracking-wider border-b border-slate-900 pb-1.5">[ PARAMÈTRES DE CONTRAT SGL ]</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">ORGANISATION :</span>
                  <span className="text-slate-300 font-bold">EBNG-CI (CÔTE D'IVOIRE)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">VERSION LOQT PRO :</span>
                  <span className="text-slate-300 font-bold">V2026.5.29-BUILD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">DOMAINE ACTIF :</span>
                  <span className="text-slate-300 font-bold">SGL.GRACE.CI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AUTORISATION :</span>
                  <span className="text-emerald-500 font-black">VALIDÉE (SUPER-ADMIN)</span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-950/40 p-4 border border-slate-850">
                <p className="text-slate-450 font-black tracking-wider border-b border-slate-900 pb-1.5">[ ÉTAT DE L'INFRASTRUCTURE ]</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">SERVEUR D'API :</span>
                  <span className="text-emerald-500 font-bold">DJANGO REST (OPÉRATIONNEL)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MOTEUR CLIENT :</span>
                  <span className="text-emerald-500 font-bold">REACT V18 / VITE V8 (ACTIF)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">BASE DE DONNÉES :</span>
                  <span className="text-emerald-500 font-bold">POSTGRESQL / SQLITE (OK)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ONBOARDING AUTO :</span>
                  <span className="text-slate-300 font-bold">ACTIVER PAR DÉFAUT</span>
                </div>
              </div>

            </div>
          </div>

          {/* Quick structural Management card */}
          <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8 space-y-6">
            <h2 className="text-xs font-black text-slate-200 tracking-widest uppercase border-b border-slate-800 pb-3">
              [ ÉLÉMENTS DE STRUCTURE DE L'ORGANISATION ]
            </h2>
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase">
              GÉREZ LA RÉPARTITION GÉOGRAPHIQUE ET LES UNITÉS TERRITORIALES DE TRANSPORT ET DE STOCKAGE LOGISTIQUE D'ÉGLISES.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={() => setIsRegionOpen(true)}
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 font-bold text-[10px] uppercase tracking-widest border border-slate-800 rounded-none transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xs">public</span>
                GÉRER LES RÉGIONS LOGISTIQUES
              </button>
              <button
                onClick={() => setIsVilleOpen(true)}
                className="flex-1 py-3 bg-slate-950 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 font-bold text-[10px] uppercase tracking-widest border border-slate-800 rounded-none transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-xs">location_city</span>
                GÉRER LES VILLES & DISTRICTS
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Modals triggered from settings control page */}
      <RegionManagerModal 
        isOpen={isRegionOpen}
        onClose={() => setIsRegionOpen(false)}
      />

      <VilleManagerModal
        isOpen={isVilleOpen}
        onClose={() => setIsVilleOpen(false)}
      />

    </div>
  );
};

export default Settings;
