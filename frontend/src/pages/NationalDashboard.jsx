import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import MetricCard from '../components/MetricCard';
import { dashboardService, logisticsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

import InteractiveMap from '../components/InteractiveMap';

const NationalDashboard = () => {
  const { user: currentUser } = useAuth();

  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats().then(res => res.data),
    refetchInterval: 30000, // Rafraîchir toutes les 30 secondes
  });

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => logisticsService.getEvenements().then(res => res.data),
    refetchInterval: 60000, // Les événements peuvent être rafraîchis moins souvent
  });

  // Fetch all materials, members, and churches to perform client-side role-based scoping
  const { data: allMaterielsData } = useQuery({
    queryKey: ['dashboard-all-materiels'],
    queryFn: () => logisticsService.getMateriels({ page_size: 10000 }).then(res => res.data),
    refetchInterval: 30000,
  });

  const { data: allMembersData } = useQuery({
    queryKey: ['dashboard-all-members'],
    queryFn: () => logisticsService.getMembersList({ page_size: 10000 }).then(res => res.data),
    refetchInterval: 60000,
  });

  const { data: allChurchesData } = useQuery({
    queryKey: ['dashboard-all-churches'],
    queryFn: () => logisticsService.getEglises({ page_size: 10000 }).then(res => res.data),
    refetchInterval: 60000,
  });

  const stats = statsData?.stats || {};
  const upcomingEvents = eventsData?.results || [];

  const scopedMateriels = React.useMemo(() => {
    const rawMateriels = allMaterielsData?.results || [];
    const rawMembers = allMembersData?.results || [];
    const rawChurches = allChurchesData?.results || [];

    if (!currentUser || !rawMateriels.length) return [];

    const userRole = currentUser.role;

    // 1. Global Scopes
    if (['super_admin', 'pasteur_national', 'rln'].includes(userRole)) {
      return rawMateriels;
    }

    const matchRegionConstraint = (managerEgliseId, itemEgliseId) => {
      if (!managerEgliseId || !itemEgliseId) return true;
      const managerChurch = rawChurches.find(c => c.id === managerEgliseId);
      const itemChurch = rawChurches.find(c => c.id === itemEgliseId);
      if (managerChurch && managerChurch.region && itemChurch && itemChurch.region) {
        return managerChurch.region === itemChurch.region;
      }
      return true;
    };

    const mapCategoryToPole = (categoryName) => {
      if (!categoryName) return 'Logistique Générale';
      const name = categoryName.toLowerCase();
      if (name.includes('son') || name.includes('audio') || name.includes('micro') || name.includes('enceinte') || name.includes('mixage') || name.includes('sono') || name.includes('câble audio') || name.includes('intercom')) {
        return 'Son';
      }
      if (name.includes('image') || name.includes('vidéo') || name.includes('video') || name.includes('caméra') || name.includes('camera') || name.includes('projecteur') || name.includes('écran') || name.includes('ecran') || name.includes('trépied') || name.includes('regie video') || name.includes('régie vidéo')) {
        return 'Image';
      }
      if (name.includes('lumière') || name.includes('lumiere') || name.includes('éclairage') || name.includes('eclairage') || name.includes('led') || name.includes('lyre') || name.includes('projecteur asservi')) {
        return 'Lumière';
      }
      if (name.includes('informatique') || name.includes('ordinateur') || name.includes('pc') || name.includes('réseau') || name.includes('reseau') || name.includes('routeur') || name.includes('switch') || name.includes('serveur')) {
        return 'Informatique';
      }
      if (name.includes('énergie') || name.includes('energie') || name.includes('groupe') || name.includes('générateur') || name.includes('generateur') || name.includes('alimentation') || name.includes('rallonge') || name.includes('multiprise')) {
        return 'Énergie';
      }
      if (name.includes('réalisation') || name.includes('realisation') || name.includes('regie') || name.includes('régie') || name.includes('mélangeur') || name.includes('melangeur') || name.includes('directeur')) {
        return 'Réalisation';
      }
      return 'Logistique Générale';
    };

    // 2. Local Scope (Pasteur Local / RLL)
    if (['pasteur_local', 'rll'].includes(userRole)) {
      return rawMateriels.filter(item => item.eglise === currentUser.eglise);
    }

    // 3. Department / Pole Scope (resp_dept, adj_dept, membre_dept)
    if (['resp_dept', 'adj_dept', 'membre_dept'].includes(userRole)) {
      return rawMateriels.filter(item => {
        const matchesPole = currentUser.pole_nom && mapCategoryToPole(item.categorie_nom) === currentUser.pole_nom;
        const matchesRegion = matchRegionConstraint(currentUser.eglise, item.eglise);
        return matchesPole && matchesRegion;
      });
    }

    // 4. Section Scope (resp_sec, adj_sec, membre_sec)
    if (['resp_sec', 'adj_sec', 'membre_sec'].includes(userRole)) {
      return rawMateriels.filter(item => {
        const owner = rawMembers.find(m => 
          m.phone === item.responsable_phone || 
          `${m.first_name} ${m.last_name}`.trim().toLowerCase() === (item.responsable_nom || '').trim().toLowerCase()
        );
        
        let matchesSection = false;
        if (owner) {
          matchesSection = owner.section && currentUser.section && owner.section.trim().toLowerCase() === currentUser.section.trim().toLowerCase();
        } else {
          matchesSection = rawMembers.some(m => 
            m.eglise === item.eglise && 
            m.section && 
            currentUser.section && 
            m.section.trim().toLowerCase() === currentUser.section.trim().toLowerCase()
          );
        }

        const matchesRegion = matchRegionConstraint(currentUser.eglise, item.eglise);
        return matchesSection && matchesRegion;
      });
    }

    // 5. Default Fallback / Member / Technician
    return rawMateriels.filter(item => {
      const matchesEglise = item.eglise === currentUser.eglise;
      if (!matchesEglise) return false;
      if (currentUser.pole_nom) {
        return mapCategoryToPole(item.categorie_nom) === currentUser.pole_nom;
      }
      return true;
    });
  }, [currentUser, allMaterielsData, allMembersData, allChurchesData]);

  const computedStats = React.useMemo(() => {
    if (!scopedMateriels.length) {
      return {
        materiels_count: 0,
        pending_repairs_count: 0,
        health_percentage: 100,
        operational_count: 0,
        repair_count: 0,
        broken_count: 0,
      };
    }

    const total = scopedMateriels.length;
    const operational = scopedMateriels.filter(m => m.etat === 'OP').length;
    const repair = scopedMateriels.filter(m => m.etat === 'RE').length;
    const broken = scopedMateriels.filter(m => m.etat === 'PA').length;
    const pending = repair + broken;
    const health = total > 0 ? Math.round((operational / total) * 100 * 10) / 10 : 100;

    return {
      materiels_count: total,
      pending_repairs_count: pending,
      health_percentage: health,
      operational_count: operational,
      repair_count: repair,
      broken_count: broken,
    };
  }, [scopedMateriels]);

  const isMaterielsLoaded = allMaterielsData !== undefined;
  const displayStats = isMaterielsLoaded ? {
    ...stats,
    ...computedStats
  } : stats;

  return (
    <Layout title="Tableau de Bord National">
      <div className="p-8 space-y-8">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/inventory" className="block transform transition-all hover:scale-[1.02]">
              <MetricCard 
                title="Total Matériel" 
                value={displayStats.materiels_count || "0"} 
                change="+2.1%" 
                icon="precision_manufacturing" 
                trend="up" 
              />
            </Link>
            <Link to="/churches" className="block transform transition-all hover:scale-[1.02]">
              <MetricCard 
                title="Réseau des Églises" 
                value={displayStats.eglises_count || "0"} 
                change="+0.5%" 
                icon="church" 
                trend="up" 
                color="success" 
              />
            </Link>
            <Link to="/report" className="block transform transition-all hover:scale-[1.02]">
              <MetricCard 
                title="Réparations en cours" 
                value={displayStats.pending_repairs_count || "0"} 
                change="-12%" 
                icon="build_circle" 
                trend="down" 
                color="danger" 
              />
            </Link>
            <Link to="/events" className="block transform transition-all hover:scale-[1.02]">
              <MetricCard 
                title="Événements Actifs" 
                value={displayStats.evenements_count || "0"} 
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
                    <circle className="stroke-warning" cx="18" cy="18" fill="none" r="16" strokeDasharray={`${((displayStats.repair_count + displayStats.operational_count) / displayStats.materiels_count * 100) || 0} 100`} strokeWidth="4" strokeDashoffset="0"></circle>
                    <circle className="stroke-primary" cx="18" cy="18" fill="none" r="16" strokeDasharray={`${displayStats.health_percentage || 0} 100`} strokeWidth="4" strokeDashoffset="0"></circle>
                    <circle className="text-white dark:text-slate-900" cx="18" cy="18" fill="currentColor" r="12"></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform group-hover:scale-110">
                    <span className="text-2xl font-bold">{displayStats.health_percentage || "0"}%</span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Opérationnel</span>
                  </div>
                </Link>
                <div className="mt-8 space-y-2 w-full">
                  <Link to="/inventory" className="flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-primary"></div>
                      <span className="text-slate-600 dark:text-slate-400">Opérationnel</span>
                    </div>
                    <span className="font-bold">{displayStats.operational_count || "0"}</span>
                  </Link>
                  <Link to="/movements" className="flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-warning"></div>
                      <span className="text-slate-600 dark:text-slate-400">En réparation</span>
                    </div>
                    <span className="font-bold">{displayStats.repair_count || "0"}</span>
                  </Link>
                  <Link to="/report" className="flex items-center justify-between text-sm hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full bg-danger"></div>
                      <span className="text-slate-600 dark:text-slate-400">En panne / Désactivé</span>
                    </div>
                    <span className="font-bold">{displayStats.broken_count || "0"}</span>
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
