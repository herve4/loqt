import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { logisticsService } from '../services/api';
import EgliseFormModal from '../components/EgliseFormModal';
import RegionManagerModal from '../components/RegionManagerModal';
import toast from 'react-hot-toast';

const ChurchesList = () => {
    const queryClient = useQueryClient();
    const [selectedRegion, setSelectedRegion] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Modals states
    const [isEgliseModalOpen, setIsEgliseModalOpen] = useState(false);
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [churchToEdit, setChurchToEdit] = useState(null);

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

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => logisticsService.deleteEglise(id),
        onSuccess: () => {
            toast.success('Église supprimée avec succès !');
            queryClient.invalidateQueries({ queryKey: ['churches'] });
            queryClient.invalidateQueries({ queryKey: ['regions'] });
        },
        onError: () => {
            toast.error("Impossible de supprimer cette église.");
        }
    });

    const handleDeleteChurch = (id, name) => {
        if (window.confirm(`Voulez-vous vraiment supprimer définitivement l'église "${name}" ?`)) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <Layout title="Réseau des Églises">
            <div className="p-8 space-y-8 select-none font-mono text-slate-800 dark:text-slate-200">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Réseau des Églises</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gérer les implantations locales et les coordinations régionales.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <button 
                            onClick={() => setIsRegionModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all rounded-none text-xs uppercase tracking-wider cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">map</span>
                            <span>Gérer les Régions</span>
                        </button>
                        <button 
                            onClick={() => { setChurchToEdit(null); setIsEgliseModalOpen(true); }}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold hover:bg-blue-700 border border-blue-700 transition-all rounded-none text-xs uppercase tracking-wider cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">add_church</span>
                            <span>Nouvelle Église</span>
                        </button>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-none shadow-sm">
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">search</span>
                        <input 
                            type="text" 
                            placeholder="RECHERCHER UNE ÉGLISE OU UNE VILLE..." 
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none focus:border-slate-400 dark:focus:border-slate-600 focus:outline-none focus:ring-0 text-xs transition-all font-mono"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 relative">
                        <select 
                            className="pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none focus:border-slate-400 dark:focus:border-slate-600 focus:outline-none focus:ring-0 text-xs min-w-[200px] appearance-none cursor-pointer font-mono"
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                        >
                            <option value="">TOUTES LES RÉGIONS</option>
                            {regions.map(r => (
                                <option key={r.id} value={r.id}>{r.nom}</option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-sm">expand_more</span>
                    </div>
                </div>

                {/* Regions Summary Cards (Horizontal Slider) */}
                <div className="relative">
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent snap-x snap-mandatory">
                        {regions.map(region => (
                            <div 
                                key={region.id} 
                                onClick={() => setSelectedRegion(selectedRegion === String(region.id) ? '' : String(region.id))}
                                className={`p-4 border rounded-none text-center min-w-[160px] flex-shrink-0 snap-start hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer select-none ${
                                    selectedRegion === String(region.id) 
                                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/10 dark:bg-blue-950/20' 
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                }`}
                            >
                                <span className={`text-[9px] font-black uppercase tracking-widest block truncate ${
                                    selectedRegion === String(region.id) 
                                        ? 'text-blue-600 dark:text-blue-400' 
                                        : 'text-slate-400 dark:text-slate-500'
                                }`}>
                                    {region.nom}
                                </span>
                                <div className="text-2xl font-black text-blue-600 dark:text-blue-500 mt-1">
                                    {region.eglise_count || 0}
                                </div>
                                <div className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">
                                    ÉGLISES
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Churches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {isLoading && !isPlaceholderData ? (
                        Array(8).fill(0).map((_, i) => (
                            <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-none animate-pulse"></div>
                        ))
                    ) : churches.length > 0 ? (
                        churches.map(church => (
                            <div key={church.id} className="group bg-white dark:bg-slate-900 rounded-none border border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col relative">
                                <div className="h-28 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 relative flex items-center justify-center">
                                    <div className="size-16 bg-white border border-slate-200 dark:border-slate-800 p-1.5 transform transition-transform group-hover:scale-105 duration-300 rounded-none">
                                        <img 
                                            src={church.logo || '/static/img/logo-ebng-b.png'} 
                                            alt={church.nom} 
                                            className="w-full h-full object-contain select-none"
                                            onError={(e) => { e.target.src = '/static/img/logo-ebng-b.png'; }}
                                        />
                                    </div>
                                    {church.is_national_hq && (
                                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-blue-600/10 border border-blue-600/20 text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider rounded-none">Siège National</span>
                                    )}
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1 mb-1">{church.nom}</h4>
                                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px] mb-4">
                                        <span className="material-symbols-outlined text-xs">location_on</span>
                                        <span className="uppercase tracking-wider font-semibold">{church.ville_nom || 'Côte d\'Ivoire'}</span>
                                    </div>
                                    
                                    <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider">PASTEUR</span>
                                            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{church.pasteur_nom || 'Non assigné'}</span>
                                        </div>
                                        
                                        {/* Actions buttons */}
                                        <div className="flex gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setChurchToEdit(church);
                                                    setIsEgliseModalOpen(true);
                                                }}
                                                className="size-7 bg-slate-50 dark:bg-slate-950 hover:bg-blue-600 hover:text-white border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors rounded-none cursor-pointer"
                                                title="Modifier l'église"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">edit</span>
                                            </button>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteChurch(church.id, church.nom);
                                                }}
                                                className="size-7 bg-slate-50 dark:bg-slate-950 hover:bg-rose-950/20 hover:border-rose-900 hover:text-rose-500 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors rounded-none cursor-pointer"
                                                title="Supprimer l'église"
                                            >
                                                <span className="material-symbols-outlined text-[15px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 text-center flex flex-col items-center border border-slate-200 dark:border-slate-800 rounded-none bg-white dark:bg-slate-900">
                            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3 font-thin">church</span>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Aucune église ne correspond à votre recherche.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 py-8">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                            Précédent
                        </button>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Page <span className="text-blue-600 dark:text-blue-400">{page}</span> sur {totalPages}
                        </span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                            Suivant
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Forms */}
            <EgliseFormModal 
                isOpen={isEgliseModalOpen} 
                onClose={() => { setIsEgliseModalOpen(false); setChurchToEdit(null); }}
                churchToEdit={churchToEdit}
            />

            <RegionManagerModal 
                isOpen={isRegionModalOpen} 
                onClose={() => setIsRegionModalOpen(false)}
            />
        </Layout>
    );
};

export default ChurchesList;
