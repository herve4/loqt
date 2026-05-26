import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import { dashboardService, logisticsService } from '../services/api';

import InteractiveMap from '../components/InteractiveMap';

const NationalDashboard = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats().then(res => res.data),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => logisticsService.getEvenements().then(res => res.data),
    refetchInterval: 60000, // Les événements peuvent être rafraîchis moins souvent
  });

  const stats = statsData?.stats || {};
  const upcomingEvents = eventsData?.results || [];

  return (
    <Layout title="Tableau de Bord National">
      <div className="p-8 space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/inventory" className="block transform transition-all hover:scale-[1.02]">
              <MetricCard 
                title="Total Matériel" 
                value={stats.materiels_count || "0"} 
                change="+2.1%" 
                icon="precision_manufacturing" 
                trend="up" 
              />
            </Link>
            <Link to="/churches" className="block transform transition-all hover:scale-[1.02]">
              <MetricCard 
                title="Réseau des Églises" 
                value={stats.eglises_count || "0"} 
                change="+0.5%" 
                icon="church" 
                trend="up" 
                color="success" 
              />
            </Link>
            <Link to="/report" className="block transform transition-all hover:scale-[1.02]">
              <MetricCard 
                title="Réparations en cours" 
                value={stats.pending_repairs_count || "0"} 
                change="-12%" 
                icon="build_circle" 
                trend="down" 
                color="danger" 
              />
            </Link>
            <Link to="/events" className="block transform transition-all hover:scale-[1.02]">
              <MetricCard 
                title="Événements Actifs" 
                value={stats.evenements_count || "0"} 
                change="Stable" 
                icon="event_available" 
                trend="none" 
                color="warning" 
              />
            </Link>
          </div>

          {/* Central Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Implantations des Églises - Côte d'Ivoire</h3>
                <div className="flex gap-2">
                  <span className="px-3 py-1 text-xs font-semibold rounded bg-primary/10 text-primary border border-primary/20">Interactif</span>
                </div>
              </div>
              <div className="relative flex-1 rounded-lg overflow-hidden">
                <InteractiveMap />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-all hover:shadow-md">
              <h3 className="font-bold text-lg mb-6">Santé du Matériel</h3>
              <div className="flex-1 flex flex-col items-center justify-center">
                <Link to="/inventory" className="relative size-48 cursor-pointer group">
                  <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                    <circle className="stroke-danger opacity-20" cx="18" cy="18" fill="none" r="16" strokeWidth="4"></circle>
                    <circle className="stroke-danger" cx="18" cy="18" fill="none" r="16" strokeDasharray="100 100" strokeWidth="4" strokeDashoffset="0"></circle>
                    <circle className="stroke-warning" cx="18" cy="18" fill="none" r="16" strokeDasharray={`${((stats.repair_count + stats.operational_count) / stats.materiels_count * 100) || 0} 100`} strokeWidth="4" strokeDashoffset="0"></circle>
                    <circle className="stroke-primary" cx="18" cy="18" fill="none" r="16" strokeDasharray={`${stats.health_percentage || 0} 100`} strokeWidth="4" strokeDashoffset="0"></circle>
                    <circle className="text-white dark:text-slate-900" cx="18" cy="18" fill="currentColor" r="12"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform group-hover:scale-110">
                    <span className="text-2xl font-bold">{stats.health_percentage || "0"}%</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Opérationnel</span>
                  </div>
                </Link>
                <div className="mt-8 space-y-2 w-full">
                  <Link to="/inventory" className="flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-primary"></div>
                      <span className="text-slate-600 dark:text-slate-400">Opérationnel</span>
                    </div>
                    <span className="font-bold">{stats.operational_count || "0"}</span>
                  </Link>
                  <Link to="/movements" className="flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-warning"></div>
                      <span className="text-slate-600 dark:text-slate-400">En réparation</span>
                    </div>
                    <span className="font-bold">{stats.repair_count || "0"}</span>
                  </Link>
                  <Link to="/report" className="flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-danger"></div>
                      <span className="text-slate-600 dark:text-slate-400">En panne / Désactivé</span>
                    </div>
                    <span className="font-bold">{stats.broken_count || "0"}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Events Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-lg">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg">Événements Logistiques à venir</h3>
              <button className="text-primary text-sm font-semibold hover:underline">Voir Calendrier</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Nom de l'Événement</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Date de début</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {eventsLoading ? (
                    <tr><td colSpan="4" className="px-6 py-4 text-center">Chargement des événements...</td></tr>
                  ) : upcomingEvents.length === 0 ? (
                    <tr><td colSpan="4" className="px-6 py-4 text-center">Aucun événement à venir.</td></tr>
                  ) : upcomingEvents.map(event => (
                    <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-sm">
                          <Link to={`/events/${event.id}`} className="hover:text-primary transition-colors">
                            {event.titre}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm">{event.type_programme || event.type_evenement}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{new Date(event.date_debut).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                            <Link to={`/events/${event.id}`} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded inline-block">
                                <span className="material-symbols-outlined text-[20px]">calendar_apps_script</span>
                            </Link>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      </div>
    </Layout>
  );
};

const HealthRow = ({ color, label, value }) => (
  <div className="flex items-center justify-between text-sm">
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${color}`}></span>
      <span>{label}</span>
    </div>
    <span className="font-semibold">{value}</span>
  </div>
);

export default NationalDashboard;
