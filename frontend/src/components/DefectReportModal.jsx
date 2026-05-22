import React, { useState, useRef, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logisticsService } from '../services/api';
import { toast } from 'react-hot-toast';

// ─── Camera Capture Hook ──────────────────────────────────────────────────────

const useCameraCapture = (onCapture) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const openCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      // Wait for videoRef to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 80);
    } catch (err) {
      setCameraError('Accès caméra refusé. Vérifiez les permissions du navigateur.');
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  }, []);

  const capture = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `constat_${Date.now()}.jpg`, { type: 'image/jpeg' });
      onCapture(file);
      closeCamera();
    }, 'image/jpeg', 0.9);
  }, [onCapture, closeCamera]);

  return { videoRef, isCameraOpen, cameraError, openCamera, closeCamera, capture };
};

// ─── Main Component ──────────────────────────────────────────────────────────

const DefectReportModal = ({ item, onClose }) => {
  // item can be null for unlisted equipment
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  // Free mode fields (when item is null or toggled)
  const [freeMode, setFreeMode] = useState(!item);
  const [nomMaterielLibre, setNomMaterielLibre] = useState('');
  const [lieuConstat, setLieuConstat] = useState('');

  const queryClient = useQueryClient();

  const handlePhotoFile = useCallback((file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image dépasse la taille maximale autorisée (5 Mo)");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }, [photoPreview]);

  const { videoRef, isCameraOpen, cameraError, openCamera, closeCamera, capture } = useCameraCapture(handlePhotoFile);

  const mutation = useMutation({
    mutationFn: (formData) => logisticsService.postDefectReport(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['materiel-defects'] });
      toast.success('Défaillance signalée avec succès !');
      onClose();
    },
    onError: (err) => {
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : err.message || 'Une erreur est survenue';
      toast.error(`Erreur : ${msg}`);
    }
  });

  const handlePhotoChange = (e) => handlePhotoFile(e.target.files[0]);

  const handleClearPhoto = (e) => {
    e.preventDefault();
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(null);
    setPhotoPreview('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Veuillez décrire le défaut technique constaté.');
      return;
    }
    if (freeMode && !nomMaterielLibre.trim()) {
      toast.error('Veuillez nommer le matériel non répertorié.');
      return;
    }

    const formData = new FormData();
    if (!freeMode && item) {
      formData.append('materiel', item.id);
    }
    if (nomMaterielLibre.trim()) {
      formData.append('nom_materiel_libre', nomMaterielLibre.trim());
    }
    if (lieuConstat.trim()) {
      formData.append('lieu_constat', lieuConstat.trim());
    }
    formData.append('description', description);
    formData.append('niveau_gravite', severity);
    if (photo) {
      formData.append('photo', photo);
    }
    mutation.mutate(formData);
  };

  const severityOptions = [
    { value: 'Low',      label: 'Faible',   icon: 'check_circle', activeClass: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400', iconClass: 'text-emerald-500' },
    { value: 'Medium',   label: 'Moyen',    icon: 'warning',      activeClass: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',   iconClass: 'text-amber-500' },
    { value: 'Critical', label: 'Critique', icon: 'dangerous',    activeClass: 'border-red-600 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',             iconClass: 'text-red-600' },
  ];

  const hasCameraSupport = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md no-print">
      <style>{`
        @keyframes modalSlideUp {
          from { transform: scale(0.96); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        @keyframes mobileSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0);    }
        }
        .animate-modal-slide { animation: modalSlideUp 0.25s cubic-bezier(0.16,1,0.3,1) forwards; }
        @media (max-width: 639px) {
          .animate-modal-slide { animation: mobileSlideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
        }
        @keyframes camFlash {
          0%   { opacity: 0; }
          20%  { opacity: 0.8; }
          100% { opacity: 0; }
        }
        .cam-flash { animation: camFlash 0.35s ease-out; }
      `}</style>

      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto p-6 relative flex flex-col rounded-none border-t sm:border border-slate-200 dark:border-slate-800 shadow-2xl animate-modal-slide">

        {/* Mobile Pull Handle */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 mx-auto mb-4 rounded-none sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 animate-pulse text-2xl">report_problem</span>
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Signaler une défaillance
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors p-1">
            <span className="material-symbols-outlined text-lg font-black">close</span>
          </button>
        </div>

        {/* Camera View */}
        {isCameraOpen && (
          <div className="relative w-full aspect-video bg-slate-950 border border-slate-800 mb-4 overflow-hidden shrink-0">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Targeting reticle */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-40 h-28 border-2 border-white/60 relative">
                <span className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-white" />
                <span className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-white" />
                <span className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-white" />
                <span className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-white" />
              </div>
            </div>
            {/* Controls */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3 z-10">
              <button
                type="button"
                onClick={closeCamera}
                className="h-9 px-4 bg-slate-900/80 border border-slate-700 text-slate-300 font-mono text-[10px] font-bold uppercase tracking-widest rounded-none hover:bg-slate-800 transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={capture}
                className="size-14 bg-white border-4 border-slate-300 rounded-full flex items-center justify-center cursor-pointer hover:border-amber-400 transition-all active:scale-90 shadow-xl"
              >
                <span className="size-10 bg-amber-500 rounded-full block" />
              </button>
            </div>
          </div>
        )}

        {cameraError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-xs font-mono text-red-600 dark:text-red-400 flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-sm">videocam_off</span>
            {cameraError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 flex-1">

          {/* Equipment Banner / Free Mode Toggle */}
          {item && !freeMode ? (
            <div className="bg-slate-50 dark:bg-slate-950/40 p-4 border-l-2 border-amber-500 font-mono text-xs space-y-1.5 rounded-none">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Matériel affecté</span>
              <div className="flex justify-between items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase truncate text-sm">{item.nom}</span>
                <span className="shrink-0 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] text-slate-700 dark:text-slate-300">
                  {item.identifiant_unique || `EQ-${item.id}`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  Statut : <span className="font-bold">
                    {item.etat === 'OP' ? 'OPÉRATIONNEL' : item.etat === 'RE' ? 'EN RÉPARATION' : 'EN PANNE'}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setFreeMode(true)}
                  className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 cursor-pointer border-b border-amber-400 border-dashed hover:border-amber-600 transition-colors"
                >
                  Matériel non répertorié ?
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 p-4 space-y-3 rounded-none">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">help_outline</span>
                  Matériel non répertorié
                </span>
                {item && (
                  <button
                    type="button"
                    onClick={() => { setFreeMode(false); setNomMaterielLibre(''); setLieuConstat(''); }}
                    className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 cursor-pointer border-b border-slate-400 border-dashed hover:border-slate-600 transition-colors"
                  >
                    ← Revenir au matériel
                  </button>
                )}
              </div>
              <input
                type="text"
                value={nomMaterielLibre}
                onChange={(e) => setNomMaterielLibre(e.target.value)}
                placeholder="Nom du matériel (ex: Micro HF Shure, Câble XLR...)"
                className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 p-3 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-amber-500 dark:focus:border-amber-600 rounded-none outline-none focus:outline-none focus:ring-0 transition-all"
                required={freeMode}
              />
              <input
                type="text"
                value={lieuConstat}
                onChange={(e) => setLieuConstat(e.target.value)}
                placeholder="Lieu / événement où il se trouve (optionnel)"
                className="w-full bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 p-3 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-amber-500 dark:focus:border-amber-600 rounded-none outline-none focus:outline-none focus:ring-0 transition-all"
              />
            </div>
          )}

          {/* Severity Levels */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Niveau de Gravité
            </label>
            <div className="flex gap-2">
              {severityOptions.map((opt) => {
                const isActive = severity === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-none border transition-all cursor-pointer font-mono text-xs outline-none focus:outline-none focus:ring-0
                      ${isActive
                        ? `${opt.activeClass} border-current font-bold shadow-sm`
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                  >
                    <span className={`material-symbols-outlined mb-1 text-xl select-none ${isActive ? opt.iconClass : 'text-slate-300 dark:text-slate-600'}`}>
                      {opt.icon}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider leading-none">{opt.label}</span>
                    {isActive && (
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Problem Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Description de l'Anomalie
            </label>
            <textarea
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 rounded-none focus:ring-0 outline-none focus:outline-none min-h-[100px] resize-none"
              placeholder="Détaillez le dysfonctionnement ou les dégâts matériels constatés..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Photo Attachment */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-mono font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Photo du Constat (Optionnel)
            </label>
            {!photoPreview ? (
              <div className="flex items-stretch gap-2">
                {/* File picker */}
                <label className="flex-1 h-14 rounded-none border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer bg-slate-50 dark:bg-slate-950/40 font-mono text-[10px] uppercase font-bold tracking-wider">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  <span className="material-symbols-outlined text-lg">folder_open</span>
                  Depuis la galerie
                </label>

                {/* Camera button */}
                {hasCameraSupport && (
                  <button
                    type="button"
                    onClick={openCamera}
                    disabled={isCameraOpen}
                    className="h-14 px-4 rounded-none border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer bg-slate-50 dark:bg-slate-950/40 font-mono text-[10px] uppercase font-bold tracking-wider shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                    <span className="hidden sm:inline">Caméra</span>
                  </button>
                )}

                {/* Mobile direct camera capture fallback */}
                <label className="h-14 px-4 rounded-none border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer bg-slate-50 dark:bg-slate-950/40 font-mono text-[10px] uppercase font-bold tracking-wider shrink-0 sm:hidden">
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                  <span className="material-symbols-outlined text-lg">camera_alt</span>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="h-20 aspect-square rounded-none bg-slate-200 dark:bg-slate-800 relative overflow-hidden group border border-slate-200 dark:border-slate-700 shrink-0">
                  <img src={photoPreview} className="w-full h-full object-cover" alt="Aperçu constat" />
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white border-0 outline-none"
                    title="Supprimer la photo"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] text-slate-500 flex flex-col gap-0.5 min-w-0">
                  <p className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Fichier sélectionné</p>
                  <p className="truncate text-slate-500">{photo?.name}</p>
                  {photo && <p className="text-[9px] text-slate-400">{(photo.size / 1024).toFixed(1)} Ko</p>}
                  <button
                    type="button"
                    onClick={handleClearPhoto}
                    className="mt-1 text-[9px] text-red-500 hover:text-red-700 cursor-pointer uppercase tracking-widest font-bold text-left"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="h-11 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-300 font-mono font-bold uppercase tracking-widest text-[10px] rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:outline-none"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !description.trim() || (freeMode && !nomMaterielLibre.trim())}
              className="h-11 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white font-mono font-bold uppercase tracking-widest text-[10px] rounded-none active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed outline-none focus:outline-none"
            >
              <span className="material-symbols-outlined text-sm font-black select-none">send</span>
              {mutation.isPending ? 'Envoi...' : 'Confirmer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DefectReportModal;
