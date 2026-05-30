import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import Layout from '../components/Layout';

const MembersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [selectedQR, setSelectedQR] = useState(null);

  // Charger la liste globale des membres
  const { data: membersData, isLoading, isError } = useQuery({
    queryKey: ['members-directory'],
    queryFn: () => logisticsService.getMembersList().then(res => res.data)
  });

  // Charger les pôles (départements)
  const { data: polesData } = useQuery({
    queryKey: ['poles-selector'],
    queryFn: () => logisticsService.getPoles().then(res => res.data)
  });

  // Charger les églises
  const { data: churchesData } = useQuery({
    queryKey: ['churches-selector'],
    queryFn: () => logisticsService.getEglises().then(res => res.data)
  });

  const members = Array.isArray(membersData) ? membersData : (membersData?.results || []);
  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);
  const churches = Array.isArray(churchesData) ? churchesData : (churchesData?.results || []);

  const getPoleName = (poleId) => {
    if (!poleId) return 'Aucun';
    const p = poles.find(item => item.id === poleId);
    return p ? p.nom : `Pôle #${poleId}`;
  };

  const getChurchName = (churchId) => {
    if (!churchId) return 'Non spécifiée';
    const c = churches.find(item => item.id === churchId);
    return c ? c.nom : `Église #${churchId}`;
  };

  const rolesMap = {
    super_admin: { label: 'SUPER-ADMIN', style: 'bg-rose-950/20 text-rose-500 border-rose-900' },
    pasteur_national: { label: 'PASTEUR NAT.', style: 'bg-emerald-950/20 text-emerald-500 border-emerald-900' },
    rln: { label: 'RLN (NATIONAL)', style: 'bg-indigo-950/20 text-indigo-400 border-indigo-900' },
    pasteur_local: { label: 'PASTEUR LOC.', style: 'bg-sky-950/20 text-sky-400 border-sky-900' },
    rll: { label: 'RLL (LOCAL)', style: 'bg-amber-950/20 text-amber-500 border-amber-900' },
    technicien: { label: 'TECHNICIEN', style: 'bg-slate-800/40 text-slate-300 border-slate-700' },
    
    // Nouveaux rôles
    pasteur: { label: 'PASTEUR', style: 'bg-emerald-950/20 text-emerald-500 border-emerald-900' },
    resp_dept: { label: 'RESP. DEPT.', style: 'bg-indigo-950/20 text-indigo-400 border-indigo-900' },
    adj_dept: { label: 'ADJ. DEPT.', style: 'bg-indigo-950/10 text-indigo-300 border-indigo-950' },
    resp_sec: { label: 'RESP. SEC.', style: 'bg-sky-950/20 text-sky-400 border-sky-900' },
    adj_sec: { label: 'ADJ. SEC.', style: 'bg-sky-950/10 text-sky-300 border-sky-950' },
    membre_dept: { label: 'MEMBRE DEPT.', style: 'bg-slate-800/40 text-slate-300 border-slate-700' },
    membre_sec: { label: 'MEMBRE SEC.', style: 'bg-slate-800/20 text-slate-400 border-slate-800' },
  };

  const filteredMembers = members.filter(user => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const phone = (user.phone || '').toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          email.includes(searchTerm.toLowerCase()) || 
                          phone.includes(searchTerm.toLowerCase());

    const matchesDept = !deptFilter || String(user.pole) === String(deptFilter);
    
    const matchesSection = !sectionSearch || 
                           (user.section || '').toLowerCase().includes(sectionSearch.toLowerCase());

    return matchesSearch && matchesDept && matchesSection;
  });

  const handleDownloadQR = (qrUrl, userName) => {
    if (!qrUrl) return;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_accreditation_${userName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout title="Annuaire Membres">
      <div className="flex-1 bg-background-light dark:bg-background-dark p-6 font-mono text-slate-900 dark:text-slate-300">
        
        {/* Header Monospace */}
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-black tracking-tight uppercase">
              [ 👥 ACCREDITATIONS & MEMBRES ]
            </h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">
              Annuaire structurel de la logistique EBNG-CI
            </p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
            <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-none animate-pulse"></span>
            <span>{filteredMembers.length} ACCRÉDITÉS FILTRÉS</span>
          </div>
        </div>

        {/* Barre de Filtres Monospace */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 mb-6 shadow-sm rounded-none">
          
          {/* Recherche textuelle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recherche Membre</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 text-xs rounded-none outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100"
                placeholder="Nom, Email, Téléphone..."
                type="text"
              />
            </div>
          </div>

          {/* Filtrage Département */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtrer par Département</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">handyman</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 text-xs rounded-none outline-none appearance-none cursor-pointer text-slate-900 dark:text-slate-100"
              >
                <option value="">Tous les Départements</option>
                {poles.map(p => (
                  <option key={p.id} value={p.id}>{p.nom.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recherche Section */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recherche Section</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">group_work</span>
              <input 
                value={sectionSearch}
                onChange={(e) => setSectionSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-800 text-xs rounded-none outline-none focus:border-primary transition-all text-slate-900 dark:text-slate-100"
                placeholder="Nom de section (Accueil, etc.)"
                type="text"
              />
            </div>
          </div>

        </div>

        {/* Grid de Cartes de Membres */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-800 border-t-primary rounded-none animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="bg-red-950/20 border border-red-900 text-red-400 p-4 text-xs">
            Erreur lors du chargement de l'annuaire des membres.
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-500 uppercase tracking-wider">
            Aucun membre trouvé avec ces critères.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map(user => {
              const roleConf = rolesMap[user.role] || { label: (user.role || 'MEMBRE').toUpperCase(), style: 'bg-slate-800/40 text-slate-300 border-slate-700' };
              const fullName = `${user.first_name} ${user.last_name}`;

              return (
                <div 
                  key={user.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-none shadow-sm relative flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300"
                >
                  
                  {/* Badge Actif/Inactif */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-none ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                      {user.is_active ? 'actif' : 'inactif'}
                    </span>
                  </div>

                  <div>
                    {/* Identité */}
                    <div className="flex gap-4 items-start mb-4">
                      {/* Avatar miniature */}
                      <div className="size-16 border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-950/50 flex-shrink-0">
                        {user.image ? (
                          <img 
                            src={user.image} 
                            alt={fullName} 
                            className="w-full h-full object-cover grayscale rounded-none"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 dark:bg-slate-950 flex items-center justify-center text-slate-400">
                            <span className="material-symbols-outlined text-2xl">person</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-slate-900 dark:text-slate-100 text-sm font-black uppercase line-clamp-1">
                          {fullName}
                        </h3>
                        <span className={`inline-block text-[8px] font-black tracking-widest uppercase border px-2 py-0.5 mt-1.5 ${roleConf.style}`}>
                          {roleConf.label}
                        </span>
                      </div>
                    </div>

                    {/* Infos structurelles */}
                    <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-3 text-[10px] text-slate-500 uppercase tracking-wider mb-4">
                      <div className="flex justify-between">
                        <span>Église</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold max-w-[160px] truncate text-right">
                          {getChurchName(user.eglise)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Département</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold max-w-[160px] truncate text-right">
                          {getPoleName(user.pole)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Section</span>
                        <span className="text-slate-700 dark:text-slate-300 font-bold max-w-[160px] truncate text-right">
                          {user.section || 'Aucune'}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-slate-50 dark:border-slate-800/40 pt-1.5 mt-1.5">
                        <span>Contact</span>
                        <span className="text-slate-600 dark:text-slate-400 font-mono text-[9px]">
                          {user.phone || user.email || 'Aucun'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section QR Code / Téléchargement */}
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between gap-4 mt-auto">
                    {user.qr_code ? (
                      <>
                        <div 
                          className="size-10 border border-slate-200 dark:border-slate-800 p-0.5 bg-white flex-shrink-0 cursor-pointer hover:border-primary transition-colors"
                          onClick={() => setSelectedQR(user)}
                          title="Agrandir le QR Code"
                        >
                          <img 
                            src={user.qr_code} 
                            alt="QR Code" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <button
                          onClick={() => handleDownloadQR(user.qr_code, fullName)}
                          className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white dark:hover:bg-primary transition-all text-slate-600 dark:text-slate-300 font-black py-2 text-[9px] uppercase tracking-widest text-center flex items-center justify-center gap-1.5 rounded-none border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span>
                          Télécharger Badge
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-2 text-[8px] text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800">
                        QR Code Non Généré
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Modal d'agrandissement QR Code */}
        {selectedQR && (
          <div 
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedQR(null)}
          >
            <div 
              className="bg-slate-900 border border-slate-800 p-6 max-w-[320px] w-full flex flex-col items-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedQR(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-slate-100"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
              <h3 className="text-slate-100 text-xs font-black uppercase tracking-widest text-center mb-4">
                Badge QR — {selectedQR.first_name} {selectedQR.last_name}
              </h3>
              
              {/* Boîte QR haute qualité */}
              <div className="size-52 bg-white p-2 border border-slate-800 mb-6 flex items-center justify-center">
                <img 
                  src={selectedQR.qr_code} 
                  alt="QR Code Agrandi" 
                  className="w-full h-full object-contain"
                />
              </div>

              <button
                onClick={() => {
                  handleDownloadQR(selectedQR.qr_code, `${selectedQR.first_name} ${selectedQR.last_name}`);
                  setSelectedQR(null);
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-2.5 text-[10px] uppercase tracking-widest text-center flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Télécharger l'image
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default MembersList;
