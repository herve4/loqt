import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import { CHRONOGRAM_TEMPLATES } from '../constants/eventTemplates';
import { toast } from 'react-hot-toast';
import DatePicker, { registerLocale } from "react-datepicker";
import { fr } from 'date-fns/locale/fr';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  isToday,
  parseISO
} from 'date-fns';

registerLocale('fr', fr);

const EventCalendar = () => {
    const queryClient = useQueryClient();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        titre: '',
        type_evenement: 'seminaire',
        lieu: '',
        eglise: '',
        date_debut: new Date(),
        date_fin: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
        besoin_chronogramme: false,
        besoin_images: false,
        chronogramme: [],
        type_programme: 'local'
    });

    const [selectedImages, setSelectedImages] = useState([]);
    const [showTemplates, setShowTemplates] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);
    const [isScanning, setIsScanning] = useState(false);

    const eventTypes = [
        { id: 'seminaire', label: 'Séminaire' },
        { id: 'camp', label: 'Camp' },
        { id: 'reunion', label: 'Réunion' },
        { id: 'autre', label: 'Autre' }
    ];

    // Récupération des églises pour le dropdown
    const { data: churchesData } = useQuery({
        queryKey: ['churches-all'],
        queryFn: () => logisticsService.getEglises({ page_size: 100 }).then(res => res.data),
    });
    const churches = churchesData?.results || (Array.isArray(churchesData) ? churchesData : []);

    // Récupération des événements
    const { data: eventsData, isLoading } = useQuery({
        queryKey: ['events-calendar', format(currentDate, 'yyyy-MM')],
        queryFn: () => logisticsService.getEvenements({ limit: 100 }).then(res => res.data),
    });

    const events = eventsData?.results || [];

    // Mutation pour sauvegarder
    const saveMutation = useMutation({
        mutationFn: async (data) => {
            const payload = {
                ...data,
                date_debut: data.date_debut instanceof Date ? data.date_debut.toISOString() : data.date_debut,
                date_fin: data.date_fin instanceof Date ? data.date_fin.toISOString() : data.date_fin
            };

            const res = await logisticsService.postEvenement(payload);
            const eventId = res.data.id;

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
            queryClient.invalidateQueries(['events-calendar']);
            toast.success('Événement ajouté avec succès !');
            setShowModal(false);
            resetForm();
        },
        onError: () => {
            toast.error("Erreur lors de l'ajout de l'événement.");
        }
    });

    const resetForm = () => {
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

    const applyTemplate = (template) => {
        if (window.confirm("Cela remplacera votre chronogramme actuel par le modèle \"" + template.title + "\". Continuer ?")) {
            setFormData({ ...formData, chronogramme: template.items });
            setShowTemplates(false);
            setPreviewTemplate(null);
            toast.success('Modèle appliqué');
        }
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
            toast.error("Erreur lors de l'analyse.", { id: loadingToast });
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
    
    // Génération des jours du calendrier
    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    // Groupement des événements par jour
    const eventsByDay = useMemo(() => {
        const groups = {};
        events.forEach(event => {
            if (!event.date_debut) return;
            const dateStr = format(parseISO(event.date_debut), 'yyyy-MM-dd');
            if (!groups[dateStr]) groups[dateStr] = [];
            groups[dateStr].push(event);
        });
        return groups;
    }, [events]);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const upcomingEvents = useMemo(() => {
        return events
            .filter(e => e.date_debut && parseISO(e.date_debut) >= new Date())
            .sort((a, b) => parseISO(a.date_debut) - parseISO(b.date_debut))
            .slice(0, 3);
    }, [events]);

    const getEventColor = (type) => {
        switch(type) {
            case 'seminaire': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
            case 'camp': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
            case 'reunion': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
            default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-400';
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Calendrier Logistique" />
                
                <main className="flex-1 flex overflow-hidden p-8 gap-8">
                    {/* Section Calendrier */}
                    <section className="flex-1 flex flex-col min-w-0">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight capitalize">
                                    {format(currentDate, 'MMMM yyyy', { locale: fr })}
                                </h1>
                                <p className="text-sm text-slate-500 font-medium">Calendrier Opérationnel SGL-CI</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-sm shadow-sm border border-slate-200 dark:border-slate-800">
                                <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                                </button>
                                <button onClick={goToToday} className="px-4 py-1 text-xs font-bold uppercase tracking-tight text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-sm transition-colors">
                                    Aujourd'hui
                                </button>
                                <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                                </button>
                            </div>
                        </div>

                        {/* Grille du Calendrier */}
                        <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm flex flex-col overflow-hidden">
                            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                                    <div key={day} className={`py-3 text-center text-[10px] font-black uppercase tracking-widest ${day === 'Dim' ? 'text-red-500' : 'text-slate-400'}`}>
                                        {day}
                                    </div>
                                ))}
                            </div>

                            <div className="flex-1 grid grid-cols-7 auto-rows-fr overflow-y-auto">
                                {days.map((day, idx) => {
                                    const dateKey = format(day, 'yyyy-MM-dd');
                                    const dayEvents = eventsByDay[dateKey] || [];
                                    const isCurrentMonth = isSameMonth(day, currentDate);
                                    
                                    return (
                                        <div 
                                            key={day.toString()} 
                                            onClick={() => {
                                                setFormData({...formData, date_debut: day, date_fin: new Date(day.getTime() + 2 * 60 * 60 * 1000)});
                                                setShowModal(true);
                                            }}
                                            className={`border-r border-b border-slate-100 dark:border-slate-800 p-2 min-h-[100px] flex flex-col gap-1 transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02] cursor-pointer ${!isCurrentMonth ? 'bg-slate-50/30 dark:bg-slate-900/50 text-slate-300 dark:text-slate-600' : ''}`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className={`text-sm font-bold ${isToday(day) ? 'bg-primary text-white size-6 rounded-full flex items-center justify-center -m-1' : ''}`}>
                                                    {format(day, 'd')}
                                                </span>
                                            </div>
                                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                                                {dayEvents.map(event => (
                                                    <div 
                                                        key={event.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFormData({
                                                                ...event,
                                                                date_debut: parseISO(event.date_debut),
                                                                date_fin: parseISO(event.date_fin),
                                                                chronogramme: Array.isArray(event.chronogramme) ? event.chronogramme : []
                                                            });
                                                            setShowModal(true);
                                                        }}
                                                        className={`block px-2 py-1 ${getEventColor(event.type_evenement)} text-[9px] font-black uppercase tracking-tight rounded-sm truncate transition-transform hover:scale-105 active:scale-95 cursor-pointer`}
                                                        title={`${event.titre} (Cliquer pour modifier)`}
                                                    >
                                                        {event.titre}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    {/* Sidebar */}
                    <aside className="w-96 flex flex-col gap-6 h-full overflow-y-auto pr-2 hidden xl:flex">
                        <div className="mb-4">
                            <button 
                                onClick={() => setShowModal(true)}
                                className="w-full bg-primary text-white py-4 px-6 rounded-sm font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-3"
                            >
                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                Nouvel Événement
                            </button>
                        </div>
                        
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-6 uppercase">À Venir</h2>
                            <div className="space-y-6">
                                {upcomingEvents.length === 0 ? (
                                    <p className="text-sm text-slate-500">Aucun événement prévu.</p>
                                ) : (
                                    upcomingEvents.map(event => (
                                        <div key={event.id} className="bg-white dark:bg-slate-900 rounded-sm shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden group transition-all hover:shadow-md">
                                            <div className="h-32 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                                                <img 
                                                    alt={event.titre} 
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                                    src={event.type_evenement === 'seminaire' 
                                                        ? "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=800" 
                                                        : "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800"}
                                                />
                                                <div className="absolute top-3 left-3 px-2 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-sm">
                                                    {event.date_debut ? format(parseISO(event.date_debut), 'd MMM', { locale: fr }) : 'N/A'}
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight group-hover:text-primary transition-colors">
                                                    {event.titre}
                                                </h3>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-4 font-bold">
                                                    <span className="material-symbols-outlined text-xs">location_on</span>
                                                    <span className="truncate">{event.lieu || 'Site non spécifié'}</span>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                                                    <span className={`px-2 py-1 rounded-sm text-[8px] font-black uppercase tracking-widest ${getEventColor(event.type_evenement)}`}>
                                                        {event.type_evenement}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Link to={`/events/${event.id}/master`} className="text-primary hover:bg-primary/10 p-1 rounded transition-colors" title="Chronogramme IA Master">
                                                            <span className="material-symbols-outlined text-sm">magic_button</span>
                                                        </Link>
                                                        <Link to={`/events/${event.id}`} className="text-primary text-[10px] font-bold uppercase tracking-widest hover:underline">
                                                            Détails
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {/* Statistiques Inset */}
                            <div className="mt-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-sm">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Aperçu Mensuel</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-3xl font-black text-primary tracking-tighter">{events.length}</p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Total Événements</p>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-emerald-500 tracking-tighter">
                                            {events.filter(e => e.statut === 'valide').length}
                                        </p>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Confirmés</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>

            {/* Modal de Création */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-sm shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Nouvel Événement</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Titre de l'Événement</label>
                                <input 
                                    className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-300 bg-transparent"
                                    type="text" 
                                    placeholder="Ex: Conférence Régionale"
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-3 rounded border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="rounded text-primary focus:ring-primary size-4"
                                            checked={formData.besoin_chronogramme}
                                            onChange={(e) => setFormData({...formData, besoin_chronogramme: e.target.checked})}
                                        />
                                        <span className="text-[10px] uppercase font-black text-slate-500">Besoin de chronogramme ?</span>
                                    </label>
                                    <div className="flex gap-2">
                                        {formData.id ? (
                                            <Link 
                                                to={`/events/${formData.id}/master`}
                                                className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold hover:bg-primary/20 transition-all animate-pulse"
                                                title="Ouvrir le Configurateur IA"
                                            >
                                                <span className="material-symbols-outlined text-xs">magic_button</span>
                                                IA MASTER
                                            </Link>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={() => document.getElementById('chronogramFileCal').click()}
                                                className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[9px] font-bold hover:bg-amber-500/20 transition-all"
                                                title="Extraire depuis un document"
                                            >
                                                <span className="material-symbols-outlined text-xs">shutter_speed</span>
                                                SCAN IA
                                                <input 
                                                    id="chronogramFileCal" 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={(e) => handleExtractChronogram(e.target.files[0])}
                                                    accept=".pdf,.docx,.xlsx,.xls,image/*"
                                                />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <label className="flex items-center gap-3 p-3 rounded border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-primary focus:ring-primary size-4"
                                        checked={formData.besoin_images}
                                        onChange={(e) => setFormData({...formData, besoin_images: e.target.checked})}
                                    />
                                    <span className="text-[10px] uppercase font-black text-slate-500">Besoin Images</span>
                                </label>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Lieu Précis</label>
                                <input 
                                    className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 bg-transparent"
                                    type="text" 
                                    placeholder="Ex: Salle B, 2ème étage"
                                    value={formData.lieu}
                                    onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                                />
                            </div>

                            {/* SECTION CHRONOGRAMME */}
                            {formData.besoin_chronogramme && (
                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Chronogramme</label>
                                            <button 
                                                type="button" 
                                                onClick={() => setShowTemplates(true)}
                                                className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold hover:bg-primary/20"
                                            >
                                                Modèles
                                            </button>
                                        </div>
                                        <button type="button" onClick={addChronogramRow} className="text-[10px] font-black uppercase text-primary hover:underline">+ Ajouter</button>
                                    </div>

                                    {/* Modale des modèles (Inline pour le calendrier) */}
                                    {showTemplates && (
                                        <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded p-3 mb-2 animate-in zoom-in-95 duration-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-[9px] font-black uppercase tracking-widest">Choisir un modèle</span>
                                                <button type="button" onClick={() => setShowTemplates(false)} className="text-slate-400"><span className="material-symbols-outlined text-xs">close</span></button>
                                            </div>
                                            <div className="space-y-2">
                                                {CHRONOGRAM_TEMPLATES.map(t => (
                                                    <button 
                                                        key={t.id}
                                                        type="button"
                                                        onMouseEnter={() => setPreviewTemplate(t)}
                                                        onClick={() => applyTemplate(t)}
                                                        className="w-full text-left p-2 rounded border border-transparent hover:border-primary/30 hover:bg-white dark:hover:bg-slate-900 transition-all group"
                                                    >
                                                        <div className="text-[9px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary">{t.title}</div>
                                                        <div className="text-[8px] text-slate-400 line-clamp-1">{t.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                            {previewTemplate && (
                                                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 animate-in fade-in duration-300">
                                                    <div className="max-h-[80px] overflow-y-auto pr-1 text-[8px] text-slate-500 italic">
                                                        Aperçu : {previewTemplate.items.map(i => i.heure + ' ' + i.activite).join(', ')}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                        {formData.chronogramme.map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-sm relative group">
                                                <input 
                                                    className="w-16 bg-transparent border-0 focus:ring-0 text-[10px] font-bold p-0"
                                                    type="text" placeholder="Heure" value={item.heure}
                                                    onChange={(e) => updateChronogramRow(idx, 'heure', e.target.value)}
                                                />
                                                <input 
                                                    className="flex-1 bg-transparent border-0 focus:ring-0 text-[10px] p-0"
                                                    type="text" placeholder="Activité" value={item.activite}
                                                    onChange={(e) => updateChronogramRow(idx, 'activite', e.target.value)}
                                                />
                                                <button type="button" onClick={() => removeChronogramRow(idx)} className="text-red-400 opacity-50 hover:opacity-100"><span className="material-symbols-outlined text-xs">close</span></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION IMAGES */}
                            {formData.besoin_images && (
                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-primary">Photos d'illustration</label>
                                    <div 
                                        className="border border-dashed border-slate-200 dark:border-slate-800 p-4 rounded-sm text-center cursor-pointer hover:border-primary transition-colors bg-slate-50/50 dark:bg-slate-800/20"
                                        onClick={() => document.getElementById('modalImageInput').click()}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                    >
                                        <input id="modalImageInput" type="file" multiple className="hidden" onChange={handleImageChange} accept="image/*" />
                                        <span className="material-symbols-outlined text-xl text-slate-300">add_a_photo</span>
                                        <p className="text-[9px] font-bold uppercase text-slate-400 mt-1">Glisser ou cliquer</p>
                                    </div>
                                    {selectedImages.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                            {selectedImages.map((file, idx) => (
                                                <div key={idx} className="relative size-16 shrink-0 rounded-sm overflow-hidden border border-slate-200 group">
                                                    <img src={URL.createObjectURL(file)} className="size-full object-cover" />
                                                    {isScanning && (
                                                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                    )}
                                                    <div className={`absolute inset-0 bg-black/40 transition-opacity flex flex-col items-center justify-center gap-1 ${isScanning ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => handleScanPoster(file)}
                                                            className="bg-white text-primary p-1 rounded-full shadow-lg"
                                                            title="Scanner"
                                                        >
                                                            <span className="material-symbols-outlined text-[10px]">magic_button</span>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }} 
                                                            className="bg-red-500 text-white p-1 rounded-full shadow-lg"
                                                        >
                                                            <span className="material-symbols-outlined text-[10px]">close</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Début</label>
                                    <DatePicker
                                        selected={formData.date_debut}
                                        onChange={(date) => setFormData({...formData, date_debut: date})}
                                        showTimeSelect
                                        dateFormat="Pp"
                                        locale="fr"
                                        className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-sm bg-transparent dark:text-white"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Fin</label>
                                    <DatePicker
                                        selected={formData.date_fin}
                                        onChange={(date) => setFormData({...formData, date_fin: date})}
                                        showTimeSelect
                                        dateFormat="Pp"
                                        locale="fr"
                                        className="w-full border-b border-slate-200 dark:border-slate-800 border-x-0 border-t-0 focus:ring-0 focus:border-primary px-0 py-2 text-sm bg-transparent dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="submit"
                                    disabled={saveMutation.isLoading}
                                    className="flex-1 bg-primary text-white py-3 rounded-sm font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {saveMutation.isLoading ? 'Enregistrement...' : 'Créer l\'Événement'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-3 border border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[10px] uppercase tracking-widest rounded-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Annuler
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventCalendar;
