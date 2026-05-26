import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { logisticsService } from '../services/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statutColorMap = {
  'en_cours': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
  'planifiee': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  'terminee':  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

const statutLabel = { en_cours: 'En cours', planifiee: 'À venir', terminee: 'Terminée' };

const computeStatut = (reunion) => {
  if (!reunion) return 'planifiee';
  const reunionDate = new Date(reunion.date_reunion);
  const today = new Date();
  if (reunionDate.toDateString() === today.toDateString()) {
    const [hd, md] = (reunion.heure_debut || '00:00').split(':').map(Number);
    const [hf, mf] = (reunion.heure_fin || '23:59').split(':').map(Number);
    const debut = new Date(); debut.setHours(hd, md, 0);
    const fin   = new Date(); fin.setHours(hf, mf, 0);
    if (today >= debut && today <= fin) return 'en_cours';
    if (today > fin) return 'terminee';
    return 'planifiee';
  }
  return reunionDate < today ? 'terminee' : 'planifiee';
};

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  : '—';

// Parse ordre_du_jour lines into agenda items
const parseAgenda = (text = '') => {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map((line, i) => {
    const match = line.match(/^(\d{1,2}[h:]\d{0,2})\s*[–-]?\s*(.+)/i);
    return match
      ? { heure: match[1], titre: match[2], responsable: '' }
      : { heure: `Point ${i + 1}`, titre: line.trim(), responsable: '' };
  });
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const InitialAvatar = ({ name = '', color = 'bg-primary/20 text-primary', size = 'size-10' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  return <div className={`${size} rounded-full ${color} flex items-center justify-center font-bold text-sm shrink-0`}>{initials}</div>;
};

const ActionItem = ({ text, completed, assignee, due, onToggle }) => (
  <div className="flex gap-3 items-start p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
    <input
      type="checkbox"
      checked={completed}
      onChange={onToggle}
      className="mt-1 rounded text-primary focus:ring-primary border-slate-300"
    />
    <div>
      <p className={`text-sm font-medium ${completed ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-slate-100'}`}>{text}</p>
      <p className="text-[10px] text-slate-500">{completed ? 'Complété' : `${assignee} • Échéance : ${due}`}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState('');
  const [actions, setActions] = useState([
    { id: 1, text: 'Confirmer le lieu pour la retraite de décembre', completed: false, assignee: '@Coordinateur', due: '25 oct.' },
    { id: 2, text: 'Rédiger la newsletter de sensibilisation', completed: false, assignee: '@Secrétaire', due: '28 oct.' },
    { id: 3, text: 'Partager le rapport financier', completed: true, assignee: '@Trésorier', due: '' },
  ]);
  const saveTimerRef = useRef(null);

  const { data: reunion, isLoading } = useQuery({
    queryKey: ['reunion', id],
    queryFn: () => logisticsService.getReunionById(id).then(r => r.data),
    enabled: !!id,
  });

  const saveMutation = useMutation({
    mutationFn: (pv) => logisticsService.patchReunion(id, { pv_reunion: pv }),
    onSuccess: () => queryClient.invalidateQueries(['reunion', id]),
  });

  useEffect(() => {
    if (reunion?.pv_reunion) setNotes(reunion.pv_reunion);
  }, [reunion]);

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => saveMutation.mutate(e.target.value), 2000);
  };

  const toggleAction = (id) => setActions(actions.map(a => a.id === id ? { ...a, completed: !a.completed } : a));
  const completedCount = actions.filter(a => a.completed).length;
  const completionPct = Math.round((completedCount / actions.length) * 100);

  const statut = computeStatut(reunion);
  const agendaItems = parseAgenda(reunion?.ordre_du_jour);
  const participants = reunion?.participants || [];

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <div className="text-center">
        <span className="material-symbols-outlined text-primary text-5xl animate-spin block">sync</span>
        <p className="mt-4 text-slate-500">Chargement de la réunion…</p>
      </div>
    </div>
  );

  return (
    <Layout
      title="Détail de la Réunion"
      showBackButton={true}
      onBack={() => navigate(-1)}
      headerActions={
        <div className="flex items-center gap-2">
          <button className="hidden md:flex items-center justify-center rounded h-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-[20px]">calendar_month</span>
          </button>
          <button className="hidden md:flex items-center justify-center rounded h-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-[20px]">share</span>
          </button>
          {statut === 'en_cours' && (
            <Link to="/meetings" className="bg-primary text-white font-bold px-4 py-2 rounded hover:bg-primary/90 flex items-center gap-1 text-sm">
              <span className="material-symbols-outlined text-sm">radio_button_checked</span>
              Rejoindre
            </Link>
          )}
        </div>
      }
    >

        <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col gap-6">

          {/* Hero Card */}
          <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="h-48 w-full relative" style={{
              background: 'linear-gradient(135deg, #1745cf 0%, #0f2d8a 60%, #111521 100%)',
            }}>
              {/* Decorative grid */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 0,transparent 30px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 0,transparent 30px)',
                backgroundSize: '30px 30px',
              }} />
              <div className="absolute bottom-4 left-6">
                <span className={`${statutColorMap[statut]} text-xs font-bold px-2 py-1 rounded mb-2 inline-block`}>
                  {statutLabel[statut]?.toUpperCase()}
                </span>
                <h1 className="text-white text-3xl font-bold">
                  {reunion?.ordre_du_jour?.split('\n')[0] || 'Réunion Logistique du Dimanche'}
                </h1>
              </div>
            </div>

            <div className="p-6 flex flex-col md:flex-row gap-6 items-start justify-between">
              <div className="flex gap-4">
                <div className="size-16 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl">church</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold">{reunion?.eglise_hote_nom || '—'}</h3>
                  <p className="text-slate-500 flex items-center gap-1 text-sm">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {reunion?.eglise_hote_nom || 'Lieu de la réunion'}
                  </p>
                  <p className="text-primary font-medium flex items-center gap-1 mt-1 text-sm">
                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                    {formatDate(reunion?.date_reunion)} • {reunion?.heure_debut?.substring(0,5)} – {reunion?.heure_fin?.substring(0,5)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-4 py-2 bg-primary text-white font-bold rounded hover:bg-primary/90 transition-colors text-sm">
                  Rejoindre la Réunion en Direct
                </button>
                <button className="flex-1 md:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded hover:bg-slate-200 transition-colors text-sm">
                  Télécharger le Pack
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex gap-8 overflow-x-auto">
            {[
              { key: 'overview',     label: "Aperçu" },
              { key: 'participants', label: `Participants (${participants.length || 0})` },
              { key: 'minutes',      label: 'PV Précédents' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 border-b-2 text-sm font-bold whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* ── Left column ── */}
            <div className="xl:col-span-2 flex flex-col gap-6">

              {/* Agenda */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">list_alt</span>
                    Ordre du Jour
                  </h3>
                  <button className="text-primary text-sm font-bold hover:underline">Modifier</button>
                </div>
                <div className="space-y-3">
                  {agendaItems.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">Aucun ordre du jour renseigné.</p>
                  ) : agendaItems.map((item, i) => (
                    <div
                      key={i}
                      className={`flex gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        i === 0 ? 'border-l-4 border-primary bg-primary/5' : ''
                      }`}
                    >
                      <span className="text-slate-400 font-mono text-xs mt-1 shrink-0 w-12">{item.heure}</span>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{item.titre}</p>
                        {item.responsable && <p className="text-xs text-slate-500">{item.responsable}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Notes collaboratives */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">edit_note</span>
                    Procès-Verbal (en direct)
                  </h3>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">SK</div>
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-green-500 flex items-center justify-center text-[10px] text-white font-bold">JM</div>
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-300 flex items-center justify-center text-[10px] text-slate-600 font-bold">+3</div>
                  </div>
                </div>
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  className="w-full min-h-[280px] p-6 bg-transparent border-0 focus:border-0 border-transparent focus:border-transparent focus:ring-0 focus:ring-transparent outline-none focus:outline-none text-slate-700 dark:text-slate-300 resize-none leading-relaxed"
                  placeholder="Commencez à saisir les notes ici… Utilisez @ pour mentionner une personne ou # pour un sujet."
                />
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-4 text-xs text-slate-500 border-t border-slate-200 dark:border-slate-800">
                  <span className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${saveMutation.isPending ? 'bg-orange-400 animate-pulse' : 'bg-green-500'}`}></span>
                    {saveMutation.isPending ? 'Sauvegarde en cours…' : 'Sauvegarde automatique activée'}
                  </span>
                  {saveMutation.isSuccess && <span>Dernière sauvegarde : à l'instant</span>}
                </div>
              </section>
            </div>

            {/* ── Right column ── */}
            <div className="flex flex-col gap-6">

              {/* Participants */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">Pasteurs & Responsables</h3>
                  <button className="text-xs text-primary font-bold">Inviter</button>
                </div>
                <div className="space-y-4">
                  {/* Static list — connected to real data when participants are real User objects */}
                  {[
                    { name: 'Jean-Marc Kouassi', role: 'Pasteur Senior • Hôte', online: true },
                    { name: 'Sarah Diallo',       role: 'RLL • District Nord',   online: true },
                    { name: 'Moussa Koné',         role: 'Pasteur Associé',       online: false },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <InitialAvatar
                        name={p.name}
                        color={i === 0 ? 'bg-primary/20 text-primary' : i === 1 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700'}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-bold">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.role}</p>
                      </div>
                      <span className={`size-2 rounded-full ${p.online ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                  ))}
                  <button className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-xs font-medium rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Voir tous les {participants.length || 0} participants
                  </button>
                </div>
              </section>

              {/* Actions à mener */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">Points d'Action</h3>
                  <button
                    onClick={() => setActions([...actions, { id: Date.now(), text: 'Nouveau point d\'action', completed: false, assignee: '@À assigner', due: '—' }])}
                    className="bg-primary/10 text-primary size-6 rounded flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <div className="space-y-1">
                  {actions.map(action => (
                    <ActionItem
                      key={action.id}
                      text={action.text}
                      completed={action.completed}
                      assignee={action.assignee}
                      due={action.due}
                      onToggle={() => toggleAction(action.id)}
                    />
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span>Taux de complétion</span>
                    <span>{completionPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                  </div>
                </div>
              </section>

              {/* Carte / Localisation */}
              <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm overflow-hidden">
                <div className="h-32 w-full rounded mb-3 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #dde9f8 0%, #c3d9f5 100%)' }} />
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg,#1745cf 0,#1745cf 1px,transparent 0,transparent 35px),repeating-linear-gradient(90deg,#1745cf 0,#1745cf 1px,transparent 0,transparent 35px)',
                    backgroundSize: '35px 35px',
                  }} />
                  <div className="relative z-10 bg-primary p-2 rounded-full text-white shadow-lg animate-pulse">
                    <span className="material-symbols-outlined">location_on</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{reunion?.eglise_hote_nom || '—'}</p>
                <p className="text-[10px] text-slate-500">Côte d'Ivoire — SGL-CI</p>
              </section>
            </div>
          </div>
        </div>

        {/* Floating Live Badge */}
        {statut === 'en_cours' && (
          <div className="fixed bottom-6 right-6 md:right-10">
            <button className="bg-primary text-white shadow-xl rounded-full px-6 py-3 font-bold flex items-center gap-2 hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">radio_button_checked</span>
              Enregistrement en cours
            </button>
          </div>
        )}
    </Layout>
  );
};

export default MeetingDetail;
