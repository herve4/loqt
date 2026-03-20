import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { logisticsService } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { toast } from 'react-hot-toast';
import { CHRONOGRAM_TEMPLATES } from '../constants/eventTemplates';
import DatePicker, { registerLocale } from "react-datepicker";
import { fr } from 'date-fns/locale/fr';

registerLocale('fr', fr);

const EventsList = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    
    // Réinitialiser la page lors d'un changement de recherche ou de filtre
    React.useEffect(() => {
        setPage(1);
    }, [searchTerm, selectedType, selectedStatus]);

    // État du formulaire
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        titre: '',
        type_evenement: 'seminaire',
        lieu: '',
        eglise: '',
        date_debut: new Date(),
        date_fin: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // +2h par défaut
        description: '',
        type_programme: 'local',
        besoin_chronogramme: false,
        besoin_images: false,
        chronogramme: [] // Liste d'objets { heure, activite, responsable }
    });

    const [selectedImages, setSelectedImages] = useState([]); // Fichiers à uploader
    const [showTemplates, setShowTemplates] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Récupération des événements
    const { data: eventsData, isLoading: eventsLoading } = useQuery({
        queryKey: ['events', page, searchTerm, selectedType, selectedStatus],
        queryFn: () => logisticsService.getEvenements({
            page,
            search: searchTerm || undefined,
            type_evenement: selectedType || undefined,
            statut: selectedStatus || undefined
        }).then(res => res.data),
    });

    // Récupération des églises pour le dropdown
    const { data: churchesData } = useQuery({
        queryKey: ['churches-all'],
        queryFn: () => logisticsService.getEglises({ page_size: 100 }).then(res => res.data),
    });

    // Récupération des modèles de chronogramme
    const { data: userTemplates } = useQuery({
        queryKey: ['chronogram-templates'],
        queryFn: () => logisticsService.getChronogramTemplates().then(res => res.data.results || res.data),
    });

    const events = eventsData?.results || [];
    const churches = churchesData?.results || (Array.isArray(churchesData) ? churchesData : []);
    const totalCount = eventsData?.count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / 10));
    const activeEventsCount = events.filter(e => e.statut === 'valide').length;

    const eventTypes = [
        { id: 'seminaire', label: 'Séminaire' },
        { id: 'conference', label: 'Conférence' },
        { id: 'culte', label: 'Culte Spécial' },
        { id: 'concert', label: 'Concert' },
        { id: 'camp', label: 'Camp Mondial' },
        { id: 'autre', label: 'Autre' }
    ];

    // Mutations CRUD
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            const payload = {
                ...data,
                date_debut: data.date_debut instanceof Date ? data.date_debut.toISOString() : data.date_debut,
                date_fin: data.date_fin instanceof Date ? data.date_fin.toISOString() : data.date_fin
            };

            let res;
            if (editingId) {
                res = await logisticsService.patchEvenement(editingId, payload);
            } else {
                res = await logisticsService.postEvenement(payload);
            }

            const eventId = res.data.id;

            // Upload des images d'illustration si présentes
            if (selectedImages.length > 0) {
                for (const file of selectedImages) {
                    const imgFormData = new FormData();
                    imgFormData.append('evenement', eventId);
                    imgFormData.append('image', file);
                    await logisticsService.postEvenementImage(imgFormData);
                }
            }
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['events']);
            toast.success(editingId ? 'Événement mis à jour' : 'Événement créé avec succès');
            resetForm();
            setIsFormOpen(false);
        },
        onError: (error) => {
            const errorMsg = error.response?.data?.non_field_errors?.[0] || 'Erreur lors de l\'enregistrement';
            toast.error(errorMsg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => logisticsService.deleteEvenement(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['events']);
            toast.success('Événement supprimé');
        }
    });

    const handleEdit = (event) => {
        setEditingId(event.id);
        setFormData({
            titre: event.titre,
            type_evenement: event.type_evenement,
            lieu: event.lieu || '',
            eglise: event.eglise || '',
            date_debut: new Date(event.date_debut),
            date_fin: new Date(event.date_fin),
            description: event.description || '',
            type_programme: event.type_programme || 'local',
            besoin_chronogramme: event.besoin_chronogramme || false,
            besoin_images: event.besoin_images || false,
            chronogramme: event.chronogramme || []
        });
        setSelectedImages([]); // On ne récupère pas les fichiers (images existantes déjà affichées via images_illustration)
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            titre: '',
            type_evenement: 'seminaire',
            lieu: '',
            eglise: '',
            date_debut: new Date(),
            date_fin: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
            description: '',
            type_programme: 'local',
            besoin_chronogramme: false,
            besoin_images: false,
            chronogramme: []
        });
        setSelectedImages([]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const addChronogramRow = () => {
        setFormData({
            ...formData, 
            chronogramme: [...formData.chronogramme, { heure: '', activite: '', responsable: '' }]
        });
    };

    const updateChronogramRow = (index, field, value) => {
        const newChronogram = [...formData.chronogramme];
        newChronogram[index][field] = value;
        setFormData({ ...formData, chronogramme: newChronogram });
    };

    const removeChronogramRow = (index) => {
        setFormData({
            ...formData,
            chronogramme: formData.chronogramme.filter((_, i) => i !== index)
        });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            setSelectedImages(prev => [...prev, ...files]);
            handleScanPoster(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            setSelectedImages(prev => [...prev, ...files]);
            handleScanPoster(files[0]);
        }
    };

    const removeImage = (index) => {
        setSelectedImages(selectedImages.filter((_, i) => i !== index));
    };

    const handleScanPoster = async (file) => {
        const scanFormData = new FormData();
        scanFormData.append('image', file);
        
        setIsScanning(true);
        const loadingToast = toast.loading("Analyse de l'affiche par l'IA...");
        try {
            const res = await logisticsService.scanPoster(scanFormData);
            const data = res.data;
            
            setFormData(prev => ({
                ...prev,
                titre: data.titre || prev.titre,
                lieu: data.lieu || prev.lieu,
                description: data.description || prev.description,
                type_evenement: data.type_evenement || prev.type_evenement,
                date_debut: data.date_debut ? new Date(data.date_debut) : prev.date_debut,
                date_fin: data.date_fin ? new Date(data.date_fin) : prev.date_fin,
            }));
            
            toast.success("Analyse terminée ! Les champs ont été remplis.", { id: loadingToast });
        } catch (error) {
            toast.error("Erreur lors de l'analyse de l'image.", { id: loadingToast });
        } finally {
            setIsScanning(false);
        }
    };

    const handleExtractChronogram = async (file) => {
        if (!file) return;
        const scanFormData = new FormData();
        scanFormData.append('file', file);
        
        setIsScanning(true);
        const loadingToast = toast.loading("Extraction du programme par l'IA...");
        try {
            const res = await logisticsService.extractChronogram(scanFormData);
            const data = res.data;
            
            if (data.items && data.items.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    chronogramme: [...prev.chronogramme, ...data.items],
                    besoin_chronogramme: true
                }));
                toast.success(`${data.items.length} activités extraites avec succès !`, { id: loadingToast });
            } else {
                toast.error("Aucune activité détectée dans ce document.", { id: loadingToast });
            }
        } catch (error) {
            toast.error("Erreur lors de l'extraction du document.", { id: loadingToast });
        } finally {
            setIsScanning(false);
        }
    };

    const applyTemplate = (template) => {
        if (!template) return;
        
        // Adapter les items selon la source (DB: heure_debut, Const: heure)
        const rawItems = template.items || [];
        const adaptedItems = rawItems.map(item => ({
            heure: item.heure_debut || item.heure || '',
            activite: item.titre || item.activite || '',
            responsable: item.responsable || ''
        }));

        setFormData({ ...formData, chronogramme: adaptedItems });
        toast.success(`Modèle "${template.nom || template.title}" appliqué`);
    };

    const handleDelete = (id) => {
        if (window.confirm('Voulez-vous vraiment supprimer cet événement ?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-background-dark">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-y-auto">
                <Header title="Logistique SGL-CI" />
                
                <main className="p-8 max-w-[1600px] mx-auto w-full">
                    {/* En-tête de page */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Gestion des Événements</h2>
                            <p className="text-slate-500 mt-1">Configurez les ressources techniques et le calendrier des événements en Côte d'Ivoire.</p>
                        </div>
                        <div className="flex gap-3">
                            <Link 
                                to="/events/calendar"
                                className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded hover:bg-slate-50 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">calendar_month</span>
                                Vue Calendrier
                            </Link>
                            <Link 
                                to="/chronograms/library"
                                className="flex items-center gap-2 px-4 py-2 border border-primary text-primary font-semibold text-sm rounded hover:bg-primary/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-sm">book_online</span>
                                Bibliothèque
                            </Link>
                            <button 
                                onClick={() => {
                                    resetForm();
                                    setIsFormOpen(!isFormOpen);
                                }}
                                className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-bold text-sm rounded hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                            >
                                <span className="material-symbols-outlined text-sm">{isFormOpen ? 'close' : 'add'}</span>
                                {isFormOpen ? 'Fermer' : 'Nouvel Événement'}
                            </button>
                        </div>
                    </div>

                    {/* Layout Bento Grid */}
                    <div className="grid grid-cols-12 gap-8">
                        
                        {/* GAUCHE : Formulaire de Configuration (5/12) */}
                        {isFormOpen && (
                            <div className="col-span-12 lg:col-span-5 animate-in slide-in-from-left duration-500">
                            <section className="bg-white dark:bg-slate-900 shadow-sm p-8 border-t-4 border-primary rounded-sm transition-all hover:shadow-md sticky top-4">
                                <h3 className="text-xs uppercase tracking-[0.2em] font-black text-slate-400 mb-6">
                                    {editingId ? 'Modifier la Configuration' : 'Nouvelle Configuration d\'Événement'}
                                </h3>
                                <form className="space-y-6" onSubmit={handleSubmit}>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Nom de l'Événement</label>
                                        <input 
                                            className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-300 bg-transparent"
                                            type="text" 
                                            placeholder="Ex: Séminaire National 2024"
                                            value={formData.titre}
                                            onChange={(e) => setFormData({...formData, titre: e.target.value})}
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Type</label>
                                            <select 
                                                className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-sm appearance-none bg-transparent dark:text-white"
                                                value={formData.type_evenement}
                                                onChange={(e) => setFormData({...formData, type_evenement: e.target.value})}
                                            >
                                                {eventTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Site (Église)</label>
                                            <select 
                                                className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-sm appearance-none bg-transparent dark:text-white"
                                                value={formData.eglise}
                                                onChange={(e) => setFormData({...formData, eglise: e.target.value})}
                                            >
                                                <option value="">Sélectionnez un site</option>
                                                {churches.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Date de Début</label>
                                            <DatePicker
                                                selected={formData.date_debut}
                                                onChange={(date) => setFormData({...formData, date_debut: date})}
                                                showTimeSelect
                                                dateFormat="Pp"
                                                locale="fr"
                                                className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-sm bg-transparent dark:text-white"
                                                placeholderText="Choisir une date"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Date de Fin</label>
                                            <DatePicker
                                                selected={formData.date_fin}
                                                onChange={(date) => setFormData({...formData, date_fin: date})}
                                                showTimeSelect
                                                dateFormat="Pp"
                                                locale="fr"
                                                className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-sm bg-transparent dark:text-white"
                                                placeholderText="Choisir une date"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-2">
                                        <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm">
                                            <input 
                                                type="checkbox" 
                                                className="rounded text-primary focus:ring-primary size-4"
                                                checked={formData.besoin_chronogramme}
                                                onChange={(e) => setFormData({...formData, besoin_chronogramme: e.target.checked})}
                                            />
                                            <span className="text-[10px] uppercase font-black text-slate-500">Chronogramme ?</span>
                                        </label>
                                        <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shadow-sm">
                                            <input 
                                                type="checkbox" 
                                                className="rounded text-primary focus:ring-primary size-4"
                                                checked={formData.besoin_images}
                                                onChange={(e) => setFormData({...formData, besoin_images: e.target.checked})}
                                            />
                                            <span className="text-[10px] uppercase font-black text-slate-500">Images ?</span>
                                        </label>
                                    </div>

                                    <div className="space-y-1.5 pt-2">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Lieu Précis (Salle, Adresse, etc.)</label>
                                        <input 
                                            className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 bg-transparent"
                                            type="text" 
                                            placeholder="Ex: Salle Polyvalente, Rez-de-chaussée"
                                            value={formData.lieu}
                                            onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                                        />
                                    </div>

                                    {/* SECTION CHRONOGRAMME */}
                                    {formData.besoin_chronogramme && (
                                        <div className="space-y-4 pt-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-[9px] uppercase tracking-widest font-black text-primary">Chronogramme Détaillé</label>
                                                    <select 
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (!val) return;
                                                            const template = userTemplates?.find(t => String(t.id) === val) || 
                                                                             CHRONOGRAM_TEMPLATES.find(t => t.id === val);
                                                            if (template) applyTemplate(template);
                                                        }}
                                                        className="text-[9px] bg-primary/10 text-primary border-none rounded-full font-bold px-2 py-0.5 focus:ring-0 cursor-pointer uppercase tracking-tight outline-none"
                                                    >
                                                        <option value="">Charger un modèle...</option>
                                                        {userTemplates && userTemplates.length > 0 && (
                                                            <optgroup label="MA BIBLIOTHÈQUE">
                                                                {userTemplates.map(t => (
                                                                    <option key={t.id} value={t.id}>{t.nom}</option>
                                                                ))}
                                                            </optgroup>
                                                        )}
                                                        <optgroup label="MODÈLES STANDARDS">
                                                            {CHRONOGRAM_TEMPLATES.map(t => (
                                                                <option key={t.id} value={t.id}>{t.title}</option>
                                                            ))}
                                                        </optgroup>
                                                    </select>
                                                    <button 
                                                        type="button"
                                                        onClick={addChronogramRow}
                                                        className="text-[10px] font-black uppercase text-slate-400 hover:text-primary flex items-center gap-1 transition-colors ml-2"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">add</span>
                                                        Ligne
                                                    </button>
                                                </div>
                                            </div>


                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800 max-h-[280px] overflow-y-auto custom-scrollbar">
                                                {formData.chronogramme.length === 0 && (
                                                    <p className="text-[10px] text-slate-400 italic text-center py-2 uppercase font-bold tracking-tight">Aucun élément dans le programme</p>
                                                )}
                                                {formData.chronogramme.map((item, idx) => (
                                                    <div key={idx} className="grid grid-cols-12 gap-2 pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                                                        <input 
                                                            className="col-span-3 bg-transparent border-0 focus:ring-0 text-xs font-bold text-slate-900 dark:text-white p-0"
                                                            type="text" 
                                                            placeholder="00:00"
                                                            value={item.heure}
                                                            onChange={(e) => updateChronogramRow(idx, 'heure', e.target.value)}
                                                        />
                                                        <input 
                                                            className="col-span-6 bg-transparent border-0 focus:ring-0 text-xs text-slate-600 dark:text-slate-400 p-0"
                                                            type="text" 
                                                            placeholder="Activité..."
                                                            value={item.activite}
                                                            onChange={(e) => updateChronogramRow(idx, 'activite', e.target.value)}
                                                        />
                                                        <div className="col-span-3 flex items-center gap-1">
                                                            <input 
                                                                className="flex-1 bg-transparent border-0 focus:ring-0 text-[10px] text-slate-400 p-0 truncate"
                                                                type="text" 
                                                                placeholder="Resp."
                                                                value={item.responsable}
                                                                onChange={(e) => updateChronogramRow(idx, 'responsable', e.target.value)}
                                                            />
                                                            <button 
                                                                type="button"
                                                                onClick={() => removeChronogramRow(idx)}
                                                                className="text-red-400 hover:text-red-600 p-1"
                                                            >
                                                                <span className="material-symbols-outlined text-xs">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* SECTION IMAGES */}
                                    {formData.besoin_images && (
                                        <div className="space-y-4 pt-6 animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Illustrations (Photos)</label>
                                            <div 
                                                className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-sm p-4 text-center hover:border-primary transition-colors cursor-pointer group bg-slate-50/50 dark:bg-slate-800/20"
                                                onClick={() => document.getElementById('imageInput').click()}
                                                onDragOver={handleDragOver}
                                                onDrop={handleDrop}
                                            >
                                                <input 
                                                    id="imageInput"
                                                    type="file" 
                                                    multiple 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                />
                                                <span className="material-symbols-outlined text-3xl text-slate-300 group-hover:text-primary transition-colors">upload_file</span>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Cliquez ou glissez vos photos ici</p>
                                            </div>
                                            {selectedImages.length > 0 && (
                                                <div className="grid grid-cols-4 gap-2">
                                                    {selectedImages.map((file, idx) => (
                                                        <div key={idx} className="relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden group">
                                                            <img 
                                                                src={URL.createObjectURL(file)} 
                                                                alt="preview" 
                                                                className="w-full h-full object-cover"
                                                                onClick={() => handleScanPoster(file)}
                                                            />
                                                            {isScanning && (
                                                                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                                                                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                                </div>
                                                            )}
                                                            <div className={`absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center gap-2 ${isScanning ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleScanPoster(file)}
                                                                    className="bg-white text-primary p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                                                                    title="Scanner l'affiche"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">magic_button</span>
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                                                    className="bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:scale-110 transition-transform"
                                                                    title="Supprimer"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm text-[10px]">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-4 pt-4">
                                        <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500 block">Description (Optionnelle)</label>
                                        <textarea 
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm focus:ring-1 focus:ring-primary outline-none transition-all text-sm h-24"
                                            placeholder="Détails de l'événement..."
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>

                                    <div className="pt-6 flex gap-4">
                                        <button 
                                            className="flex-1 py-3 border border-primary text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary/5 transition-colors rounded-sm" 
                                            type="button"
                                            onClick={resetForm}
                                        >
                                            Réinitialiser
                                        </button>
                                        <button 
                                            className="flex-1 py-3 bg-primary text-white font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-opacity rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20" 
                                            type="submit"
                                            disabled={saveMutation.isPending}
                                        >
                                            {saveMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                                        </button>
                                    </div>
                                </form>
                            </section>
                        </div>
                    )}

                    {/* DROITE : Liste & Stats (7/12 ou 12/12) */}
                        <div className={`${isFormOpen ? 'col-span-12 lg:col-span-7' : 'col-span-12'} space-y-8`}>
                            
                            {/* SECTION REGISTRE */}
                            <section className="bg-white dark:bg-slate-900 shadow-sm overflow-hidden rounded-sm border border-slate-200 dark:border-slate-800">
                                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs uppercase tracking-[0.2em] font-black text-slate-400">Registre des Événements</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                                {activeEventsCount} Événements Actifs
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                                            <input 
                                                type="text"
                                                placeholder="Rechercher un événement..."
                                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm text-xs focus:ring-1 focus:ring-primary outline-none"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <select 
                                            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm text-xs focus:ring-1 focus:ring-primary outline-none min-w-[120px]"
                                            value={selectedType}
                                            onChange={(e) => setSelectedType(e.target.value)}
                                        >
                                            <option value="">Tous les types</option>
                                            {eventTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <select 
                                            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm text-xs focus:ring-1 focus:ring-primary outline-none min-w-[120px]"
                                            value={selectedStatus}
                                            onChange={(e) => setSelectedStatus(e.target.value)}
                                        >
                                            <option value="">Tous les statuts</option>
                                            <option value="en_attente">En attente</option>
                                            <option value="valide">Validé</option>
                                            <option value="termine">Terminé</option>
                                            <option value="annule">Annulé</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 h-[600px] overflow-y-auto">
                                    {eventsLoading ? (
                                        <div className="p-20 text-center text-slate-400">Chargement des événements...</div>
                                    ) : events.length === 0 ? (
                                        <div className="p-20 text-center text-slate-400">Aucun événement trouvé.</div>
                                    ) : (
                                        events.map(event => (
                                            <div key={event.id} className={`p-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${editingId === event.id ? 'bg-primary/5 border-l-4 border-primary' : ''}`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex gap-4">
                                                        <div className={`w-12 h-12 flex flex-col items-center justify-center rounded-sm font-bold ${editingId === event.id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                                            <span className="text-[10px] uppercase leading-none">
                                                                {new Date(event.date_debut).toLocaleString('fr-FR', { month: 'short' })}
                                                            </span>
                                                            <span className="text-lg leading-tight">
                                                                {new Date(event.date_debut).getDate()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleEdit(event)}>
                                                                {event.titre}
                                                            </h4>
                                                            <div className="flex items-center gap-4 mt-1">
                                                                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                                                    {event.lieu || 'Site non spécifié'}
                                                                </span>
                                                                <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                                                                    <span className="material-symbols-outlined text-[14px]">category</span>
                                                                    {eventTypes.find(t => t.id === event.type_evenement)?.label || event.type_evenement}
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 flex gap-2">
                                                                <StatusBadge status={event.statut} />
                                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[9px] font-bold uppercase tracking-wider rounded-sm">
                                                                    {event.type_programme === 'national' ? 'National' : 'Local'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link to={`/events/${event.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-sm transition-all" title="Voir les Détails">
                                                            <span className="material-symbols-outlined text-lg">visibility</span>
                                                        </Link>
                                                        <Link to={`/events/${event.id}/master`} className="p-2 text-primary hover:bg-primary/10 rounded-sm transition-all animate-pulse" title="Chronogramme IA Master">
                                                            <span className="material-symbols-outlined text-lg">magic_button</span>
                                                        </Link>
                                                        <button onClick={() => handleEdit(event)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-sm transition-all" title="Modifier">
                                                            <span className="material-symbols-outlined text-lg">edit</span>
                                                        </button>
                                                        <button onClick={() => handleDelete(event.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-800 rounded-sm transition-all" title="Supprimer">
                                                            <span className="material-symbols-outlined text-lg">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-8">
                                    <p className="text-[11px] text-slate-500 font-medium">Page {page} sur {totalPages}</p>
                                    <div className="flex gap-4">
                                        <button 
                                            disabled={page === 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 hover:text-blue-800 py-2 disabled:opacity-30 flex items-center gap-1 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                                            Précédent
                                        </button>
                                        <button 
                                            disabled={page === totalPages}
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700 hover:text-blue-800 py-2 disabled:opacity-30 flex items-center gap-1 transition-all"
                                        >
                                            Suivant
                                            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* CARTES DE RÉSUMÉ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white dark:bg-slate-900 p-6 shadow-sm border-l-4 border-blue-600 rounded-sm transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Événements Planifiés</span>
                                        <span className="material-symbols-outlined text-blue-600 text-lg">event_note</span>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
                                    <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-blue-600 h-full w-[65%]"></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-6 shadow-sm border-l-4 border-emerald-600 rounded-sm transition-all hover:shadow-md">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Événements Validés</span>
                                        <span className="material-symbols-outlined text-emerald-600 text-lg">task_alt</span>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeEventsCount}</p>
                                    <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-600 h-full" style={{ width: `${(activeEventsCount/totalCount)*100 || 0}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default EventsList;
