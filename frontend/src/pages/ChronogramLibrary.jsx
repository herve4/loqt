import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Save, ArrowLeft, Loader2, 
  Search, Calendar, Clock, Layout, Sparkles, BookOpen,
  Copy, Check, FileSearch, Upload, Printer, Monitor,
  FileText, FileSpreadsheet, Image as ImageIcon
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { logisticsService } from '../services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

const ChronogramLibrary = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [items, setItems] = useState([]);
  const [headers, setHeaders] = useState(['Heure Début', 'Heure Fin', 'Activité', 'Détails']);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewSize, setPreviewSize] = useState('a4-portrait'); // a4-portrait, a4-landscape

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ['chronogram-templates'],
    queryFn: () => logisticsService.getChronogramTemplates().then(res => res.data.results || res.data),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => logisticsService.createChronogramTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chronogram-templates']);
      setIsEditing(false);
      toast.success('Modèle créé !');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => logisticsService.updateChronogramTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chronogram-templates']);
      setIsEditing(false);
      toast.success('Modèle mis à jour !');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => logisticsService.deleteChronogramTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['chronogram-templates']);
      toast.success('Modèle supprimé');
    }
  });

  const extractionMutation = useMutation({
    mutationFn: (formData) => logisticsService.extractChronogram(formData),
    onSuccess: (res) => {
      const data = res.data;
      setIsAnalyzing(false);
      if (data.items && data.items.length > 0) {
        setItems(data.items);
        if (data.headers && data.headers.length > 0) {
          setHeaders(data.headers);
        }
        toast.success(`${data.items.length} activités extraites avec succès !`);
      }
    },
    onError: () => {
      setIsAnalyzing(false);
      toast.error("Erreur lors de l'extraction IA");
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
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  });

  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setItems(template.items || []);
    setHeaders(template.headers || ['Heure Début', 'Heure Fin', 'Activité', 'Détails']);
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setCurrentTemplate({ nom: '', description: '' });
    setItems([{ heure_debut: '08:00', heure_fin: '09:00', titre: 'Accueil', description: '', jour: 'Jour 1' }]);
    setHeaders(['Heure Début', 'Heure Fin', 'Activité', 'Détails']);
    setIsEditing(true);
  };

  const handleAddItem = () => {
    setItems([...items, { heure_debut: '09:00', titre: 'Nouvelle activité', description: '', jour: items[items.length-1]?.jour || 'Jour 1' }]);
  };

  const getValue = (item, header) => {
    if (item[header] !== undefined) return item[header];
    // Recherche floue (ignore casse, espaces et underscores)
    const normalizedHeader = header.toLowerCase().replace(/[\s_]/g, '');
    const key = Object.keys(item).find(k => 
      k.toLowerCase().replace(/[\s_]/g, '') === normalizedHeader
    );
    return key ? item[key] : "";
  };

  const applyStructure = (template) => {
    if (!template.headers || template.headers.length === 0) {
      toast.error("Ce modèle n'a pas de structure définie.");
      return;
    }
    
    // On garde les items actuels mais on re-mappe leurs données vers les nouveaux headers
    const newItems = items.map(it => {
      const newItem = { jour: it.jour || 'Jour 1' };
      template.headers.forEach(h => {
        newItem[h] = getValue(it, h);
      });
      return newItem;
    });
    
    setHeaders(template.headers);
    setItems(newItems);
    toast.success(`Structure "${template.nom}" appliquée !`);
  };

  const handleRemoveItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleUpdateItem = (idx, field, val) => {
    const newItems = [...items];
    newItems[idx][field] = val;
    setItems(newItems);
  };

  const handleAddDay = () => {
    const existingDays = [...new Set(items.map(i => i.jour || 'Jour 1'))];
    const nextDayNum = existingDays.length + 1;
    const newDay = `Jour ${nextDayNum}`;
    setItems([...items, { heure_debut: '08:00', titre: 'Ouverture', description: '', jour: newDay }]);
  };

  // Group items by day for display
  const groupedItems = items.reduce((groups, item, idx) => {
    const day = item.jour || 'Jour 1';
    if (!groups[day]) groups[day] = [];
    groups[day].push({ ...item, originalIdx: idx });
    return groups;
  }, {});

  const handleSave = () => {
    if (!currentTemplate.nom) {
      toast.error('Le nom est requis');
      return;
    }

    const data = {
      ...currentTemplate,
      items: items
    };

    if (currentTemplate.id) {
      updateMutation.mutate({ id: currentTemplate.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredTemplates = templates?.filter(t => 
    t.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-y-auto">
        <Header title="Bibliothèque de Chronogrammes" />
        
        <div className="p-6 lg:p-10 space-y-8 max-w-[1400px] mx-auto w-full pb-24">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">
                Ma <span className="text-primary">Bibliothèque</span>
              </h1>
              <p className="text-slate-500 text-sm">Gérez vos modèles de programmes pour une réutilisation rapide.</p>
            </div>
            
            {!isEditing && (
              <button 
                onClick={handleCreateNew}
                className="px-6 py-2.5 rounded-full bg-primary text-white font-black text-sm shadow-lg shadow-primary/30 flex items-center gap-2 hover:scale-105 transition-all"
              >
                <Plus size={18} /> NOUVEAU MODÈLE
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Search Bar */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher un modèle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 ring-primary outline-none transition-all"
                  />
                </div>

                {isLoading ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary size-10" /></div>
                ) : filteredTemplates?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map(template => (
                      <div 
                        key={template.id}
                        className="group bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all relative overflow-hidden"
                      >
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                              <BookOpen size={20} />
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEdit(template)} className="p-2 hover:text-primary transition-colors"><Edit2 size={16} /></button>
                              <button onClick={() => deleteMutation.mutate(template.id)} className="p-2 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </div>
                          
                          <h3 className="font-black text-xl mb-2 group-hover:text-primary transition-colors">{template.nom}</h3>
                          <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">{template.description || 'Aucune description'}</p>
                          
                          <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                            <div className="flex items-center gap-1"><Layout size={14} /> {template.items?.length || 0} items</div>
                            <div className="flex items-center gap-1"><Calendar size={14} /> {new Date(template.created_at).toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        {/* Decoration */}
                        <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                          <Layout size={120} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="size-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300">
                      <BookOpen size={40} />
                    </div>
                    <p className="text-slate-500 font-medium">Aucun modèle trouvé.<br/>Commencez par en créer un !</p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="edit"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                {/* Editor Header */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsEditing(false)} className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-black italic">{currentTemplate.id ? 'Modifier le modèle' : 'Nouveau modèle'}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nom du modèle</label>
                      <input 
                        type="text" 
                        value={currentTemplate.nom} 
                        onChange={e => setCurrentTemplate({...currentTemplate, nom: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary outline-none font-bold"
                        placeholder="Ex: Séminaire Standard"
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase tracking-widest text-slate-400 block">Import IA (Scan Document)</label>
                      <div 
                        {...getRootProps()} 
                        className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                          isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-800 hover:border-primary/50'
                        }`}
                      >
                        <input {...getInputProps()} />
                        <div className="flex items-center justify-center gap-3">
                          {isAnalyzing ? (
                            <Loader2 className="animate-spin text-primary" size={20} />
                          ) : (
                            <FileSearch className="text-primary" size={20} />
                          )}
                          <span className="text-xs font-bold text-slate-500">
                             {isAnalyzing ? "Analyse en cours..." : "Glissez un PDF/Image ici pour scanner"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Description</label>
                    <input 
                      type="text" 
                      value={currentTemplate.description} 
                      onChange={e => setCurrentTemplate({...currentTemplate, description: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 ring-primary outline-none"
                      placeholder="Pour les événements de type..."
                    />
                  </div>
                </div>

                {/* Assistant de Structure */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6">
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <Sparkles size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Assistant de Structure</h3>
                      <p className="text-[10px] text-slate-500 font-bold italic">Normalisez vos données</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 flex-1">
                     {templates?.slice(0, 6).map(t => (
                       <button 
                         key={t.id}
                         onClick={() => applyStructure(t)}
                         className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary transition-all flex items-center gap-2 group"
                       >
                         <Layout size={14} className="group-hover:scale-110 transition-transform" />
                         {t.nom}
                       </button>
                     ))}
                  </div>
                </div>

                {/* Editor Items - Grouped by Day */}
                <div className="space-y-6">
                  {Object.entries(groupedItems).map(([dayName, dayItems], groupIdx) => (
                    <div key={dayName} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="flex items-center gap-4">
                          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs italic">
                            {groupIdx + 1}
                          </div>
                          <input 
                            type="text" 
                            value={dayName}
                            onChange={(e) => {
                              const newName = e.target.value;
                              const newItems = items.map(it => it.jour === dayName ? {...it, jour: newName} : it);
                              setItems(newItems);
                            }}
                            className="bg-transparent border-none font-black text-lg uppercase tracking-tight focus:ring-0 w-64"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                           {groupIdx === 0 && (
                            <button 
                              onClick={() => setShowPreview(true)}
                              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black hover:bg-slate-200 transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
                            >
                              <Monitor size={14} /> APERÇU A4
                            </button>
                           )}
                           <button 
                            onClick={() => {
                              setItems([...items, { heure_debut: '09:00', heure_fin: '', titre: 'Nouvel item', description: '', jour: dayName }]);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-primary text-white text-[10px] font-black hover:scale-105 transition-all flex items-center gap-1.5"
                           >
                            <Plus size={14} /> AJOUTER ITEM
                           </button>
                        </div>
                      </div>
                      
                      {/* Table Header - Dynamic */}
                      <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 text-[10px] font-black uppercase tracking-widest text-slate-400 flex gap-3 items-center">
                        {headers.map((h, i) => (
                          <div key={i} className={i === 0 || i === 1 ? "w-20" : "flex-1"}>
                            <input 
                              type="text" 
                              value={h}
                              onChange={(e) => {
                                const newHeaders = [...headers];
                                newHeaders[i] = e.target.value;
                                setHeaders(newHeaders);
                              }}
                              className="bg-transparent border-none p-0 w-full focus:ring-0 text-[10px] font-black"
                            />
                          </div>
                        ))}
                        <div className="w-24">Actions</div>
                      </div>

                      <div className="p-4 space-y-2">
                        {dayItems.map((item) => (
                          <div key={item.originalIdx} className="flex flex-wrap md:flex-nowrap gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 items-center group">
                             {headers.map((h, hIdx) => (
                              <div key={hIdx} className={hIdx === 0 || hIdx === 1 ? "w-20 shrink-0" : "flex-1 min-w-[120px]"}>
                                <input 
                                  type="text" 
                                  value={getValue(item, h)} 
                                  onChange={e => handleUpdateItem(item.originalIdx, h, e.target.value)}
                                  className={`w-full h-9 bg-white dark:bg-slate-900 border-none rounded-lg px-2 text-xs focus:ring-1 ring-primary ${hIdx === 0 ? 'font-black text-center' : 'text-slate-600'}`}
                                  placeholder="..."
                                />
                              </div>
                             ))}
                            
                             <div className="w-10 shrink-0 flex items-center justify-end">
                               <button 
                                 onClick={() => handleRemoveItem(item.originalIdx)}
                                 className="size-8 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-300 transition-colors flex items-center justify-center"
                                 title="Supprimer"
                               >
                                 <Trash2 size={16} />
                               </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={handleAddDay}
                    className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-black text-sm hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2"
                  >
                    <Plus size={32} />
                    AJOUTER UN NOUVEAU JOUR AU PROGRAMME
                  </button>
                </div>

                {/* Save Footer */}
                <div className="flex justify-end gap-4 pb-10">
                  <button onClick={() => setIsEditing(false)} className="px-10 py-3 rounded-full font-bold text-slate-500 transition-colors">ANNULER</button>
                  <button 
                    onClick={handleSave} 
                    className="px-12 py-3 rounded-full bg-primary text-white font-black shadow-xl shadow-primary/30 hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <Save size={20} /> ENREGISTRER LE MODÈLE
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modal Aperçu A4 */}
          <AnimatePresence>
            {showPreview && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="font-black text-xl italic uppercase">Aperçu <span className="text-primary">Impression</span></h3>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button 
                          onClick={() => setPreviewSize('a4-portrait')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${previewSize === 'a4-portrait' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}
                        >
                          PORTRAIT
                        </button>
                        <button 
                          onClick={() => setPreviewSize('a4-landscape')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${previewSize === 'a4-landscape' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-400'}`}
                        >
                          PAYSAGE
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => window.print()}
                        className="px-6 py-2 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black text-xs flex items-center gap-2"
                      >
                        <Printer size={16} /> IMPRIMER / PDF
                      </button>
                      <button 
                        onClick={() => setShowPreview(false)}
                        className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200"
                      >
                        <Plus className="rotate-45" size={20} />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 bg-slate-100 dark:bg-slate-800 flex justify-center preview-container">
                    <div 
                      className={`bg-white text-black shadow-2xl p-[20mm] transition-all duration-500 overflow-hidden ${
                        previewSize === 'a4-portrait' 
                        ? 'w-[210mm] min-h-[297mm]' 
                        : 'w-[297mm] min-h-[210mm]'
                      }`}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      {/* Header du document */}
                      <div className="border-b-4 border-black pb-8 mb-10 flex justify-between items-end">
                        <div>
                          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">{currentTemplate.nom || 'SANS TITRE'}</h1>
                          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{currentTemplate.description || 'Modèle de Chronogramme Officiel'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-400">Généré le</p>
                          <p className="text-xs font-bold">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                      </div>

                      {/* Corps du chronogramme - Groupé par Jour */}
                      <div className="space-y-8">
                        {Object.entries(groupedItems).map(([day, dayItems], idx) => {
                          const hasDoubleTime = headers[0]?.toLowerCase().includes('début') && headers[1]?.toLowerCase().includes('fin');
                          const displayHeaders = hasDoubleTime ? ['HORAIRES', ...headers.slice(2)] : headers;

                          return (
                            <div key={idx} className="space-y-4">
                              <h4 className="text-sm font-black italic bg-slate-900 text-white px-4 py-1.5 inline-block rounded-r-lg uppercase tracking-widest">
                                {day}
                              </h4>
                              
                              <table className="w-full border-collapse text-[10px]">
                                <thead>
                                  <tr className="bg-slate-50 border-y border-slate-900">
                                    {displayHeaders.map((h, i) => (
                                      <th key={i} className="py-3 px-4 text-left font-black uppercase tracking-widest">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {dayItems.map((item, i) => (
                                    <tr key={i} className="border-b border-slate-200">
                                      {hasDoubleTime ? (
                                        <>
                                          <td className="py-3 px-4 font-black text-sm whitespace-nowrap">
                                            {getValue(item, headers[0])} {getValue(item, headers[1]) ? `- ${getValue(item, headers[1])}` : ''}
                                          </td>
                                          {headers.slice(2).map((h, hIdx) => (
                                            <td key={hIdx} className="py-3 px-4 font-bold">
                                              {getValue(item, h)}
                                            </td>
                                          ))}
                                        </>
                                      ) : (
                                        headers.map((h, hIdx) => (
                                          <td key={hIdx} className={`py-3 px-4 ${hIdx === 0 ? 'font-black text-sm' : 'font-bold'}`}>
                                            {getValue(item, h)}
                                          </td>
                                        ))
                                      )}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer A4 */}
                      <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center opacity-30 italic text-[10px]">
                        <p>SGL-CI : Gestion Logistique Intégrée</p>
                        <p>Dernière mise à jour : {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <style>{`
            @media print {
              body * { visibility: hidden; }
              .preview-container, .preview-container * { visibility: visible; }
              .preview-container { 
                position: fixed; 
                left: 0; 
                top: 0; 
                width: 100vw; 
                height: 100vh; 
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                display: flex !important;
                justify-content: center !important;
              }
              .preview-container > div {
                box-shadow: none !important;
                border: none !important;
                width: ${previewSize === 'a4-portrait' ? '210mm' : '297mm'} !important;
                height: ${previewSize === 'a4-portrait' ? '297mm' : '210mm'} !important;
              }
            }
          `}</style>

        </div>
      </main>
    </div>
  );
};

export default ChronogramLibrary;
