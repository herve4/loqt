import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { logisticsService } from '../services/api';
import EgliseFormModal from '../components/EgliseFormModal';
import RegionManagerModal from '../components/RegionManagerModal';
import VilleManagerModal from '../components/VilleManagerModal';
import ConfirmModal from '../components/ConfirmModal';
import ImportEgliseModal from '../components/ImportEgliseModal';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const ChurchesList = () => {
    const queryClient = useQueryClient();
    const [selectedRegion, setSelectedRegion] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    // Modals states
    const [isEgliseModalOpen, setIsEgliseModalOpen] = useState(false);
    const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
    const [isVilleModalOpen, setIsVilleModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [churchToEdit, setChurchToEdit] = useState(null);

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
        setItemToDelete({ id, name });
        setDeleteConfirmOpen(true);
    };

    const fetchAllFilteredEglises = async () => {
        try {
            const res = await logisticsService.getEglises({
                page_size: 10000,
                region: selectedRegion || undefined,
                search: searchTerm || undefined
            });
            const all = Array.isArray(res.data) ? res.data : (res.data?.results || []);
            return all;
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors du chargement des données.");
            return [];
        }
    };

    const handleExportXLSX = async () => {
        const loadToastId = toast.loading("Préparation de l'export Excel...");
        const items = await fetchAllFilteredEglises();
        if (items.length === 0) {
            toast.error("Aucune donnée à exporter.", { id: loadToastId });
            return;
        }

        const exportData = items.map(item => ({
            "IDENTIFIANT_UNIQUE": `SGL-EG-${String(item.id).padStart(3, '0')}`,
            "NOM": item.nom,
            "VILLE": item.ville_nom || '',
            "REGION": item.region_nom || '',
            "PASTEUR": item.pasteur_nom || 'Non assigné',
            "TELEPHONE": item.phone || '',
            "HQ_NATIONAL": item.is_national_hq ? "Oui" : "Non"
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Eglises");
        XLSX.writeFile(workbook, "SGL-CI_Reseau_Eglises.xlsx");
        toast.success("Export Excel terminé !", { id: loadToastId });
    };

    const handleExportCSV = async () => {
        const loadToastId = toast.loading("Préparation de l'export CSV...");
        const items = await fetchAllFilteredEglises();
        if (items.length === 0) {
            toast.error("Aucune donnée à exporter.", { id: loadToastId });
            return;
        }

        const exportData = items.map(item => ({
            "IDENTIFIANT_UNIQUE": `SGL-EG-${String(item.id).padStart(3, '0')}`,
            "NOM": item.nom,
            "VILLE": item.ville_nom || '',
            "REGION": item.region_nom || '',
            "PASTEUR": item.pasteur_nom || 'Non assigné',
            "TELEPHONE": item.phone || '',
            "HQ_NATIONAL": item.is_national_hq ? "Oui" : "Non"
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const csvContent = XLSX.utils.sheet_to_csv(worksheet);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "SGL-CI_Reseau_Eglises.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Export CSV terminé !", { id: loadToastId });
    };

    const handleExportPDF = async () => {
        const loadToastId = toast.loading("Génération du fichier PDF...");
        const items = await fetchAllFilteredEglises();
        if (items.length === 0) {
            toast.error("Aucune donnée à exporter.", { id: loadToastId });
            return;
        }

        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            // Title & Header SGL-CI
            doc.setFont("helvetica", "bold");
            doc.setFontSize(15);
            doc.text("SYSTEME DE GESTION LOGISTIQUE COTE D'IVOIRE", 14, 18);
            
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text("RESEAU DES EGLISES ET DES IMPLANTATIONS LOCALES", 14, 23);

            doc.setDrawColor(0);
            doc.setLineWidth(0.5);
            doc.line(14, 26, 283, 26);

            // Document title
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text("ANNUAIRE OFFICIEL DES IMPLANTATIONS LOCALES", 14, 34);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(120);
            const generatedAt = `Généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
            doc.text(generatedAt, 14, 39);

            // Table mapping
            const tableColumn = [
                "ID / REF", 
                "NOM DE L'EGLISE", 
                "VILLE", 
                "REGION", 
                "PASTEUR", 
                "TELEPHONE",
                "HQ NATIONAL"
            ];
            const tableRows = items.map(item => [
                `SGL-EG-${String(item.id).padStart(3, '0')}`,
                item.nom,
                item.ville_nom || '-',
                item.region_nom || '-',
                item.pasteur_nom || 'Non assigné',
                item.phone || '-',
                item.is_national_hq ? 'Oui' : 'Non'
            ]);

            // Generate table
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 46,
                theme: 'striped',
                headStyles: {
                    fillColor: [15, 23, 42],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'left'
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [30, 41, 59]
                },
                columnStyles: {
                    0: { cellWidth: 30, fontStyle: 'bold' },
                    1: { cellWidth: 65 },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 50 },
                    5: { cellWidth: 30 },
                    6: { cellWidth: 24, halign: 'center' }
                },
                margin: { top: 46, left: 14, right: 14 },
                didDrawPage: () => {
                    const str = `Page ${doc.internal.getNumberOfPages()}`;
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    doc.text(str, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
                }
            });

            doc.save("SGL-CI_Reseau_Eglises.pdf");
            toast.success("Téléchargement du PDF réussi !", { id: loadToastId });
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de la génération du PDF.", { id: loadToastId });
        }
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            {
                "IDENTIFIANT_UNIQUE": "SGL-EG-999",
                "NOM": "Eglise Exemple de Test (Requis)",
                "VILLE": "Abidjan (Requis)",
                "REGION": "Lagunes (Optionnel)",
                "PASTEUR": "Jean Koffi (Optionnel, nom existant)",
                "TELEPHONE": "+225 0102030405 (Unique)",
                "SIEGE_NATIONAL": "Non"
            },
            {
                "IDENTIFIANT_UNIQUE": "",
                "NOM": "Instructions d'importation",
                "VILLE": "1. VILLE est requise. Si elle n'existe pas en base, elle sera creee.",
                "REGION": "2. REGION sera creee si elle est nouvelle.",
                "PASTEUR": "3. PASTEUR doit etre le nom d'un membre existant.",
                "TELEPHONE": "4. TELEPHONE doit etre unique s'il est fourni.",
                "SIEGE_NATIONAL": "5. SIEGE_NATIONAL : Oui ou Non."
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Modele_Import_Eglises");
        XLSX.writeFile(workbook, "SGL-CI_Modele_Import_Eglises.xlsx");
        toast.success("Modele d'importation des Eglises telecharge !");
    };

    return (
        <Layout title="Réseau des Églises">
            <div className="p-8 space-y-8 select-none font-mono text-slate-800 dark:text-slate-200">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Réseau des Églises</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Gérer les implantations locales et les coordinations régionales.</p>
                        
                        {/* Rapid Diagnostic HUD */}
                        <div className="flex gap-3 mt-3.5 font-mono">
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-1.5 rounded-none">
                                <span className="relative size-1.5 flex items-center justify-center">
                                    <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
                                    <span className="relative size-1.5 rounded-full bg-blue-500" />
                                </span>
                                <span className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                    {regions.length} RÉGIONS
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 px-3 py-1.5 rounded-none">
                                <span className="relative size-1.5 flex items-center justify-center">
                                    <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
                                    <span className="relative size-1.5 rounded-full bg-blue-500" />
                                </span>
                                <span className="text-[10px] font-black tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                                    {totalCount} ÉGLISES
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {/* Actions de Données Dropdown */}
                        <div className="relative group">
                            <button 
                                type="button"
                                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-none font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-xs uppercase tracking-wider cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-sm">database</span>
                                <span>Actions de Données</span>
                                <span className="material-symbols-outlined text-xs">expand_more</span>
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-none py-1.5 z-40 hidden group-hover:block animate-in fade-in duration-100">
                                <button
                                    type="button"
                                    onClick={handleExportXLSX}
                                    className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                                >
                                    <span className="material-symbols-outlined text-base">download_for_offline</span>
                                    Exporter en XLSX
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportCSV}
                                    className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                                >
                                    <span className="material-symbols-outlined text-base">csv</span>
                                    Exporter en CSV
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportPDF}
                                    className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                                >
                                    <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                                    Exporter en PDF
                                </button>
                                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />
                                <button
                                    type="button"
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                                >
                                    <span className="material-symbols-outlined text-base">upload_file</span>
                                    Importer XLSX / CSV
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="w-full text-left px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer border-0 bg-transparent outline-none w-full"
                                >
                                    <span className="material-symbols-outlined text-base">file_download</span>
                                    Télécharger le Modèle
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={() => setIsRegionModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all rounded-none text-xs uppercase tracking-wider cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">map</span>
                            <span>Gérer les Régions</span>
                        </button>
                        <button 
                            onClick={() => setIsVilleModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-all rounded-none text-xs uppercase tracking-wider cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-sm">location_city</span>
                            <span>Gérer les Villes</span>
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
                            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="flex gap-4 relative">
                        <select 
                            className="pl-3 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none focus:border-slate-400 dark:focus:border-slate-600 focus:outline-none focus:ring-0 text-xs min-w-[200px] appearance-none cursor-pointer font-mono"
                            value={selectedRegion}
                            onChange={(e) => { setSelectedRegion(e.target.value); setPage(1); }}
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
                                onClick={() => { setSelectedRegion(selectedRegion === String(region.id) ? '' : String(region.id)); setPage(1); }}
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

            <ImportEgliseModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['churches'] });
                    setIsImportModalOpen(false);
                }}
            />

            <RegionManagerModal 
                isOpen={isRegionModalOpen} 
                onClose={() => setIsRegionModalOpen(false)}
            />

            <VilleManagerModal 
                isOpen={isVilleModalOpen} 
                onClose={() => setIsVilleModalOpen(false)}
            />

            <ConfirmModal
                isOpen={deleteConfirmOpen}
                title="SUPPRESSION D'ÉGLISE"
                message={`Voulez-vous vraiment supprimer définitivement l'église "${itemToDelete?.name}" ?`}
                onConfirm={() => {
                    deleteMutation.mutate(itemToDelete.id);
                    setDeleteConfirmOpen(false);
                }}
                onCancel={() => setDeleteConfirmOpen(false)}
            />
        </Layout>
    );
};

export default ChurchesList;
