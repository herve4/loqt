import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import { logisticsService } from '../services/api';

const Inventory = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [church, setChurch] = useState('');
  const [status, setStatus] = useState('');

  // Récupérer les catégories et églises pour les filtres
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => logisticsService.getCategories().then(res => res.data)
  });

  const { data: churchesData } = useQuery({
    queryKey: ['churches-list-minimal'],
    queryFn: () => logisticsService.getEglises({ page_size: 100 }).then(res => res.data)
  });

  const { data: materielsData, isLoading, isPlaceholderData } = useQuery({
    queryKey: ['inventory', page, search, category, church, status],
    queryFn: () => logisticsService.getMateriels({ 
      page, 
      search: search || undefined,
      categorie: category || undefined,
      eglise: church || undefined,
      etat: status || undefined
    }).then(res => res.data),
    placeholderData: (previousData) => previousData,
    refetchInterval: 30000 
  });

  const materiels = materielsData?.results || [];
  const totalCount = materielsData?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  const isCategoriesPaginated = !Array.isArray(categoriesData) && categoriesData?.results;
  const categories = isCategoriesPaginated ? categoriesData.results : (Array.isArray(categoriesData) ? categoriesData : []);

  const isChurchesPaginated = !Array.isArray(churchesData) && churchesData?.results;
  const churches = isChurchesPaginated ? churchesData.results : (Array.isArray(churchesData) ? churchesData : []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto bg-background-light dark:bg-background-dark p-8">
        <Header title="Inventaire du Matériel" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 mt-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Inventaire du Matériel</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gestion centrale des équipements des églises régionales.</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Ajout Rapide</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <FilterSelect 
            label="Catégorie" 
            icon="category" 
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            options={categories.map(c => ({ value: c.id, label: c.nom }))} 
          />
          <FilterSelect 
            label="Église d'Origine" 
            icon="church" 
            value={church}
            onChange={(e) => { setChurch(e.target.value); setPage(1); }}
            options={churches.map(c => ({ value: c.id, label: c.nom }))} 
          />
          <FilterSelect 
            label="Statut" 
            icon="info" 
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            options={[
              { value: 'OP', label: 'Opérationnel' },
              { value: 'RE', label: 'En réparation' },
              { value: 'PA', label: 'En panne' },
              { value: 'PE', label: 'Perdu' }
            ]} 
          />
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Recherche</label>
            <div className="flex items-center h-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3">
              <span className="material-symbols-outlined text-slate-400 text-lg mr-2">search</span>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400" 
                placeholder="Nom, ID, Description..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Église d'Origine</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Statut</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading && !isPlaceholderData ? (
                  <tr><td colSpan="6" className="px-6 py-4 text-center">Chargement de l'inventaire...</td></tr>
                ) : materiels.length > 0 ? (
                  materiels.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{item.identifiant_unique || `EQ-${item.id}`}</td>
                      <td className="px-6 py-4">
                        <Link to={`/inventory/${item.id}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors">{item.nom}</Link>
                        <div className="text-xs text-slate-500">Qté: {item.quantite}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {item.categorie_nom || item.categorie}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{item.eglise_nom || 'Siège National'}</td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={item.etat} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-primary" title="Check-out">
                            <span className="material-symbols-outlined text-xl">output</span>
                          </button>
                          <Link to={`/report/${item.id}`} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500" title="Signaler un défaut">
                            <span className="material-symbols-outlined text-xl">report_problem</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="px-6 py-4 text-center py-20">Aucun matériel trouvé correspondant à vos critères.</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
      </main>
    </div>
  );
};

const FilterSelect = ({ label, icon, options, value, onChange }) => (
  <div className="relative group">
    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">{label}</label>
    <div className="flex items-center h-10 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-3">
      <span className="material-symbols-outlined text-slate-400 text-lg mr-2">{icon}</span>
      <select 
        className="w-full bg-transparent border-none focus:ring-0 text-sm appearance-none cursor-pointer"
        value={value}
        onChange={onChange}
      >
        <option value="">Tous/Toutes ({label})</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <span className="material-symbols-outlined text-slate-400 text-lg pointer-events-none">expand_more</span>
    </div>
  </div>
);

export default Inventory;
