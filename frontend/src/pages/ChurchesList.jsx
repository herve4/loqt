import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { logisticsService } from '../services/api';

const ChurchesList = () => {
    const [selectedRegion, setSelectedRegion] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [selectedRegion, searchTerm]);

    const { data: regionsData } = useQuery({
        queryKey: ['regions'],
        queryFn: () => logisticsService.getRegions().then(res => res.data)
    });

    const { data: churchesData, isLoading, isPlaceholderData } = useQuery({
        queryKey: ['churches', page, selectedRegion, searchTerm],
        queryFn: () => logisticsService.getEglises({ 
            page, 
            region: selectedRegion || undefined, 
            search: searchTerm || undefined 
        }).then(res => res.data),
        placeholderData: (previousData) => previousData,
        refetchInterval: 60000
    });

    const regions = Array.isArray(regionsData) ? regionsData : (regionsData?.results || []);
    const isPaginated = !Array.isArray(churchesData) && churchesData?.results;
    const churches = isPaginated ? churchesData.results : (Array.isArray(churchesData) ? churchesData : []);
    const totalCount = isPaginated ? churchesData.count : (Array.isArray(churchesData) ? churchesData.length : 0);
    const totalPages = isPaginated ? Math.ceil(totalCount / 10) : 1; 

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-y-auto">
                <Header title="Réseau des Églises" />
                <div className="p-8 space-y-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Réseau des Églises</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Gérer les implantations locales et les coordinations régionales.</p>
                        </div>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25">
                            <span className="material-symbols-outlined">add_church</span>
                            <span>Nouvelle Église</span>
                        </button>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                            <input 
                                type="text" 
                                placeholder="Rechercher une église ou une ville..." 
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <select 
                                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-primary text-sm min-w-[200px]"
                                value={selectedRegion}
                                onChange={(e) => setSelectedRegion(e.target.value)}
                            >
                                <option value="">Toutes les Régions</option>
                                {regions.map(r => (
                                    <option key={r.id} value={r.id}>{r.nom}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Regions Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {regions.slice(0, 6).map(region => (
                            <div key={region.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{region.nom}</span>
                                <div className="text-xl font-black text-primary mt-1">{region.eglise_count || 0}</div>
                                <div className="text-[10px] text-slate-400">Églises</div>
                            </div>
                        ))}
                    </div>

                    {/* Churches Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {isLoading && !isPlaceholderData ? (
                            Array(8).fill(0).map((_, i) => (
                                <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl"></div>
                            ))
                        ) : churches.length > 0 ? (
                            churches.map(church => (
                                <div key={church.id} className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
                                    <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 relative flex items-center justify-center">
                                        <div className="size-20 bg-white rounded-2xl shadow-md p-2 transform transition-transform group-hover:scale-110 duration-300">
                                            <img 
                                                src={church.logo || '/static/img/logo-ebng-b.png'} 
                                                alt={church.nom} 
                                                className="w-full h-full object-contain"
                                                onError={(e) => { e.target.src = '/static/img/logo-ebng-b.png'; }}
                                            />
                                        </div>
                                        {church.is_national_hq && (
                                            <span className="absolute top-3 right-3 px-2 py-1 bg-primary text-[10px] font-bold text-white rounded-full uppercase tracking-tighter">Siège National</span>
                                        )}
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1">{church.nom}</h4>
                                        <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                                            <span className="material-symbols-outlined text-sm">location_on</span>
                                            <span>{church.ville_nom || 'Côte d\'Ivoire'}</span>
                                        </div>
                                        
                                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pasteur</span>
                                                <span className="text-xs font-semibold">{church.pasteur_nom || 'Non assigné'}</span>
                                            </div>
                                            <button className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-sm">chevron_right</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center flex flex-col items-center">
                                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4 font-thin">church</span>
                                <p className="text-slate-500 font-medium">Aucune église ne correspond à votre recherche.</p>
                            </div>
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
            </main>
        </div>
    );
};

export default ChurchesList;
