import React, { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, FileText, FileSpreadsheet, Image as ImageIcon, 
  Trash2, Plus, Save, ArrowLeft, Loader2, CheckCircle2,
  Calendar, Clock, Layout, Sparkles, Wand2, FileSearch
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { logisticsService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const ChronogramMaster = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [method, setMethod] = useState(null);

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => logisticsService.getEvenementById(id).then(res => res.data),
  });

  // Mutation for extraction
  const extractionMutation = useMutation({
    mutationFn: (formData) => logisticsService.extractChronogram(formData).then(res => res.data),
    onSuccess: (data) => {
      setItems(data.items || []);
      setMethod(data.method);
      setIsAnalyzing(false);
      toast.success('Analyse terminée avec succès !');
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error("Erreur lors de l'analyse : " + (error.response?.data?.error || error.message));
    }
  });

  const onDrop = useCallback(acceptedFiles => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);
    extractionMutation.mutate(formData);
  }, [extractionMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  const handleAddItem = (day = 'Jour 1') => {
    setItems([...items, { heure_debut: '08:00', titre: 'Nouvelle activité', description: '', pole: null, jour: day }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    try {
      await logisticsService.patchEvenement(id, { chronogramme: items });
      toast.success('Chronogramme enregistré !');
      queryClient.invalidateQueries(['event', id]);
      navigate(`/events/${id}`);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  // Group items by day for display
  const groupedItems = items.reduce((acc, item) => {
    const day = item.jour || 'Jour 1';
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  const days = Object.keys(groupedItems).sort();

  if (eventLoading) return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-primary" /></div>;


  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header title="Chronogramme IA Master" />
        
        <div className="p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto w-full pb-24">
          
          {/* Header Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <Link to={`/events/${id}`} className="flex items-center gap-2 text-primary hover:gap-3 transition-all text-sm font-bold mb-2">
                <ArrowLeft size={16} /> Retour à l'événement
              </Link>
              <h1 className="text-3xl font-black tracking-tighter">CONFIGURATEUR IA <span className="text-primary italic">MASTER</span></h1>
              <p className="text-slate-500 dark:text-slate-400">Générez un programme professionnel en secondes à partir de vos documents.</p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleSave}
                disabled={items.length === 0}
                className="px-6 py-2.5 rounded-full bg-primary text-white font-black text-sm shadow-lg shadow-primary/30 flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                <Save size={18} /> ENREGISTRER LE PROGRAMME
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Left Column: Import Zone */}
            <div className="xl:col-span-4 space-y-6">
              
              {/* Dropzone Premium */}
              <div 
                {...getRootProps()} 
                className={`relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-500 p-8 flex flex-col items-center justify-center text-center h-[320px] shadow-2xl ${
                  isDragActive 
                    ? 'border-primary bg-primary/5 scale-[1.02]' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:bg-white dark:hover:bg-slate-900'
                }`}
              >
                <input {...getInputProps()} />
                
                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div 
                      key="analyzing"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="relative">
                        <Loader2 className="size-16 text-primary animate-spin" />
                        <Sparkles className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="font-black text-xl animate-pulse">ANALYSE EN COURS...</p>
                        <p className="text-sm text-slate-500 italic">Extraction des structures et horaires par l'IA</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-6"
                    >
                      <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-primary/20 group-hover:text-primary transition-colors duration-500">
                        <Wand2 size={48} className="rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xl font-bold">Glissez votre document ici</p>
                        <p className="text-sm text-slate-500">PDF, Word, Excel ou Image d'affiche</p>
                      </div>
                      <button className="px-5 py-2 rounded-lg bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-xs font-bold uppercase tracking-widest">
                        Parcourir les fichiers
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-[80px] rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
              </div>

              {/* Suggestions Panel */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative group">
                <div className="flex items-center gap-2 mb-6">
                  <div className="size-8 rounded-lg bg-yellow-400/10 text-yellow-500 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="font-bold text-lg">IA Suggestions</h3>
                </div>
                
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Importez un fichier pour voir les suggestions d'optimisation.</p>
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-orange-400/5 border border-orange-400/10 flex gap-3 items-start">
                        <div className="mt-1 text-orange-400"><Clock size={16} /></div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          <span className="font-bold text-orange-500">Optimisation :</span> Votre programme commence tôt. Prévoyez une pause de 15min après la 3ème activité.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 flex gap-3 items-start">
                        <div className="mt-1 text-primary"><CheckCircle2 size={16} /></div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Structure de type <span className="font-bold">{method?.toUpperCase() || 'DOCUMENT'}</span> détectée et respectée.
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                  <Layout size={120} />
                </div>
              </div>
            </div>

            {/* Right Column: Editor & Preview */}
            <div className="xl:col-span-8 space-y-6">
              
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[500px]">
                {/* Editor Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                      <Layout size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">Items du Chronogramme</h3>
                      <p className="text-xs text-slate-500">{items.length} activités détectées</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleAddItem}
                    className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                {/* Editor Body */}
                <div className="flex-1 p-6 space-y-8 overflow-y-auto max-h-[600px]">
                  <AnimatePresence initial={false}>
                    {days.length > 0 ? (
                      days.map((day) => (
                        <div key={day} className="space-y-4">
                          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                             <Calendar className="text-primary" size={16} />
                             <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">{day}</h4>
                             <button 
                               onClick={() => handleAddItem(day)}
                               className="ml-auto text-primary hover:text-primary-focus p-1"
                             >
                               <Plus size={16} />
                             </button>
                          </div>
                          <div className="space-y-3">
                            {items.map((item, idx) => (
                              (item.jour || 'Jour 1') === day && (
                                <motion.div 
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  className="flex flex-wrap md:flex-nowrap gap-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 items-center group"
                                >
                                  <div className="w-24 shrink-0">
                                    <div className="relative">
                                      <input 
                                        type="text"
                                        value={item.heure_debut}
                                        onChange={(e) => handleUpdateItem(idx, 'heure_debut', e.target.value)}
                                        className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 text-sm font-black text-center focus:ring-2 ring-primary border-transparent outline-none"
                                      />
                                      <Clock size={12} className="absolute -top-1.5 -right-1.5 text-slate-400" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-[200px]">
                                    <input 
                                      type="text"
                                      value={item.titre}
                                      onChange={(e) => handleUpdateItem(idx, 'titre', e.target.value)}
                                      placeholder="Titre de l'activité..."
                                      className="w-full h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 text-sm font-bold focus:ring-2 ring-primary border-transparent outline-none"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 pr-2">
                                     <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                                       <Sparkles size={18} />
                                     </button>
                                     <button 
                                       onClick={() => handleRemoveItem(idx)}
                                       className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                     >
                                       <Trash2 size={18} />
                                     </button>
                                  </div>
                                </motion.div>
                              )
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4 opacity-50">
                           <div className="p-6 rounded-3xl bg-slate-100 dark:bg-slate-800">
                              <FileSearch size={48} className="text-slate-400" />
                           </div>
                           <p className="text-sm font-medium">Aucune donnée à afficher.<br/>Veuillez importer un document ou ajouter un item.</p>
                        </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Preview Premium Section */}
              <div className="bg-slate-900 dark:bg-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-8">
                       <Layout className="text-primary" />
                       <h3 className="font-bold tracking-widest uppercase text-sm">Aperçu Timeline Live</h3>
                    </div>
                    
                    <div className="relative border-l-2 border-primary/30 pl-8 ml-4 space-y-12">
                       {items.slice(0, 4).map((item, i) => (
                         <div key={i} className="relative">
                            <div className="absolute -left-[41px] top-1 size-4 bg-primary rounded-full ring-4 ring-primary/20"></div>
                            <div className="space-y-1">
                               <span className="text-primary font-black text-xs uppercase tracking-tighter">{item.heure_debut}</span>
                               <h4 className="font-bold text-xl">{item.titre}</h4>
                               {i === 0 && <p className="text-sm text-slate-400 leading-relaxed max-w-md">L'IA prépare automatiquement le début de votre événement en fonction des données extraites.</p>}
                            </div>
                         </div>
                       ))}
                       {items.length > 4 && <p className="text-xs text-slate-500 pl-2">+++ {items.length - 4} autres activités</p>}
                    </div>
                 </div>
                 
                 <div className="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
                 <div className="absolute -bottom-10 -right-10 opacity-10 blur-3xl w-64 h-64 bg-primary rounded-full"></div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChronogramMaster;
