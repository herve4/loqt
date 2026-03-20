import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { logisticsService } from '../services/api';

const EventChronogram = () => {
  const { id } = useParams();
  
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => logisticsService.getEvenementById(id).then(res => res.data),
    enabled: !!id
  });

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ['chronogram', id],
    queryFn: () => logisticsService.getChronogramItems(id).then(res => res.data),
    enabled: !!id
  });

  const items = itemsData?.results || [];

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (eventLoading) return <div className="p-8">Chargement des détails de l'événement...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header title="Chronogramme de l'Événement" />
        
        <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {/* Fil d'ariane */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Link to="/events" className="hover:text-primary transition-colors">Événements</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-900 dark:text-slate-200 font-medium">{event?.titre || 'Détails de l\'événement'}</span>
          </div>

          {/* En-tête de l'événement */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex gap-5">
                <div className="bg-primary/10 rounded-xl size-20 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                  <span className="material-symbols-outlined text-4xl">event_available</span>
                </div>
                <div className="flex flex-col justify-center">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{event?.titre}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      <span className="text-sm">{new Date(event?.date_debut).toLocaleDateString('fr-FR')} - {new Date(event?.date_fin).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span className="text-sm">{event?.lieu || 'Lieu à déterminer'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link to="/events" className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 h-10 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm">
                  <span className="material-symbols-outlined text-xl">edit</span>
                  Modifier
                </Link>
                <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 h-10 rounded bg-primary text-white font-bold text-sm">
                  <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
                  Exporter PDF
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    <h3 className="font-bold text-slate-900 dark:text-white">Chronogramme Quotidien</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1.5 rounded-full bg-primary text-white text-xs font-bold">Tous les Pôles</button>
                    <button className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs font-medium">Audio</button>
                    <button className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 text-xs font-medium">Vidéo</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-4 py-3">Créneau</th>
                        <th className="px-4 py-3">Description de la Tâche</th>
                        <th className="px-4 py-3">Pôle Technique</th>
                        <th className="px-4 py-3">Responsable</th>
                        <th className="px-4 py-3 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {items.map(item => (
                        <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-4 font-medium text-slate-600">{item.heure_debut?.substring(0, 5)} - {item.heure_fin?.substring(0, 5)}</td>
                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-900 dark:text-slate-200">{item.titre}</div>
                            <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              {item.pole_nom || 'Général'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                    {getInitials(item.responsable_nom)}
                                </div>
                                <span className="text-slate-700 dark:text-slate-300">{item.responsable_nom || 'Non assigné'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                             <div className="flex items-center justify-center gap-1.5 text-green-600">
                                <span className="material-symbols-outlined text-base">check_circle</span>
                                <span className="font-semibold text-xs uppercase">{item.statut}</span>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="w-full xl:w-80 flex flex-col gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">inventory_2</span>
                        <h3 className="font-bold text-slate-900 dark:text-white">Liste du Matériel</h3>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">{event?.materiels_count || 0} Articles</span>
                </div>
                <div className="space-y-4">
                   <p className="text-xs text-slate-500 italic">Consultez l'inventaire complet pour plus de détails.</p>
                </div>
                <Link to="/inventory" className="block w-full mt-6 py-2 text-center rounded bg-primary/10 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition-colors">
                    Voir les détails de l'inventaire
                </Link>
              </div>

              <div className="bg-primary rounded-xl shadow-lg p-5 text-white overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="font-bold mb-1">Préparation de l'Événement</h3>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-black">68%</span>
                    <span className="text-xs opacity-80 mb-1">Tâches Terminées</span>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full mb-6">
                    <div className="bg-white h-full rounded-full" style={{ width: '68%' }}></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] opacity-70 uppercase font-bold">Planifiées</span>
                      <span className="text-lg font-bold">{items.length}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] opacity-70 uppercase font-bold">En Prépa</span>
                      <span className="text-lg font-bold">--</span>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-white/10 text-9xl">analytics</span>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventChronogram;
