import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import UserFormModal from '../components/UserFormModal';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const UsersList = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Load Members list (CRUD viewset)
  const { data: membersData, isLoading, isError } = useQuery({
    queryKey: ['members-list'],
    queryFn: () => logisticsService.getMembersList().then(res => res.data)
  });

  // Load Churches and Poles for lookup translation
  const { data: churchesData } = useQuery({
    queryKey: ['churches-selector'],
    queryFn: () => logisticsService.getEglises().then(res => res.data)
  });

  const { data: polesData } = useQuery({
    queryKey: ['poles-selector'],
    queryFn: () => logisticsService.getPoles().then(res => res.data)
  });

  const members = Array.isArray(membersData) ? membersData : (membersData?.results || []);
  const churches = Array.isArray(churchesData) ? churchesData : (churchesData?.results || []);
  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);

  // Lookup translations helper
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

  // Role translating & styling
  const rolesMap = {
    super_admin: { label: 'SUPER-ADMIN', style: 'bg-rose-950/20 text-rose-500 border-rose-900' },
    pasteur_national: { label: 'PASTEUR NAT.', style: 'bg-emerald-950/20 text-emerald-500 border-emerald-900' },
    rln: { label: 'RLN (NATIONAL)', style: 'bg-indigo-950/20 text-indigo-400 border-indigo-900' },
    pasteur_local: { label: 'PASTEUR LOC.', style: 'bg-sky-950/20 text-sky-400 border-sky-900' },
    rll: { label: 'RLL (LOCAL)', style: 'bg-amber-950/20 text-amber-500 border-amber-900' },
    technicien: { label: 'TECHNICIEN', style: 'bg-slate-800/40 text-slate-300 border-slate-700' }
  };

  // Toggle active state mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => logisticsService.updateMember(id, { is_active }),
    onSuccess: () => {
      toast.success('Statut mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['members-list'] });
    },
    onError: () => {
      toast.error('Impossible de modifier le statut de ce compte.');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => logisticsService.deleteMember(id),
    onSuccess: () => {
      toast.success('Membre supprimé définitivement.');
      queryClient.invalidateQueries({ queryKey: ['members-list'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.response?.data?.detail;
      toast.error(msg || "Erreur lors de la suppression de l'utilisateur.");
    }
  });

  // Event handlers
  const handleToggleActive = (user) => {
    toggleActiveMutation.mutate({ id: user.id, is_active: !user.is_active });
  };

  const handleOpenAdd = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  // Filter matching
  const filteredMembers = members.filter(user => {
    const searchString = `${user.first_name} ${user.last_name} ${user.email || ''} ${user.phone || ''}`.toLowerCase();
    const matchesSearch = searchString.includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 font-mono text-slate-100 min-h-screen">
      
      {/* Cockpit Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-sm font-black tracking-widest text-slate-100 uppercase">
            [ CONSOLE DES MEMBRES & UTILISATEURS ]
          </h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
            GESTION TECHNIQUE DES ACCÈS LOGISTIQUES ET ROLES DE L'ORGANISATION
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="py-2 px-4 bg-indigo-950/20 hover:bg-indigo-900/30 text-indigo-400 hover:text-indigo-300 font-bold text-[10px] uppercase tracking-widest transition-all rounded-none border border-indigo-900 active:scale-[0.98] cursor-pointer flex items-center gap-1.5 self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-xs">person_add</span>
          NOUVEAU MEMBRE
        </button>
      </div>

      {/* Live Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 p-4 border border-slate-800/80">
        
        {/* Search */}
        <div className="relative">
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-[11px] py-2 pl-9 pr-3 bg-slate-950 border border-slate-800 text-white rounded-none outline-none focus:border-slate-600 transition-colors placeholder:text-slate-600"
            placeholder="RECHERCHER NOM, TÉLÉPHONE ou EMAIL..."
            style={{ backgroundColor: '#020617', borderColor: '#1e293b' }}
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm select-none">
            search
          </span>
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-[11px] py-2 px-3 bg-slate-950 border border-slate-800 text-slate-350 rounded-none outline-none focus:border-slate-600 transition-colors cursor-pointer"
          style={{ backgroundColor: '#020617', borderColor: '#1e293b' }}
        >
          <option value="">[ TOUS LES RÔLES ADMINISTRATIFS ]</option>
          {Object.entries(rolesMap).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        {/* Counter */}
        <div className="flex items-center justify-end px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          MEMBRES ENREGISTRÉS : {filteredMembers.length} / {members.length}
        </div>
      </div>

      {/* Grid List View (Mobile optimized geometric grid / Monospace Table) */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-500 border border-dashed border-slate-800 tracking-widest uppercase">
          CHARGEMENT DE LA BASE DE DONNÉES UTILISATEURS...
        </div>
      ) : isError ? (
        <div className="py-20 text-center text-xs text-rose-500 border border-dashed border-rose-900 tracking-widest uppercase bg-rose-950/5">
          ERREUR CRITIQUE LORS DE LA RÉCUPÉRATION DES MEMBRES.
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-650 border border-dashed border-slate-800 tracking-widest uppercase">
          AUCUN COMPTE DE MEMBRE NE CORRESPOND À VOS FILTRES.
        </div>
      ) : (
        <div className="bg-slate-950/20 border border-slate-800 overflow-hidden">
          
          {/* Table for Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 font-bold tracking-widest text-[9px]">
                  <th className="py-3 px-4 uppercase">MEMBRE</th>
                  <th className="py-3 px-4 uppercase">RÔLE</th>
                  <th className="py-3 px-4 uppercase">AFFECTATION / COMPÉTENCE</th>
                  <th className="py-3 px-4 uppercase">CONTACTS</th>
                  <th className="py-3 px-4 uppercase text-center">STATUT</th>
                  <th className="py-3 px-4 uppercase text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-900 hover:bg-slate-900/30 transition-colors">
                    
                    {/* User Info */}
                    <td className="py-4 px-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden rounded-none flex-shrink-0">
                        {user.image ? (
                          <img src={user.image} alt={user.first_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-600 text-lg">person</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-200 text-xs uppercase tracking-wide">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                          {user.email || '[ AUCUN EMAIL ]'}
                        </p>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-4 px-4">
                      {rolesMap[user.role] ? (
                        <span className={`inline-block text-[9px] px-2 py-0.5 font-black border tracking-wider rounded-none uppercase ${rolesMap[user.role].style}`}>
                          {rolesMap[user.role].label}
                        </span>
                      ) : (
                        <span className="inline-block text-[9px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-none uppercase text-slate-400">
                          {user.role}
                        </span>
                      )}
                    </td>

                    {/* Assignments */}
                    <td className="py-4 px-4 space-y-1">
                      {user.role === 'technicien' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-slate-800 px-1 py-0.2 border border-slate-750 text-slate-450 uppercase font-black tracking-widest">[ PÔLE ]</span>
                          <span className="text-[10px] text-slate-300 font-bold uppercase">{getPoleName(user.pole)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] bg-slate-850 px-1 py-0.2 border border-slate-800 text-slate-400 uppercase font-black tracking-widest">[ ÉGLISE ]</span>
                          <span className="text-[10px] text-slate-300 font-bold uppercase">{getChurchName(user.eglise)}</span>
                        </div>
                      )}
                    </td>

                    {/* Phone details */}
                    <td className="py-4 px-4 font-mono text-[10px] text-slate-350 tracking-wider">
                      {user.phone || '-'}
                    </td>

                    {/* Active toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`inline-block py-1 px-3 text-[9px] font-black tracking-widest uppercase border rounded-none transition-all cursor-pointer ${
                          user.is_active 
                            ? 'bg-emerald-950/10 hover:bg-emerald-900/10 text-emerald-450 border-emerald-900' 
                            : 'bg-rose-950/10 hover:bg-rose-900/10 text-rose-500 border-rose-900'
                        }`}
                      >
                        {user.is_active ? 'ACTIF' : 'INACTIF'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-[9px] tracking-widest uppercase border border-slate-800 rounded-none transition-all active:scale-[0.98] cursor-pointer"
                      >
                        MODIFIER
                      </button>
                      <button
                        onClick={() => handleOpenDelete(user)}
                        className="py-1 px-2.5 bg-rose-950/10 hover:bg-rose-950/20 text-rose-500 hover:text-rose-400 font-bold text-[9px] tracking-widest uppercase border border-rose-950 rounded-none transition-all active:scale-[0.98] cursor-pointer"
                      >
                        SUPPRIMER
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cards for Mobile view */}
          <div className="block md:hidden divide-y divide-slate-900">
            {filteredMembers.map((user) => (
              <div key={user.id} className="p-4 space-y-4">
                
                {/* Header info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden rounded-none flex-shrink-0">
                    {user.image ? (
                      <img src={user.image} alt={user.first_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-650 text-xl">person</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 text-xs uppercase tracking-wide">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5 truncate uppercase">
                      {user.email || '[ SANS EMAIL ]'}
                    </p>
                  </div>
                </div>

                {/* Badges block */}
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">RÔLE</span>
                    {rolesMap[user.role] ? (
                      <span className={`inline-block text-[8px] px-2 py-0.5 font-black border tracking-wider rounded-none uppercase ${rolesMap[user.role].style}`}>
                        {rolesMap[user.role].label}
                      </span>
                    ) : (
                      <span className="inline-block text-[8px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-none uppercase text-slate-400">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">STATUT</span>
                    <button
                      onClick={() => handleToggleActive(user)}
                      className={`inline-block py-0.5 px-2 text-[8px] font-black tracking-widest uppercase border rounded-none transition-all cursor-pointer ${
                        user.is_active 
                          ? 'bg-emerald-950/10 text-emerald-450 border-emerald-950' 
                          : 'bg-rose-950/10 text-rose-500 border-rose-950'
                      }`}
                    >
                      {user.is_active ? 'ACTIF' : 'INACTIF'}
                    </button>
                  </div>
                </div>

                {/* Assignment details */}
                <div className="bg-slate-950/50 p-2.5 border border-slate-900 space-y-1.5 text-[10px]">
                  {user.role === 'technicien' ? (
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">PÔLE TECHNIQUE</span>
                      <span className="text-slate-300 font-bold uppercase truncate max-w-[180px]">{getPoleName(user.pole)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">RATTACHEMENT ÉGLISE</span>
                      <span className="text-slate-300 font-bold uppercase truncate max-w-[180px]">{getChurchName(user.eglise)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-900 font-mono">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest">TÉLÉPHONE</span>
                    <span className="text-slate-350 tracking-wider font-bold">{user.phone || '-'}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEdit(user)}
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-350 hover:text-white font-bold text-[9px] tracking-widest uppercase border border-slate-800 rounded-none transition-all cursor-pointer text-center"
                  >
                    MODIFIER
                  </button>
                  <button
                    onClick={() => handleOpenDelete(user)}
                    className="flex-1 py-1.5 bg-rose-950/10 hover:bg-rose-950/20 text-rose-500 hover:text-rose-450 font-bold text-[9px] tracking-widest uppercase border border-rose-950 rounded-none transition-all cursor-pointer text-center"
                  >
                    SUPPRIMER
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* User Form Modal */}
      <UserFormModal 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        userToEdit={selectedUser}
        isOwnProfile={false}
      />

      {/* Confirm Deletion Modal */}
      <ConfirmModal 
        isOpen={deleteConfirmOpen}
        title="DANGER : SUPPRESSION DÉFINITIVE DE MEMBRE"
        message={`Êtes-vous absolument sûr de vouloir supprimer définitivement le compte de ${userToDelete ? `${userToDelete.first_name.toUpperCase()} ${userToDelete.last_name.toUpperCase()}` : 'ce membre'} ? Cette action révoquera immédiatement tous ses accès et détruira ses liaisons historiques.`}
        onConfirm={() => deleteMutation.mutate(userToDelete.id)}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setUserToDelete(null);
        }}
      />

    </div>
  );
};

export default UsersList;
