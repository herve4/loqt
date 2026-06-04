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

  // Fetch all movements and defects
  const { data: allMovementsData } = useQuery({
    queryKey: ['dashboard-all-movements'],
    queryFn: () => logisticsService.getMovements({ page_size: 10000 }).then(res => res.data),
    refetchInterval: 30000,
  });

  const { data: allDefectsData } = useQuery({
    queryKey: ['dashboard-all-defects'],
    queryFn: () => logisticsService.getDefects({ page_size: 10000 }).then(res => res.data),
    refetchInterval: 30000,
  });

  const stats = statsData?.stats || {};
  const upcomingEvents = eventsData?.results || [];

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

  const scopedMovements = React.useMemo(() => {
    const rawMovements = allMovementsData?.results || [];
    const rawMateriels = allMaterielsData?.results || [];
    const rawMembers = allMembersData?.results || [];

    if (!currentUser || !rawMovements.length) return [];

    const userRole = currentUser.role;

    if (['super_admin', 'pasteur_national', 'rln'].includes(userRole)) {
      return rawMovements;
    }

    if (['pasteur_local', 'rll'].includes(userRole)) {
      return rawMovements.filter(m => m.eglise_origine === currentUser.eglise || m.eglise_destination === currentUser.eglise);
    }

    if (['resp_dept', 'adj_dept', 'membre_dept'].includes(userRole)) {
      return rawMovements.filter(m => {
        const mat = rawMateriels.find(item => item.id === m.materiel);
        return mat && currentUser.pole_nom && mapCategoryToPole(mat.categorie_nom) === currentUser.pole_nom;
      });
    }

    if (['resp_sec', 'adj_sec', 'membre_sec'].includes(userRole)) {
      return rawMovements.filter(m => {
        const owner = rawMembers.find(user => 
          user.phone === m.responsable_phone || 
          user.id === m.responsable
        );
        if (owner) {
          return owner.section && currentUser.section && owner.section.trim().toLowerCase() === currentUser.section.trim().toLowerCase();
        }
        return rawMembers.some(user => 
          (user.eglise === m.eglise_origine || user.eglise === m.eglise_destination) &&
          user.section && 
          currentUser.section && 
          user.section.trim().toLowerCase() === currentUser.section.trim().toLowerCase()
        );
      });
    }

    return rawMovements.filter(m => m.eglise_origine === currentUser.eglise || m.eglise_destination === currentUser.eglise);
  }, [currentUser, allMovementsData, allMaterielsData, allMembersData]);

  const scopedDefects = React.useMemo(() => {
    const rawDefects = allDefectsData?.results || [];
    const rawMateriels = allMaterielsData?.results || [];
    const rawMembers = allMembersData?.results || [];

    if (!currentUser || !rawDefects.length) return [];

    const userRole = currentUser.role;

    if (['super_admin', 'pasteur_national', 'rln'].includes(userRole)) {
      return rawDefects;
    }

    if (['pasteur_local', 'rll'].includes(userRole)) {
      return rawDefects.filter(d => {
        const mat = rawMateriels.find(item => item.id === d.materiel);
        return mat && mat.eglise === currentUser.eglise;
      });
    }

    if (['resp_dept', 'adj_dept', 'membre_dept'].includes(userRole)) {
      return rawDefects.filter(d => {
        const mat = rawMateriels.find(item => item.id === d.materiel);
        return mat && currentUser.pole_nom && mapCategoryToPole(mat.categorie_nom) === currentUser.pole_nom;
      });
    }

    if (['resp_sec', 'adj_sec', 'membre_sec'].includes(userRole)) {
      return rawDefects.filter(d => {
        const mat = rawMateriels.find(item => item.id === d.materiel);
        if (!mat) return false;
        const owner = rawMembers.find(user => 
          user.phone === mat.responsable_phone || 
          `${user.first_name} ${user.last_name}`.trim().toLowerCase() === (mat.responsable_nom || '').trim().toLowerCase()
        );
        if (owner) {
          return owner.section && currentUser.section && owner.section.trim().toLowerCase() === currentUser.section.trim().toLowerCase();
        }
        return rawMembers.some(user => 
          user.eglise === mat.eglise && 
          user.section && 
          currentUser.section && 
          user.section.trim().toLowerCase() === currentUser.section.trim().toLowerCase()
        );
      });
    }

    return rawDefects.filter(d => {
      const mat = rawMateriels.find(item => item.id === d.materiel);
      return mat && mat.eglise === currentUser.eglise;
    });
  }, [currentUser, allDefectsData, allMaterielsData, allMembersData]);

  const lowStockItems = React.useMemo(() => {
    return scopedMateriels.filter(item => item.quantite <= 5);
  }, [scopedMateriels]);

  const scopedMembers = React.useMemo(() => {
    const rawMembers = allMembersData?.results || [];
    const rawChurches = allChurchesData?.results || [];

    if (!currentUser || !rawMembers.length) return [];

    const userRole = currentUser.role;

    // 1. Global Scopes
    if (['super_admin', 'pasteur_national', 'rln'].includes(userRole)) {
      return rawMembers;
    }

    const matchRegionConstraint = (managerEgliseId, memberEgliseId) => {
      if (!managerEgliseId || !memberEgliseId) return true;
      const managerChurch = rawChurches.find(c => c.id === managerEgliseId);
      const memberChurch = rawChurches.find(c => c.id === memberEgliseId);
      if (managerChurch && managerChurch.region && memberChurch && memberChurch.region) {
        return managerChurch.region === memberChurch.region;
      }
      return true;
    };

    // 2. Local Scope (Pasteur Local / RLL)
    if (['pasteur_local', 'rll'].includes(userRole)) {
      return rawMembers.filter(m => m.eglise === currentUser.eglise);
    }

    // 3. Department / Pole Scope (resp_dept, adj_dept, membre_dept)
    if (['resp_dept', 'adj_dept', 'membre_dept'].includes(userRole)) {
      return rawMembers.filter(m => {
        const samePole = currentUser.pole && m.pole === currentUser.pole;
        const matchesRegion = matchRegionConstraint(currentUser.eglise, m.eglise);
        return samePole && matchesRegion;
      });
    }

    // 4. Section Scope (resp_sec, adj_sec, membre_sec)
    if (['resp_sec', 'adj_sec', 'membre_sec'].includes(userRole)) {
      return rawMembers.filter(m => {
        const sameSec = currentUser.section && m.section && m.section.trim().toLowerCase() === currentUser.section.trim().toLowerCase();
        const matchesRegion = matchRegionConstraint(currentUser.eglise, m.eglise);
        return sameSec && matchesRegion;
      });
    }

    // 5. Default Fallback
    return rawMembers.filter(m => m.eglise === currentUser.eglise);
  }, [currentUser, allMembersData, allChurchesData]);

  const latestMovements = React.useMemo(() => {
    return [...scopedMovements]
      .sort((a, b) => new Date(b.date_mouvement || b.created_at) - new Date(a.date_mouvement || a.created_at))
      .slice(0, 5);
  }, [scopedMovements]);

  const latestDefects = React.useMemo(() => {
    return [...scopedDefects]
      .sort((a, b) => new Date(b.date_signalement || b.created_at) - new Date(a.date_signalement || a.created_at))
      .slice(0, 5);
  }, [scopedDefects]);

  const formatRelativeDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      if (date.toDateString() === now.toDateString()) {
        return "Aujourd'hui";
      }
      return "Hier";
    }
    if (diffDays <= 7) {
      return `Il y a ${diffDays} j`;
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const rolesMap = {
    super_admin: { label: 'SUPER-ADMIN', style: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' },
    pasteur_national: { label: 'PASTEUR NAT.', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
    rln: { label: 'RLN (NATIONAL)', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800' },
    pasteur_local: { label: 'PASTEUR LOC.', style: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800' },
    rll: { label: 'RLL (LOCAL)', style: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
    technicien: { label: 'TECHNICIEN', style: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' },
    responsable: { label: 'RESPONSABLE', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800' },
    membre: { label: 'MEMBRE', style: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' },
    pasteur: { label: 'PASTEUR', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
    resp_dept: { label: 'RESP. DEPT.', style: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800' },
    adj_dept: { label: 'ADJ. DEPT.', style: 'bg-indigo-50/50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/15 dark:text-indigo-300 dark:border-indigo-900' },
    resp_sec: { label: 'RESP. SEC.', style: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-400 dark:border-sky-800' },
    adj_sec: { label: 'ADJ. SEC.', style: 'bg-sky-50/50 text-sky-600 border-sky-100 dark:bg-sky-950/15 dark:text-sky-300 dark:border-sky-900' },
    membre_dept: { label: 'MEMBRE DEPT.', style: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700' },
    membre_sec: { label: 'MEMBRE SEC.', style: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/20 dark:text-slate-400 dark:border-slate-800' },
  };

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

          {/* Scoped Dashboard Widgets and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column Left (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Movements Widget */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">swap_horiz</span>
                    <h3 className="font-bold text-lg">Mouvements & Transferts Récents</h3>
                  </div>
                  <Link to="/movements" className="text-primary text-sm font-semibold hover:underline">Voir tout</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Matériel</th>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Origine / Destination</th>
                        <th className="px-6 py-3">Qté</th>
                        <th className="px-6 py-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {latestMovements.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">Aucun mouvement récent dans votre scope.</td>
                        </tr>
                      ) : (
                        latestMovements.map(m => {
                          const isCheckin = m.type_mouvement === 'IN';
                          const isCheckout = m.type_mouvement === 'OUT';
                          const typeBadge = isCheckin 
                            ? 'bg-success/10 text-success border-success/20' 
                            : isCheckout 
                            ? 'bg-danger/10 text-danger border-danger/20' 
                            : 'bg-warning/10 text-warning border-warning/20';
                          
                          const typeLabel = isCheckin ? 'Entrée' : isCheckout ? 'Sortie' : 'Prêt';

                          return (
                            <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                              <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                                {m.materiel_nom || `Matériel #${m.materiel}`}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${typeBadge}`}>
                                  {typeLabel}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                                {m.eglise_origine_nom} ➔ {m.eglise_destination_nom || 'N/A'}
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300">
                                {m.quantite}
                              </td>
                              <td className="px-6 py-4 text-right text-slate-500 text-xs font-medium">
                                {formatRelativeDate(m.date_mouvement)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Defects Widget */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-danger text-[24px]">report_problem</span>
                    <h3 className="font-bold text-lg">Pannes & Anomalies Récentes</h3>
                  </div>
                  <Link to="/report" className="text-primary text-sm font-semibold hover:underline">Gérer</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Matériel</th>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Gravité</th>
                        <th className="px-6 py-3">Statut</th>
                        <th className="px-6 py-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {latestDefects.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-8 text-center text-slate-500 text-sm">Aucune panne déclarée dans votre scope.</td>
                        </tr>
                      ) : (
                        latestDefects.map(d => {
                          const severityBadge = d.niveau_gravite === 'Critical'
                            ? 'bg-danger/10 text-danger border-danger/20'
                            : d.niveau_gravite === 'Medium'
                            ? 'bg-warning/10 text-warning border-warning/20'
                            : 'bg-success/10 text-success border-success/20';

                          const severityLabel = d.niveau_gravite === 'Critical' ? 'Critique' : d.niveau_gravite === 'Medium' ? 'Moyen' : 'Faible';

                          return (
                            <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm">
                              <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                                {d.materiel_nom || `Matériel #${d.materiel}`}
                              </td>
                              <td className="px-6 py-4 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                                {d.description}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${severityBadge}`}>
                                  {severityLabel}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${d.repare ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'}`}>
                                  {d.repare ? 'Résolu' : 'En cours'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right text-slate-500 text-xs font-medium">
                                {formatRelativeDate(d.date_signalement)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Column Right (1/3) */}
            <div className="space-y-6">
              {/* Low Stock Alerts Widget */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="material-symbols-outlined text-warning text-[24px]">inventory_2</span>
                  <h3 className="font-bold text-lg">Alertes de Stock Bas</h3>
                </div>
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {lowStockItems.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 text-sm">Tous les stocks sont corrects.</div>
                  ) : (
                    lowStockItems.slice(0, 5).map(item => {
                      const isOutOfStock = item.quantite === 0;
                      const stockBadge = isOutOfStock
                        ? 'bg-danger/10 text-danger border-danger/20'
                        : 'bg-warning/10 text-warning border-warning/20';

                      return (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.nom}</span>
                            <span className="text-xs text-slate-500">{item.categorie_nom}</span>
                          </div>
                          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${stockBadge}`}>
                            {isOutOfStock ? 'Rupture' : `${item.quantite} dispo`}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Team Members Widget (Scoped) */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">group</span>
                    <h3 className="font-bold text-lg">Effectif Logistique</h3>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                    {scopedMembers.length} membres
                  </span>
                </div>
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {scopedMembers.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 text-sm">Aucun équipier dans votre scope.</div>
                  ) : (
                    scopedMembers.slice(0, 4).map(member => {
                      const initials = `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`.toUpperCase() || '?';
                      const roleLabel = rolesMap[member.role]?.label || member.role || 'Membre';
                      const roleStyle = rolesMap[member.role]?.style || 'bg-slate-100 text-slate-600';

                      return (
                        <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                              {initials}
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {member.first_name} {member.last_name}
                              </span>
                              <span className="text-[10px] text-slate-500">{member.phone || 'Pas de numéro'}</span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${roleStyle}`}>
                            {roleLabel}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="material-symbols-outlined text-primary text-[24px]">bolt</span>
                  <h3 className="font-bold text-lg">Actions Rapides</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Link 
                    to="/report" 
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-danger/30 bg-slate-50 dark:bg-slate-800/30 hover:bg-danger/5 transition-all group"
                  >
                    <div className="size-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">build</span>
                    </div>
                    <div className="flex flex-col align-start text-left">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-danger transition-colors">Signaler une Panne</span>
                      <span className="text-xs text-slate-500">Déclarer un dysfonctionnement</span>
                    </div>
                  </Link>

                  <Link 
                    to="/movements" 
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-warning/30 bg-slate-50 dark:bg-slate-800/30 hover:bg-warning/5 transition-all group"
                  >
                    <div className="size-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                    </div>
                    <div className="flex flex-col align-start text-left">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-warning transition-colors">Nouveau Transfert</span>
                      <span className="text-xs text-slate-500">Déplacer du matériel</span>
                    </div>
                  </Link>

                  <Link 
                    to="/inventory" 
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-success/30 bg-slate-50 dark:bg-slate-800/30 hover:bg-success/5 transition-all group"
                  >
                    <div className="size-8 rounded-lg bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-[20px]">add_box</span>
                    </div>
                    <div className="flex flex-col align-start text-left">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-success transition-colors">Ajouter Équipement</span>
                      <span className="text-xs text-slate-500">Créer une fiche matériel</span>
                    </div>
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
