import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import { logisticsService } from '../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESOURCE_TYPE_TAG = {
  video: { label: 'VIDEO', color: 'bg-primary' },
  pdf: { label: 'MANUEL', color: 'bg-emerald-500' },
  autre: { label: 'INTERACTIV', color: 'bg-amber-500' },
};

const getPoleIcon = (poleName) => {
  const name = poleName?.toLowerCase() || '';
  if (name.includes('vidéo') || name.includes('video')) return 'video_camera_back';
  if (name.includes('audio') || name.includes('son')) return 'volume_up';
  if (name.includes('élec') || name.includes('elect')) return 'bolt';
  if (name.includes('logist') || name.includes('fret')) return 'local_shipping';
  if (name.includes('sécu') || name.includes('safe')) return 'health_and_safety';
  return 'grid_view';
};

// ─── Main Component ───────────────────────────────────────────────────────────

const TrainingHub = () => {
  const [selectedPole, setSelectedPole] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const { data: resourcesData, isLoading: resourcesLoading, isPlaceholderData } = useQuery({
    queryKey: ['ressources', page, searchQuery, selectedPole],
    queryFn: () => logisticsService.getRessources({ 
      page, 
      search: searchQuery || undefined,
      pole: selectedPole || undefined 
    }).then(r => r.data),
    placeholderData: (previousData) => previousData,
    refetchInterval: 60000
  });

  const { data: polesData } = useQuery({
    queryKey: ['poles'],
    queryFn: () => logisticsService.getPoles().then(r => r.data),
  });

  const isPaginated = !Array.isArray(resourcesData) && resourcesData?.results;
  const resources = isPaginated ? resourcesData.results : (Array.isArray(resourcesData) ? resourcesData : []);
  const totalCount = isPaginated ? resourcesData.count : resources.length;
  const totalPages = isPaginated ? Math.ceil(totalCount / PAGE_SIZE) : 1;

  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);

  const featuredResources = resources.slice(0, 3);
  const recentResources = resources.slice(0, 2);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* TopNavBar */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark px-6 md:px-10 py-3 sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 text-primary">
              <div className="size-8 bg-primary rounded flex items-center justify-center">
                <span className="material-symbols-outlined text-white">school</span>
              </div>
              <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight">SGL-CI Hub</h2>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => setSelectedPole(null)} className="text-slate-600 dark:text-slate-400 hover:text-primary text-sm font-medium">Tutoriels</button>
              <button className="text-slate-600 dark:text-slate-400 hover:text-primary text-sm font-medium">Manuels</button>
              <button className="text-slate-600 dark:text-slate-400 hover:text-primary text-sm font-medium">Vidéos</button>
            </nav>
          </div>
          <div className="flex flex-1 justify-end gap-4 md:gap-8 items-center">
            <div className="hidden sm:flex min-w-40 h-10 max-w-64">
              <div className="flex w-full flex-1 items-stretch rounded bg-slate-100 dark:bg-slate-800">
                <div className="text-slate-400 flex items-center justify-center pl-4">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>
                <input 
                  className="form-input w-full border-none bg-transparent text-slate-900 dark:text-slate-100 focus:ring-0 text-sm placeholder:text-slate-400" 
                  placeholder="Rechercher des ressources..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <p className="text-xs font-bold">Jean Dupont</p>
                <p className="text-[10px] text-slate-500">Logistique Manager</p>
              </div>
              <div className="size-10 rounded-full border-2 border-primary/20 bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url('https://i.pravatar.cc/150?u=jean')` }}></div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 md:px-10 lg:px-20 py-8">
          {/* Hero Section */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Bienvenue sur le Learning Hub</h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
              Accédez à toutes les ressources techniques, manuels d'équipement et guides vidéo pour les opérations SGL-CI en un seul endroit.
            </p>
          </div>

          {/* Featured Tutorials */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">stars</span>
                Tutoriels à la Une
              </h2>
              <button className="text-sm font-semibold text-primary hover:underline">Voir tout</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredResources.map(res => (
                <div key={res.id} className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 flex flex-col group hover:shadow-lg transition-all">
                  <div className="h-48 bg-center bg-no-repeat bg-cover relative" style={{ backgroundImage: res.image ? `url(${res.image})` : 'url(https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=600&q=80)' }}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <div className="bg-white/90 p-3 rounded-full text-primary shadow-lg scale-0 group-hover:scale-100 transition-transform">
                        <span className="material-symbols-outlined text-3xl">play_circle</span>
                      </div>
                    </div>
                    <div className={`absolute top-4 left-4 ${RESOURCE_TYPE_TAG[res.type_ressource]?.color} text-white text-[10px] font-bold px-2 py-1 rounded`}>
                      {RESOURCE_TYPE_TAG[res.type_ressource]?.label}
                    </div>
                  </div>
                  <div className="p-5 flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">{res.titre}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{res.description}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span> {res.date_ajout ? 'Nouveau' : '15 min'}
                      </span>
                      <a href={res.lien_url || res.fichier} target="_blank" rel="noreferrer" className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary hover:text-white transition-colors">
                        Démarrer
                      </a>
                    </div>
                  </div>
                </div>
              ))}
              {featuredResources.length === 0 && <div className="col-span-3 py-10 text-center text-slate-400">Aucune ressource trouvée.</div>}
            </div>
          </section>

          {/* Technical Poles & Library */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">category</span>
                Pôles Techniques
              </h2>
              <div className="space-y-2">
                <button 
                  onClick={() => { setSelectedPole(null); setPage(1); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors ${!selectedPole ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                >
                  <span className="material-symbols-outlined">grid_view</span> Toutes les Ressources
                </button>
                {poles.map(pole => (
                  <button 
                    key={pole.id}
                    onClick={() => { setSelectedPole(pole.id); setPage(1); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-colors ${selectedPole === pole.id ? 'bg-primary text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                  >
                    <span className="material-symbols-outlined">{getPoleIcon(pole.nom)}</span> {pole.nom}
                  </button>
                ))}
              </div>
            </div>

            {/* Library Content */}
            <div className="lg:col-span-3">
              {/* Progress Section */}
              <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6 border border-primary/10">
                <div className="size-16 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
                  <span className="material-symbols-outlined text-3xl">trending_up</span>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-bold">Votre Progression d'Apprentissage</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Vous avez terminé 4 tutoriels cette semaine. Continuez comme ça !</p>
                  <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full w-[65%]"></div>
                  </div>
                </div>
                <div className="shrink-0 text-center">
                  <p className="text-2xl font-bold text-primary">65%</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Score Global</p>
                </div>
              </div>

              {/* Recently Viewed */}
              <h3 className="text-lg font-bold mb-4">Consulté Récemment</h3>
              <div className="space-y-4 mb-10">
                {recentResources.map(res => (
                  <div key={res.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
                    <div className="size-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined">
                        {res.type_ressource === 'video' ? 'play_circle' : 'picture_as_pdf'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold">{res.titre}</h4>
                      <p className="text-xs text-slate-500">Vu récemment • {res.pole_nom}</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                  </div>
                ))}
              </div>

              {/* Full Library */}
              <h3 className="text-lg font-bold mb-4">Librairie Complète</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resourcesLoading && !isPlaceholderData ? (
                  Array(6).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl"></div>
                  ))
                ) : resources.length > 0 ? (
                  resources.map(res => (
                    <div key={res.id} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/30 transition-colors shadow-sm">
                      <div className="size-16 shrink-0 bg-slate-100 dark:bg-slate-700 rounded-lg bg-center bg-no-repeat bg-cover" style={{ backgroundImage: res.image ? `url(${res.image})` : 'none' }}>
                        {!res.image && <span className="flex h-full items-center justify-center text-slate-400 material-symbols-outlined">auto_stories</span>}
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="text-sm font-bold">{res.titre}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{res.description}</p>
                        <div className="mt-2 flex gap-2">
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase font-bold text-slate-500">{res.pole_nom}</span>
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase font-bold text-slate-500">{res.type_ressource}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 py-10 text-center text-slate-400">Aucune ressource trouvée.</div>
                )}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-8">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                    Précédent
                  </button>
                  <span className="text-sm font-bold text-slate-500">
                    Page <span className="text-primary">{page}</span> sur {totalPages}
                  </span>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                  >
                    Suivant
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Floating Progress Team Bar */}
        <div className="hidden md:flex sticky bottom-0 bg-white dark:bg-background-dark border-t border-slate-200 dark:border-slate-800 px-10 py-4 items-center justify-between z-50">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="size-8 rounded-full border-2 border-white dark:border-background-dark bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url(https://i.pravatar.cc/100?u=${i})` }}></div>
              ))}
            </div>
            <p className="text-xs text-slate-500 font-medium">12 collègues sont actuellement en formation en ligne</p>
          </div>
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">help_outline</span>
            </button>
            <button className="text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingHub;
