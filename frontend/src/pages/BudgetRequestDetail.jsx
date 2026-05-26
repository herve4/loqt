import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { logisticsService } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ETAPES_LABEL = {
  RLL: 'Validation RLL',
  RLN: 'Validation RLN',
  PASTEUR: 'Approbation Pasteur',
  VALIDE: 'Approuvée',
  REFUSE: 'Rejetée',
};

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const formatAmount = (amount) =>
  amount != null ? `${Number(amount).toLocaleString('fr-FR')} FCFA` : '—';

// ─── Sub-components ──────────────────────────────────────────────────────────

const WorkflowStep = ({ step, currentStep, completed, date, notes, user }) => {
  const isCurrent = step === currentStep;
  const isCompleted = completed;
  
  let icon = 'lock';
  let colorClass = 'bg-slate-200 dark:bg-slate-800 text-slate-400';
  let statusText = 'En attente';
  let statusColor = 'text-slate-400';

  if (isCompleted) {
    icon = 'check';
    colorClass = 'bg-green-500 text-white';
    statusText = 'COMPLÉTÉ';
    statusColor = 'text-green-600 dark:text-green-400';
  } else if (isCurrent) {
    icon = 'pending';
    colorClass = 'bg-primary text-white ring-4 ring-primary/20';
    statusText = 'EN COURS';
    statusColor = 'text-primary animate-pulse';
  }

  return (
    <div className="relative flex items-start gap-4">
      <div className={`flex items-center justify-center w-8 h-8 rounded-full z-10 ${colorClass}`}>
        <span className="material-symbols-outlined text-sm">{icon}</span>
      </div>
      <div className="flex-1">
        <p className={`text-sm font-bold ${isCurrent ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>
          {ETAPES_LABEL[step]}
        </p>
        <p className="text-xs text-slate-500">{user}</p>
        <div className={`mt-1 inline-flex items-center text-[10px] font-bold uppercase ${statusColor}`}>
          {statusText} {date && `• ${date}`}
        </div>
        {notes && (
          <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs text-slate-600 dark:text-slate-400 italic">
            "{notes}"
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const BudgetRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [decisionNote, setDecisionNote] = useState('');

  const { data: request, isLoading } = useQuery({
    queryKey: ['expression', id],
    queryFn: () => logisticsService.getExpressionById(id).then(r => r.data),
  });

  const decisionMutation = useMutation({
    mutationFn: (data) => logisticsService.deciderExpression(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['expression', id]);
      setDecisionNote('');
    },
  });

  const handleDecision = (decision) => {
    // Si on approuve et qu'on est en RLL, on passe en RLN, etc.
    // Pour simplifier ici, on suit le choix de l'utilisateur ou on valide globalement
    decisionMutation.mutate({ decision, notes: decisionNote });
  };

  const etapeCircuit = request?.etape_circuit || 'RLL';
  const isFinalized = ['VALIDE', 'REFUSE'].includes(etapeCircuit);

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">
      <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
    </div>
  );

  return (
    <Layout
      title="Détails de la Demande"
      showBackButton={true}
      onBack={() => navigate(-1)}
    >

        <main className="max-w-[1200px] mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne de gauche: Détails et Items */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Header Section */}
            <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    #RQ-{String(id).padStart(4, '0')}
                  </span>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
                    {request?.liste_materiel?.split('\n')[0] || 'Demande sans titre'}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Soumise le {formatDate(request?.date_demande)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {request?.demandeur_nom?.substring(0, 1) || 'U'}
                </div>
                <div>
                  <p className="text-slate-900 dark:text-slate-100 font-bold">{request?.demandeur_nom}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">{request?.eglise_nom} • Demandeur</p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Matériel(s) Demandé(s)</h2>
              </div>
              <div className="p-6">
                <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400">
                  {request?.liste_materiel?.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-xs tracking-wider">Total Estimatf</span>
                  <span className="text-2xl font-black text-primary">{formatAmount(request?.estimation_budget)}</span>
                </div>
              </div>
            </div>

            {/* Review Action Form (Visible seulement si non finalisé) */}
            {!isFinalized && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Décision de Révision</h2>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Commentaires / Notes</label>
                    <textarea 
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                      placeholder="Saisissez vos remarques ici..."
                      rows="3"
                      value={decisionNote}
                      onChange={(e) => setDecisionNote(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button 
                      onClick={() => handleDecision(etapeCircuit === 'PASTEUR' ? 'VALIDE' : etapeCircuit === 'RLL' ? 'RLN' : 'PASTEUR')}
                      disabled={decisionMutation.isPending}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      Approuver
                    </button>
                    <button 
                      onClick={() => handleDecision('REFUSE')}
                      disabled={decisionMutation.isPending}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-red-600 dark:text-red-400 font-bold py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-200 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined">cancel</span>
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Colonne de droite: Workflow Timeline */}
          <div className="flex flex-col gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Workflow d'Approbation</h2>
              <div className="relative flex flex-col gap-8">
                {/* Connector Line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800"></div>
                
                <Step1 request={request} />
                <WorkflowStep 
                  step="RLL" 
                  currentStep={etapeCircuit} 
                  completed={['RLN', 'PASTEUR', 'VALIDE', 'REFUSE'].includes(etapeCircuit) || (etapeCircuit === 'REFUSE' && request?.notes_decision)} 
                  user="Responsable de Zone"
                />
                <WorkflowStep 
                  step="RLN" 
                  currentStep={etapeCircuit} 
                  completed={['PASTEUR', 'VALIDE', 'REFUSE'].includes(etapeCircuit) && etapeCircuit !== 'RLN'} 
                  user="Directeur National"
                />
                <WorkflowStep 
                  step="PASTEUR" 
                  currentStep={etapeCircuit} 
                  completed={etapeCircuit === 'VALIDE' || etapeCircuit === 'REFUSE'} 
                  user="Pasteur Responsable"
                />
              </div>
              
              {isFinalized && (
                <div className={`mt-6 p-4 rounded-lg text-center font-bold text-sm ${etapeCircuit === 'VALIDE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {etapeCircuit === 'VALIDE' ? 'Demande Approuvée Finance' : 'Demande Rejetée'}
                </div>
              )}
            </div>

            {/* Documents - Statique pour le moment */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 uppercase tracking-wider">Documents Liés</h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">Devis_Estimation.pdf</p>
                    <p className="text-[10px] text-slate-500">1.2 MB • PDF</p>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">download</span>
                </div>
              </div>
            </div>
          </div>
        </main>
    </Layout>
  );
};

const Step1 = ({ request }) => (
  <div className="relative flex items-start gap-4">
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white z-10">
      <span className="material-symbols-outlined text-sm">check</span>
    </div>
    <div className="flex-1">
      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Soumission</p>
      <p className="text-xs text-slate-500">{request?.demandeur_nom} (Demandeur)</p>
      <div className="mt-1 inline-flex items-center text-[10px] font-medium text-green-600 dark:text-green-400">
        COMPLÉTÉ • {formatDate(request?.date_demande)}
      </div>
    </div>
  </div>
);

export default BudgetRequestDetail;
