import React from 'react';

const MetricCard = ({ title, value, change, icon, trend, color = 'primary' }) => {
  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    none: 'text-slate-400'
  };

  const trendIcons = {
    up: 'trending_up',
    down: 'trending_down',
    none: ''
  };

  const iconColors = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger'
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
        <span className={`material-symbols-outlined ${iconColors[color] || 'text-primary'}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <div className={`text-xs mt-2 ${trendColors[trend]} flex items-center gap-1 font-medium`}>
        {trend !== 'none' && <span className="material-symbols-outlined text-[14px]">{trendIcons[trend]}</span>}
        <span>{change}</span>
        {trend !== 'none' && <span className="text-slate-400 ml-1">vs mois dernier</span>}
      </div>
    </div>
  );
};

export default MetricCard;
