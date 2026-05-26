import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { logisticsService } from '../services/api';

const DefectReport = () => {
  const navigate = useNavigate();
  const { materielId } = useParams();
  
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [photos, setPhotos] = useState([]);
  const [scanId, setScanId] = useState(materielId || '');

  const { data: materiel, isLoading: materielLoading } = useQuery({
    queryKey: ['materiel', scanId],
    queryFn: () => logisticsService.getMaterielById(scanId).then(res => res.data),
    enabled: !!scanId && scanId.length > 0,
    retry: false
  });

  const mutation = useMutation({
    mutationFn: (formData) => logisticsService.postDefectReport(formData),
    onSuccess: () => {
       alert('Signalement soumis avec succès !');
       navigate('/inventory');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('materiel', materiel?.id);
    formData.append('description', description);
    formData.append('niveau_gravite', severity);
    photos.forEach(photo => formData.append('photos', photo));
    
    mutation.mutate(formData);
  };

  return (
    <Layout 
      title="Signalement de Panne" 
      showBackButton={true} 
      onBack={() => navigate(-1)}
    >
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Détails du Signalement</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Remplissez les informations ci-dessous pour signaler un problème matériel.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {/* Field 1: Scan / ID */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Scanner le Code QR / Saisir l'ID</label>
            <div className="flex w-full items-stretch rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/50 transition-all bg-white dark:bg-slate-900">
              <input 
                className="flex w-full min-w-0 flex-1 border-none bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 h-12 px-4 focus:ring-0 text-base" 
                placeholder="Ex. 42" 
                type="text"
                value={scanId}
                onChange={(e) => setScanId(e.target.value)}
              />
              <button type="button" className="bg-primary/10 dark:bg-primary/20 text-primary px-4 flex items-center justify-center hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined">qr_code_scanner</span>
              </button>
            </div>
          </div>

          {/* Field 2: Equipment Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nom de l'Équipement</label>
            <div className="relative">
              <input 
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 h-12 px-4 text-base focus:ring-0" 
                readOnly 
                type="text" 
                value={materiel ? materiel.nom : (scanId ? 'Recherche en cours...' : 'Scannez le matériel d\'abord')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-sm">lock</span>
            </div>
          </div>

          {/* Field 3: Problem Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description du Problème</label>
            <textarea 
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 min-h-[120px] p-4 text-base focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
              placeholder="Décrivez la panne en détail (ex. bruit inhabituel, fissure)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Field 4: Photo Upload */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Photos de l'Anomalie</label>
            <div className="grid grid-cols-3 gap-3">
              <label className="aspect-square rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all gap-1 cursor-pointer">
                <input type="file" multiple className="hidden" onChange={(e) => setPhotos([...photos, ...Array.from(e.target.files)])} />
                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-center">Ajouter</span>
              </label>
              {photos.map((photo, index) => (
                <div key={index} className="aspect-square rounded-lg bg-slate-200 dark:bg-slate-800 relative overflow-hidden group">
                  <img src={URL.createObjectURL(photo)} className="w-full h-full object-cover" alt="Preview" />
                  <div 
                    onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Field 5: Severity Level */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Niveau de Gravité</label>
            <div className="flex gap-2">
              <SeverityOption 
                label="Faible" 
                icon="check_circle" 
                color="green" 
                active={severity === 'Low'} 
                onClick={() => setSeverity('Low')} 
              />
              <SeverityOption 
                label="Moyen" 
                icon="warning" 
                color="orange" 
                active={severity === 'Medium'} 
                onClick={() => setSeverity('Medium')} 
              />
              <SeverityOption 
                label="Critique" 
                icon="dangerous" 
                color="red" 
                active={severity === 'Critical'} 
                onClick={() => setSeverity('Critical')} 
              />
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={mutation.isPending || !materiel}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-slate-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined">send</span>
              {mutation.isPending ? 'Envoi...' : 'Soumettre le Rapport'}
            </button>
          </div>
        </form>
      </main>
    </Layout>
  );
};

const SeverityOption = ({ label, icon, color, active, onClick }) => {
  const colorClasses = {
    green: active ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600' : '',
    orange: active ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600' : '',
    red: active ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600' : '',
  };

  return (
    <div 
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all cursor-pointer text-slate-500 ${colorClasses[color]}`}
    >
      <span className="material-symbols-outlined mb-1">{icon}</span>
      <span className="text-xs font-bold">{label}</span>
    </div>
  );
};

export default DefectReport;
