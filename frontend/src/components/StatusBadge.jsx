import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    // Matériel
    'OP': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'PA': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'RE': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'PE': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    
    // Événements & Budget
    'en_attente': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700',
    'valide': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'VALIDE': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'refuse': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'REFUSE': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    'BROUILLON': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',

    // Formations
    'planifié': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'en_cours': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'terminé': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  const labels = {
    // Matériel
    'OP': 'Opérationnel',
    'PA': 'En Panne',
    'RE': 'En Réparation',
    'PE': 'Perdu',

    // Événements
    'en_attente': 'En attente',
    'valide': 'Validé',
    'refuse': 'Refusé',
    
    // Budget
    'VALIDE': 'Approuvé',
    'REFUSE': 'Refusé',
    'BROUILLON': 'Brouillon',

    // Formations
    'planifié': 'Planifié',
    'en_cours': 'En cours',
    'terminé': 'Terminé',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {labels[status] || status}
    </span>
  );
};

export default StatusBadge;
