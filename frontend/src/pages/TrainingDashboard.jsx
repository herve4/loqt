import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import { logisticsService } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE = {
  PENDING: { label: 'En attente', color: 'bg-blue-100 text-blue-800' },
  APPROVED: { label: 'Approuvée', color: 'bg-green-100 text-green-800' },
  REJECTED: { label: 'Rejetée', color: 'bg-red-100 text-red-800' },
  COMPLETED: { label: 'Terminée', color: 'bg-slate-100 text-slate-800' },
};

const SESSION_STATUS = {
  PLANNING: { label: 'En préparation', color: 'bg-yellow-500' },
  CONFIRMED: { label: 'Confirmée', color: 'bg-green-500' },
  CANCELLED: { label: 'Annulée', color: 'bg-red-500' },
  COMPLETED: { label: 'Terminée', color: 'bg-blue-500' },
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const getMonth = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase() : '';

const getDay = (d) =>
  d ? new Date(d).getDate() : '';

// ─── Modal Nouvelle Demande ────────────────────────────────────────────────────

const ModalNouvelleDemande = ({ onClose, onSubmit, isLoading }) => {
  const [form, setForm] = useState({ formation: '', nombre_participants: 1, eglise: '', notes: '' });
  
  const { data: eglisesData } = useQuery({
    queryKey: ['eglises'],
    queryFn: () => logisticsService.getEglises({ page_size: 100 }).then(r => r.data),
  });

  const { data: formationsData } = useQuery({
    queryKey: ['formations'],
    queryFn: () => logisticsService.getFormations({ page_size: 100 }).then(r => r.data),
  });

  const eglises = eglisesData?.results || [];
  const formations = formationsData?.results || [];

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-8 relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Nouvelle Demande de Formation</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Thème de Formation</label>
            <select name="formation" value={form.formation} onChange={handleChange}
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-12 px-4 text-sm focus:ring-primary">
              <option value="">Sélectionner un thème…</option>
              {formations.map(f => <option key={f.id} value={f.id}>{f.titre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Église locale</label>
            <select name="eglise" value={form.eglise} onChange={handleChange}
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-12 px-4 text-sm focus:ring-primary">
              <option value="">Sélectionner votre église…</option>
              {eglises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nombre de participants (estimé)</label>
            <input type="number" name="nombre_participants" value={form.nombre_participants} onChange={handleChange}
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-12 px-4 text-sm focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Notes complémentaires</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
              placeholder="Précisez vos besoins spécifiques…"
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4 text-sm focus:ring-primary" />
          </div>
        </div>
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => onSubmit(form)}
            disabled={isLoading}
            className="flex-1 h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Envoi…' : 'Envoyer la Demande'}
          </button>
          <button onClick={onClose} className="h-12 px-6 border border-slate-200 dark:border-slate-700 rounded-xl font-bold">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TrainingDashboard = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions-formation'],
    queryFn: () => logisticsService.getSessionsFormation({ page_size: 100 }).then(r => r.data),
  });

  const { data: demandesData, isLoading: demandesLoading } = useQuery({
    queryKey: ['demandes-formation', page],
    queryFn: () => logisticsService.getDemandesFormation({ page }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => logisticsService.postDemandeFormation(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['demandes-formation']);
      setShowModal(false);
    },
  });

  const sessions = sessionsData?.results || [];
  const demandes = demandesData?.results || [];
  const totalCount = demandesData?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  const pendingCount = demandes.filter(d => d.statut === 'PENDING').length;
  const upcomingSessions = sessions.filter(s => s.statut === 'CONFIRMED' || s.statut === 'PLANNING').length;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 lg:px-40 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 text-primary">
              <span className="material-symbols-outlined text-3xl">local_shipping</span>
              <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight">SGL-CI</h2>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 lg:px-40 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Profil Sidebar */}
            <aside className="w-full lg:w-64 flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 rounded-full p-2">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-bold truncate">Utilisateur Logistique</h3>
                    <p className="text-xs text-slate-500">Gestionnaire Local</p>
                  </div>
                </div>
                <nav className="space-y-1">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white">
                    <span className="material-symbols-outlined text-xl">school</span>
                    <span className="text-sm font-medium">Formation</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <span className="material-symbols-outlined text-xl">history</span>
                    <span className="text-sm font-medium">Historique</span>
                  </button>
                </nav>
              </div>

              <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-xl border border-primary/20">
                <h4 className="text-sm font-bold text-primary mb-2">Besoin d'aide ?</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Contactez le département central de formation pour des demandes spécifiques.
                </p>
                <button className="w-full py-2 bg-white dark:bg-slate-800 border border-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/5">
                  Contacter le support
                </button>
              </div>
            </aside>

            {/* Contenu Principal */}
            <div className="flex-1 flex flex-col gap-8">
              {/* Header Page */}
              <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight">Gestion des Formations</h1>
                  <p className="text-slate-500 mt-1">Gérez et demandez des sessions de formation pour votre équipe logistique.</p>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                  <span className="material-symbols-outlined">add</span>
                  Nouvelle Demande
                </button>
              </section>

              {/* Stats */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-slate-500 text-sm font-medium">Demandes en attente</p>
                  <div className="flex items-end justify-between mt-2">
                    <h3 className="text-3xl font-bold">{pendingCount}</h3>
                    <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-lg">Actif</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-slate-500 text-sm font-medium">Sessions à venir</p>
                  <div className="flex items-end justify-between mt-2">
                    <h3 className="text-3xl font-bold">{upcomingSessions}</h3>
                    <span className="text-slate-400 text-xs font-medium">Confirmées / En prép.</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <p className="text-slate-500 text-sm font-medium">Conformité de l'équipe</p>
                  <div className="flex items-end justify-between mt-2">
                    <h3 className="text-3xl font-bold text-green-600">92%</h3>
                    <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">Performance</span>
                  </div>
                </div>
              </section>

              {/* Prochaines sessions */}
              <section>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">calendar_month</span>
                  Événements de Formation à Venir
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessionsLoading ? (
                    <div className="col-span-2 py-10 text-center text-slate-400">Chargement des sessions…</div>
                  ) : sessions.length === 0 ? (
                    <div className="col-span-2 py-10 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300">
                      Aucune session planifiée pour le moment.
                    </div>
                  ) : sessions.map(session => (
                    <div key={session.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary transition-colors cursor-pointer group">
                      <div className="size-16 rounded-xl bg-primary/5 flex flex-col items-center justify-center text-primary border border-primary/10 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="text-xs font-bold">{getMonth(session.date_debut)}</span>
                        <span className="text-xl font-black">{getDay(session.date_debut)}</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-sm truncate">{session.formation_titre}</h4>
                        <p className="text-xs text-slate-500 mt-1 truncate">Lieu : {session.lieu || 'A définir'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`w-2 h-2 rounded-full ${SESSION_STATUS[session.statut]?.color || 'bg-slate-400'}`}></span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {SESSION_STATUS[session.statut]?.label || session.statut}
                          </span>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-primary">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Historique des demandes */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h2 className="text-xl font-bold">Historique Récent des Demandes</h2>
                  <button className="text-primary text-sm font-bold hover:underline">Voir Tout</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4 font-bold">Thème de Formation</th>
                        <th className="px-6 py-4 font-bold">Date Demande</th>
                        <th className="px-6 py-4 font-bold">Participants</th>
                        <th className="px-6 py-4 font-bold">Statut</th>
                        <th className="px-6 py-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {demandesLoading ? (
                        <tr><td colSpan="5" className="px-6 py-10 text-center">Chargement des demandes…</td></tr>
                      ) : demandes.length === 0 ? (
                        <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">Aucune demande effectuée.</td></tr>
                      ) : demandes.map(demande => (
                        <tr key={demande.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-sm">{demande.formation_titre}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{formatDate(demande.date_demande)}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{demande.nombre_participants} inscrits</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[demande.statut]?.color || 'bg-slate-100'}`}>
                              {STATUS_BADGE[demande.statut]?.label || demande.statut}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button className="text-primary hover:underline text-sm font-bold">Détails</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Page {page} sur {totalPages} ({totalCount} demandes)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-10 px-4 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-none transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-0 active:scale-[0.98]"
                      >
                        Précédent
                      </button>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="h-10 px-4 text-xs font-black uppercase tracking-widest bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-none transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-0 active:scale-[0.98]"
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Call to action */}
              <section className="bg-primary/5 border border-primary/20 rounded-2xl p-8 relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">Prêt à former votre équipe ?</h3>
                    <p className="text-slate-600 dark:text-slate-400 mt-2">
                      Remplissez le formulaire de demande pour commencer avec une formation personnalisée adaptée aux besoins logistiques de votre site.
                    </p>
                    <div className="flex gap-4 mt-6">
                      <button onClick={() => setShowModal(true)} className="bg-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                        Lancer une demande
                      </button>
                      <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                        Parcourir le catalogue
                      </button>
                    </div>
                  </div>
                  <div className="w-full md:w-64 h-40 bg-gradient-to-br from-primary to-blue-400 rounded-xl overflow-hidden relative shadow-2xl flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-6xl opacity-30">school</span>
                  </div>
                </div>
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
              </section>
            </div>
          </div>
        </main>

        <footer className="px-6 lg:px-40 py-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 text-slate-400">
              <span className="material-symbols-outlined">local_shipping</span>
              <p className="text-sm font-medium">© 2024 SGL-CI Logistics. Tous droits réservés.</p>
            </div>
            <div className="flex gap-8">
              <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Vie privée</a>
              <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Conditions d'utilisation</a>
              <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Centre de contact</a>
            </div>
          </div>
        </footer>
      </div>

      {showModal && (
        <ModalNouvelleDemande
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}
    </div>
  );
};

export default TrainingDashboard;
