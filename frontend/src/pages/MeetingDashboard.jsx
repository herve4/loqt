import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { logisticsService } from '../services/api';

// ─── Sous-composants ──────────────────────────────────────────────────────────

const StatutBadge = ({ statut }) => {
  const today = new Date().toDateString();

  if (statut === 'en_cours') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
      <span className="size-1.5 rounded-full bg-orange-500 animate-pulse"></span>
      En cours
    </span>
  );
  if (statut === 'planifiee') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
      <span className="size-1.5 rounded-full bg-blue-500"></span>
      Planifiée
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
      <span className="size-1.5 rounded-full bg-slate-400"></span>
      Terminée
    </span>
  );
};

const computeStatut = (reunion) => {
  const reunionDate = new Date(reunion.date_reunion);
  const today = new Date();
  const todayStr = today.toDateString();
  const reunionStr = reunionDate.toDateString();

  if (reunionStr === todayStr) {
    const now = new Date();
    const [hd, md] = (reunion.heure_debut || '00:00').split(':').map(Number);
    const [hf, mf] = (reunion.heure_fin  || '23:59').split(':').map(Number);
    const debut = new Date(); debut.setHours(hd, md, 0);
    const fin   = new Date(); fin.setHours(hf, mf, 0);
    if (now >= debut && now <= fin) return 'en_cours';
    if (now > fin) return 'terminee';
    return 'planifiee';
  }
  return reunionDate < today ? 'terminee' : 'planifiee';
};

const ModalNouvelleReunion = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({ date_reunion: '', heure_debut: '20:00', heure_fin: '22:00', ordre_du_jour: '' });
  const { data: eglisesData } = useQuery({ queryKey: ['eglises'], queryFn: () => logisticsService.getEglises().then(r => r.data) });
  const eglises = eglisesData?.results || [];

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Planifier une Réunion</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Église Hôte</label>
            <select name="eglise_hote" onChange={handleChange} className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-11 px-3 text-sm">
              <option value="">Sélectionner une église…</option>
              {eglises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3 md:col-span-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Date</label>
              <input type="date" name="date_reunion" value={form.date_reunion} onChange={handleChange}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-11 px-3 text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Début</label>
              <input type="time" name="heure_debut" value={form.heure_debut} onChange={handleChange}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-11 px-3 text-sm" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Fin</label>
              <input type="time" name="heure_fin" value={form.heure_fin} onChange={handleChange}
                className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-11 px-3 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ordre du Jour</label>
            <textarea name="ordre_du_jour" value={form.ordre_du_jour} onChange={handleChange} rows={3}
              placeholder="Points à aborder lors de la réunion…"
              className="w-full rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-primary" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => onSubmit(form)} className="flex-1 h-11 bg-primary text-white font-bold rounded-lg">
            Confirmer
          </button>
          <button onClick={onClose} className="h-11 px-6 border border-slate-200 dark:border-slate-700 rounded-lg font-bold">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────

const MeetingDashboard = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: reunionsData, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['reunions', page, activeTab],
    queryFn: () => logisticsService.getReunions({ 
      page,
      // Note: On pourrait ajouter des filtres de date ici si le backend est configuré pour lte/gte
    }).then(r => r.data),
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000
  });

  const createMutation = useMutation({
    mutationFn: (data) => logisticsService.postReunion(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['reunions']);
      setShowModal(false);
    },
  });

  const isPaginated = !Array.isArray(reunionsData) && reunionsData?.results;
  const rawReunions = isPaginated ? reunionsData.results : (Array.isArray(reunionsData) ? reunionsData : []);
  const totalCount = isPaginated ? reunionsData.count : rawReunions.length;
  const totalPages = isPaginated ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  const reunions = rawReunions.map(r => ({ ...r, statut: computeStatut(r) }));

  // Pour l'instant, si on ne filtre pas via le serveur pour past/upcoming, on affiche tout ce qui vient de la page
  // Mais l'utilisateur s'attend à voir SEULEMENT les réunions de la catégorie sélectionnée.
  // Idéalement, il faudrait filtrer côté serveur.
  const displayList = reunions; 

  const ongoing = reunions.filter(r => r.statut === 'en_cours');

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">

        {/* En-tête */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
              Tableau de Bord — Réunions
            </p>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Gérez et suivez les séances logistiques du dimanche dans toutes les régions.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg h-11 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Planifier une Réunion
          </button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Réunions" value={totalCount} icon="event" color="text-primary" note="Toutes sessions confondues" />
          <StatCard label="En cours"      value={ongoing.length}  icon="pending" color="text-orange-500" note="Surveillance active" />
          <StatCard label="Participants (Dernière)" value={reunions[0]?.participants_count || 0} icon="group" color="text-emerald-500" note="Sur la session la plus récente" />
        </div>

        {/* Table des réunions */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Onglets */}
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 pt-4 flex gap-8 overflow-x-auto">
            {[
              { key: 'upcoming', label: 'À venir' },
              { key: 'past',     label: 'Sessions passées' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Détails de la Réunion</th>
                  <th className="px-6 py-4">Église Hôte</th>
                  <th className="px-6 py-4">Date & Heure</th>
                  <th className="px-6 py-4">Participants</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading && !isPlaceholderData ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400">Chargement des réunions…</td></tr>
                ) : displayList.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-10 text-center text-slate-400">Aucune réunion trouvée.</td></tr>
                ) : displayList.map(reunion => (
                  <tr key={reunion.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${reunion.statut === 'terminee' ? 'opacity-75' : ''}`}>
                    <td className="px-6 py-4">
                      <Link to={`/meetings/${reunion.id}`} className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate max-w-[220px] hover:text-primary transition-colors block">
                        {reunion.ordre_du_jour?.split('\n')[0] || 'Réunion Logistique'}
                      </Link>
                      <div className="text-xs text-slate-500 font-mono">LOG-{String(reunion.id).padStart(4, '0')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${reunion.statut !== 'terminee' ? 'bg-primary/10' : 'bg-slate-200 dark:bg-slate-800'} flex items-center justify-center`}>
                          <span className={`material-symbols-outlined text-sm ${reunion.statut !== 'terminee' ? 'text-primary' : 'text-slate-500'}`}>church</span>
                        </div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{reunion.eglise_hote_nom || '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(reunion.date_reunion)}</div>
                      <div className="text-xs text-slate-500">{reunion.heure_debut?.substring(0,5)} – {reunion.heure_fin?.substring(0,5)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {reunion.participants_count ?? 0} participant{reunion.participants_count > 1 ? 's' : ''}
                    </td>
                    <td className="px-6 py-4">
                      <StatutBadge statut={reunion.statut} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {reunion.statut === 'en_cours' ? (
                        <button className="text-primary hover:text-primary/80 font-bold text-sm">Rejoindre</button>
                      ) : reunion.statut === 'terminee' ? (
                        <button className="text-primary font-bold text-sm">Consulter</button>
                      ) : (
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              Affichage de <span className="text-slate-900 dark:text-white font-bold">{Math.min(displayList.length, totalCount)}</span> sur <span className="text-slate-900 dark:text-white font-bold">{totalCount}</span> réunion{totalCount > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-white dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
                className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>

        {/* Section carte + responsables régionaux */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

          {/* Carte des lieux */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Emplacements des Lieux
              </h3>
              <button className="text-xs text-primary font-bold">Voir la Carte Complète</button>
            </div>
            <div className="flex-1 relative bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(135deg, #dde9f8 0%, #c3d9f5 100%)',
              }} />
              {/* Grille décorative */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(0deg,#1745cf 0,#1745cf 1px,transparent 0,transparent 40px),repeating-linear-gradient(90deg,#1745cf 0,#1745cf 1px,transparent 0,transparent 40px)',
                backgroundSize: '40px 40px',
              }} />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
              {/* Marqueurs animés */}
              <div className="absolute top-1/4 left-1/3 size-6 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="size-2 bg-white rounded-full" />
              </div>
              <div className="absolute bottom-1/2 right-1/4 size-6 bg-primary rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="size-2 bg-white rounded-full" />
              </div>
              <div className="absolute top-2/3 left-1/2 size-6 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="size-2 bg-white rounded-full" />
              </div>
              {/* Label */}
              <div className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 px-3 py-1 rounded-full shadow text-xs font-bold text-slate-700 dark:text-slate-200">
                {totalCount} lieux actifs
              </div>
            </div>
          </div>

          {/* Responsables régionaux */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">group</span>
              Responsables Régionaux
            </h3>
            <div className="space-y-4">
              {[
                { initials: 'JK', name: 'Jean-Marc Kouassi', role: 'Responsable National', color: 'bg-primary/20 text-primary' },
                { initials: 'SD', name: 'Sarah Diallo',      role: 'Coordinatrice Centrale', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' },
                { initials: 'MK', name: 'Moussa Koné',       role: 'Responsable Audio/Vidéo', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700' },
              ].map(person => (
                <div key={person.initials} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full ${person.color} flex items-center justify-center font-bold text-sm`}>
                      {person.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{person.name}</p>
                      <p className="text-xs text-slate-500">{person.role}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 hover:text-primary cursor-pointer transition-colors">chat</span>
                </div>
              ))}
              <button className="w-full py-3 mt-2 text-sm font-bold text-primary bg-primary/5 rounded-lg border border-dashed border-primary/30 hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">person_add</span>
                Inviter un Membre
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <ModalNouvelleReunion
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
        />
      )}
    </div>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon, color, note }) => (
  <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
    <div className="flex justify-between items-center">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
      <span className={`material-symbols-outlined ${color}`}>{icon}</span>
    </div>
    <p className="text-slate-900 dark:text-slate-100 tracking-tight text-3xl font-bold">{String(value).padStart(2, '0')}</p>
    <div className="text-xs text-slate-400">{note}</div>
  </div>
);

export default MeetingDashboard;
