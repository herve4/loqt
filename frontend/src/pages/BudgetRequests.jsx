import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { logisticsService } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ETAPES = {
  RLL:     { label: 'En attente RLL',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500',    dot: 'bg-amber-500' },
  RLN:     { label: 'En attente RLN',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-500',        dot: 'bg-blue-500' },
  PASTEUR: { label: 'En attente Pasteur', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-500', dot: 'bg-indigo-500' },
  VALIDE:  { label: 'Approuvée',          color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-500', dot: 'bg-emerald-500' },
  REFUSE:  { label: 'Rejetée',            color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-500',        dot: 'bg-rose-500' },
};

const StatutBadge = ({ etape }) => {
  const cfg = ETAPES[etape] || ETAPES.RLL;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`}></span>
      {cfg.label}
    </span>
  );
};

const formatAmount = (amount) =>
  amount != null ? `${Number(amount).toLocaleString('fr-FR')} FCFA` : '—';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

// ─── Modal Nouvelle Demande ────────────────────────────────────────────────────

const ModalNouvelleDemande = ({ onClose, onSubmit, isLoading }) => {
  const [form, setForm] = useState({ liste_materiel: '', estimation_budget: '', eglise: '' });
  const { data: eglisesData } = useQuery({
    queryKey: ['eglises'],
    queryFn: () => logisticsService.getEglises().then(r => r.data),
  });
  const eglises = eglisesData?.results || [];
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Nouvelle Demande Budgétaire</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Église / Unité</label>
            <select name="eglise" value={form.eglise} onChange={handleChange}
              className="w-full rounded border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-11 px-3 text-sm focus:ring-primary">
              <option value="">Sélectionner une église…</option>
              {eglises.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Liste du Matériel</label>
            <textarea name="liste_materiel" value={form.liste_materiel} onChange={handleChange} rows={4}
              placeholder="Ex : Ciment (50 sacs), Câbles audio (10m)…"
              className="w-full rounded border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3 text-sm focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">Estimation Budgétaire (FCFA)</label>
            <input type="number" name="estimation_budget" value={form.estimation_budget} onChange={handleChange}
              placeholder="Ex : 150000"
              className="w-full rounded border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 h-11 px-3 text-sm focus:ring-primary" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onSubmit(form)}
            disabled={isLoading}
            className="flex-1 h-11 bg-primary text-white font-bold rounded hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isLoading ? 'Envoi…' : 'Soumettre la Demande'}
          </button>
          <button onClick={onClose} className="h-11 px-6 border border-slate-200 dark:border-slate-700 rounded font-bold">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Page Principale ──────────────────────────────────────────────────────────

const BudgetRequests = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [filtre, setFiltre] = useState('all');   // 'all' | 'pending' | 'archived'
  const [etapeFiltre, setEtapeFiltre] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: expressionsData, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['expressions', page, search, etapeFiltre, filtre],
    queryFn: () => logisticsService.getExpressions({ 
      page, 
      search: search || undefined,
      etape_circuit: etapeFiltre || undefined,
      // On peut ajouter une logique pour 'filtre' (pending/archived) si le backend le supporte via filterset
    }).then(r => r.data),
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000
  });

  const createMutation = useMutation({
    mutationFn: (data) => logisticsService.postExpression(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expressions']);
      setShowModal(false);
    },
  });

  const isPaginated = !Array.isArray(expressionsData) && expressionsData?.results;
  const filtered = isPaginated ? expressionsData.results : (Array.isArray(expressionsData) ? expressionsData : []);
  const totalCount = isPaginated ? expressionsData.count : filtered.length;
  const totalPages = isPaginated ? Math.ceil(totalCount / PAGE_SIZE) : 1;
  const paginated = filtered; // Déjà paginé par le serveur

  // Statistiques (Note: seront basées sur la page actuelle si on n'a pas d'endpoint stats dédié)
  const pendingCount    = isPaginated ? totalCount : filtered.filter(e => !['VALIDE','REFUSE'].includes(e.etape_circuit)).length;
  const approuvedCount  = filtered.filter(e => e.etape_circuit === 'VALIDE').length;
  const pageBudget = filtered.reduce((s, e) => s + Number(e.estimation_budget || 0), 0);

  return (
    <Layout 
      title="Demandes Budgétaires"
      headerActions={
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 text-sm cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Nouvelle Demande
        </button>
      }
    >
      <main className="flex-1 px-6 md:px-10 py-8 max-w-[1440px] mx-auto w-full">
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
          Examinez et approuvez les demandes d'achat dans toutes les unités RLL / échanges d'expression de besoins.
        </p>

          {/* Barre de filtres */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {/* Tabs filtre */}
            <div className="flex bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 p-1 gap-0">
              {[
                { key: 'all',      label: 'Toutes' },
                { key: 'pending',  label: 'En attente' },
                { key: 'archived', label: 'Archivées' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => { setFiltre(f.key); setPage(1); }}
                  className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${
                    filtre === f.key ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            {/* Filtre statut */}
            <div className="relative">
              <select
                value={etapeFiltre}
                onChange={e => { setEtapeFiltre(e.target.value); setPage(1); }}
                className="appearance-none pl-4 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-sm font-semibold focus:ring-primary"
              >
                <option value="">Statut : Tous</option>
                <option value="RLL">En attente RLL</option>
                <option value="RLN">En attente RLN</option>
                <option value="PASTEUR">En attente Pasteur</option>
                <option value="VALIDE">Approuvées</option>
                <option value="REFUSE">Rejetées</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
            </div>

            {/* Recherche */}
            <div className="flex items-center bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 px-3 py-1.5 gap-2">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Rechercher…"
                className="bg-transparent border-0 focus:border-0 border-transparent focus:border-transparent focus:ring-0 focus:ring-transparent outline-none focus:outline-none text-sm w-44 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total En Attente" value={pendingCount} badge="Actif" badgeColor="text-primary bg-primary/10" />
            <StatCard label="Budget (Cette Page)" value={`${pageBudget.toLocaleString('fr-FR')} FCFA`} badge="FCFA" badgeColor="text-slate-400" />
            <StatCard label="Approuvées" value={approuvedCount} badge="Succès" badgeColor="text-emerald-600 bg-emerald-50" textColor="text-emerald-600" />
            <StatCard label="Total Demandes" value={totalCount} badge="Global" badgeColor="text-slate-400" />
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">N° Demande</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Matériel Demandé</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Demandeur</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Montant Est.</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {isLoading && !isPlaceholderData ? (
                    <tr><td colSpan="7" className="px-6 py-10 text-center text-slate-400">Chargement des demandes…</td></tr>
                  ) : paginated.length === 0 ? (
                    <tr><td colSpan="7" className="px-6 py-10 text-center text-slate-400">Aucune demande trouvée.</td></tr>
                  ) : paginated.map(expr => {
                    const lines = expr.liste_materiel?.split('\n') || [];
                    const titre = lines[0]?.trim() || 'Demande de matériel';
                    const sousLigne = lines.slice(1).join(', ') || '';
                    return (
                      <tr key={expr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-primary">#RQ-{String(expr.id).padStart(4, '0')}</td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{titre}</div>
                          {sousLigne && <div className="text-xs text-slate-500 truncate max-w-[200px]">{sousLigne}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                          {expr.eglise_nom || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium whitespace-nowrap">
                          {formatDate(expr.date_demande)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatAmount(expr.estimation_budget)}
                        </td>
                        <td className="px-6 py-4">
                          <StatutBadge etape={expr.etape_circuit || 'RLL'} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/budget/${expr.id}`}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex"
                          >
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Affichage de{' '}
                <span className="font-bold text-slate-900 dark:text-white">{(page - 1) * PAGE_SIZE + 1}</span>
                {' '}à{' '}
                <span className="font-bold text-slate-900 dark:text-white">{Math.min(page * PAGE_SIZE, totalCount)}</span>
                {' '}sur{' '}
                <span className="font-bold text-slate-900 dark:text-white">{totalCount}</span> demandes
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 border rounded text-sm font-bold transition-colors ${
                      page === p
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || totalPages === 0}
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 px-6 md:px-10 py-6 bg-white dark:bg-background-dark">
          <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 opacity-50">
              <div className="h-6 w-6 flex items-center justify-center rounded bg-slate-900 dark:bg-white text-white dark:text-slate-900">
                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
              </div>
              <span className="text-sm font-bold tracking-tight">SGL-CI Logistics System</span>
            </div>
            <div className="flex items-center gap-8">
              <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Politique de Confidentialité</a>
              <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Documentation</a>
              <a className="text-sm text-slate-500 hover:text-primary transition-colors" href="#">Support</a>
            </div>
            <p className="text-sm text-slate-400">© 2024 SGL-CI. Tous droits réservés.</p>
          </div>
        </footer>

      {showModal && (
        <ModalNouvelleDemande
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}
    </Layout>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, badge, badgeColor, textColor = 'text-slate-900 dark:text-white' }) => (
  <div className="bg-white dark:bg-slate-900 p-5 rounded border border-slate-200 dark:border-slate-800">
    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
    <div className="flex items-end justify-between mt-2">
      <h3 className={`text-2xl font-black ${textColor}`}>{value}</h3>
      <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeColor}`}>{badge}</span>
    </div>
  </div>
);

export default BudgetRequests;
