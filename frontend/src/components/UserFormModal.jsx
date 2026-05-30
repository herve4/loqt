import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logisticsService, authService } from '../services/api';
import toast from 'react-hot-toast';

const UserFormModal = ({ isOpen, onClose, userToEdit = null, isOwnProfile = false }) => {
  const queryClient = useQueryClient();

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
      return url;
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
    const baseUrl = apiUrl.endsWith('/api/') ? apiUrl.replace('/api/', '') : apiUrl.replace('/api', '');
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'technicien',
    eglise: '',
    pole: '',
    is_active: true,
    password: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Queries to load Churches and Poles
  const { data: churchesData } = useQuery({
    queryKey: ['churches-selector'],
    queryFn: () => logisticsService.getEglises().then(res => res.data),
    enabled: isOpen
  });

  const { data: polesData } = useQuery({
    queryKey: ['poles-selector'],
    queryFn: () => logisticsService.getPoles().then(res => res.data),
    enabled: isOpen
  });

  const churches = Array.isArray(churchesData) ? churchesData : (churchesData?.results || []);
  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);

  // Populating form for editing
  useEffect(() => {
    if (isOpen) {
      if (userToEdit) {
        setFormData({
          first_name: userToEdit.first_name || '',
          last_name: userToEdit.last_name || '',
          email: userToEdit.email || '',
          phone: userToEdit.phone || '',
          role: userToEdit.role || 'technicien',
          eglise: userToEdit.eglise || '',
          pole: userToEdit.pole || '',
          is_active: userToEdit.is_active !== undefined ? userToEdit.is_active : true,
          password: '' // Always empty on load for security
        });
        setImagePreview(userToEdit.image ? getImageUrl(userToEdit.image) : '');
        setImageFile(null);
      } else {
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          role: 'technicien',
          eglise: '',
          pole: '',
          is_active: true,
          password: ''
        });
        setImagePreview('');
        setImageFile(null);
      }
      setShowPassword(false);
    }
  }, [isOpen, userToEdit]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle Avatar Change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => logisticsService.createMember(data),
    onSuccess: () => {
      toast.success('Membre créé avec succès !');
      queryClient.invalidateQueries({ queryKey: ['members-list'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClose();
    },
    onError: (err) => {
      const details = err.response?.data;
      if (details) {
        // Handle common validation error fields
        const firstErr = Object.keys(details)[0];
        toast.error(`${firstErr.toUpperCase()}: ${details[firstErr][0] || details[firstErr]}`);
      } else {
        toast.error("Erreur lors de la création du membre.");
      }
    }
  });

  // Own profile update → PATCH /api/auth/me/ (no special permission needed)
  const updateSelfMutation = useMutation({
    mutationFn: (data) => authService.updateProfile(data),
    onSuccess: () => {
      toast.success('Profil mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      onClose();
    },
    onError: (err) => {
      const details = err.response?.data;
      if (details) {
        const firstErr = Object.keys(details)[0];
        toast.error(`${firstErr.toUpperCase()}: ${details[firstErr][0] || details[firstErr]}`);
      } else {
        toast.error("Erreur lors de la mise à jour du profil.");
      }
    }
  });

  // Admin update of another member → PATCH /api/members/{id}/
  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }) => logisticsService.updateMember(id, data),
    onSuccess: () => {
      toast.success('Membre mis à jour avec succès !');
      queryClient.invalidateQueries({ queryKey: ['members-list'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      onClose();
    },
    onError: (err) => {
      const details = err.response?.data;
      if (details) {
        const firstErr = Object.keys(details)[0];
        toast.error(`${firstErr.toUpperCase()}: ${details[firstErr][0] || details[firstErr]}`);
      } else {
        toast.error("Erreur lors de la mise à jour du membre.");
      }
    }
  });

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("Le nom et le prénom sont obligatoires.");
      return;
    }

    if (!userToEdit && !formData.password) {
      toast.error("Le mot de passe est obligatoire pour la création.");
      return;
    }

    // Prepare FormData payload for file upload compatibility
    const payload = new FormData();
    payload.append('first_name', formData.first_name.trim());
    payload.append('last_name', formData.last_name.trim());
    
    if (formData.email.trim()) payload.append('email', formData.email.trim());
    if (formData.phone.trim()) payload.append('phone', formData.phone.trim());
    
    // Only administrators can change roles, eglise, pole or active status, and only if they are not editing their own profile
    if (!isOwnProfile) {
      payload.append('role', formData.role);
      payload.append('is_active', formData.is_active);
      payload.append('eglise', formData.eglise || '');
      payload.append('pole', formData.pole || '');
    }

    if (formData.password) {
      payload.append('password', formData.password);
    }

    if (imageFile) {
      payload.append('image', imageFile);
    }

    if (userToEdit) {
      if (isOwnProfile) {
        // Route self-edits to /api/auth/me/ to avoid permission issues
        updateSelfMutation.mutate(payload);
      } else {
        updateMemberMutation.mutate({ id: userToEdit.id, data: payload });
      }
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  const roles = [
    { value: 'super_admin', label: 'Super-Administrateur' },
    { value: 'pasteur_national', label: 'Pasteur Responsable National' },
    { value: 'rln', label: 'Responsable Logistique National (RLN)' },
    { value: 'pasteur_local', label: 'Pasteur Responsable Local' },
    { value: 'rll', label: 'Responsable Logistique Local (RLL)' },
    { value: 'technicien', label: 'Membre Technicien' },
    { value: 'pasteur', label: 'Pasteur' },
    { value: 'resp_dept', label: 'Responsable de Département' },
    { value: 'adj_dept', label: 'Adjoint Responsable de Département' },
    { value: 'resp_sec', label: 'Responsable de Section' },
    { value: 'adj_sec', label: 'Adjoint Responsable de Section' },
    { value: 'membre_dept', label: 'Membre de Département' },
    { value: 'membre_sec', label: 'Membre de Section' },
    { value: 'membre', label: 'Membre' },
    { value: 'responsable', label: 'Responsable' }
  ];

  const inputStyle = {
    backgroundColor: '#020617',
    color: '#ffffff',
    borderColor: '#1e293b'
  };

  const isSubmitting = createMutation.isPending || updateSelfMutation.isPending || updateMemberMutation.isPending;

  return (
    <div className="fixed inset-0 z-[1500] flex items-center justify-center bg-slate-950/80 backdrop-blur-md font-mono select-none overflow-y-auto py-8">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl animate-in zoom-in-95 duration-200 rounded-none my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-lg">
              {isOwnProfile ? 'person' : userToEdit ? 'manage_accounts' : 'person_add'}
            </span>
            <span className="text-xs font-black tracking-widest text-slate-200 uppercase">
              {isOwnProfile ? '[ MON PROFIL PERSONNEL ]' : userToEdit ? '[ MODIFIER MEMBRE ]' : '[ ENREGISTRER UN MEMBRE ]'}
            </span>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors cursor-pointer text-xs"
          >
            [ FERMER ]
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Avatar & Basic Infos */}
            <div className="space-y-4">
              
              {/* Avatar Uploader */}
              <div className="flex items-center gap-4 bg-slate-950/50 p-4 border border-slate-800/80 rounded-none">
                <div className="relative w-16 h-16 bg-slate-900 border border-slate-850 flex items-center justify-center overflow-hidden rounded-none">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-600 text-3xl">account_circle</span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-slate-400 tracking-wider mb-1 uppercase">IMAGE DE PROFIL</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    className="hidden" 
                    id="avatar-upload"
                  />
                  <label 
                    htmlFor="avatar-upload"
                    className="inline-block py-1 px-3 bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-[9px] tracking-widest uppercase border border-slate-800 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    CHOISIR FICHIER
                  </label>
                </div>
              </div>

              {/* Nom */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase">NOM *</label>
                <input 
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-none outline-none focus:border-slate-600 transition-colors uppercase"
                  placeholder="EX: KOFFI"
                />
              </div>

              {/* Prénoms */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase">PRÉNOMS *</label>
                <input 
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-none outline-none focus:border-slate-600 transition-colors capitalize"
                  placeholder="EX: JEAN EMMANUEL"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase">
                  {userToEdit ? 'MOT DE PASSE (LAISSER VIDE POUR CONSERVER)' : 'MOT DE PASSE *'}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!userToEdit}
                    style={inputStyle}
                    className="w-full text-xs py-2 pl-3 pr-10 bg-slate-950 border border-slate-800 text-white rounded-none outline-none focus:border-slate-600 transition-colors"
                    placeholder={userToEdit ? "••••••••" : "SAISIR MOT DE PASSE"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm select-none">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Roles, Contacts & Scope Options */}
            <div className="space-y-4">
              
              {/* Adresse Email */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase">ADRESSE EMAIL</label>
                <input 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={inputStyle}
                  className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-none outline-none focus:border-slate-600 transition-colors"
                  placeholder="EX: ADRESSE@EMAIL.COM"
                />
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase">TÉLÉPHONE</label>
                <input 
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={inputStyle}
                  className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-none outline-none focus:border-slate-600 transition-colors"
                  placeholder="EX: +225 0707070707"
                />
              </div>

              {/* Admin fields: only editable if isOwnProfile is false */}
              {!isOwnProfile ? (
                <>
                  {/* Rôle */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase">RÔLE ADMINISTRATIF *</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      style={inputStyle}
                      className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-none outline-none focus:border-slate-600 transition-colors cursor-pointer"
                    >
                      {roles.map(r => (
                        <option key={r.value} value={r.value}>{r.label.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Eglise Select */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase">RATTACHEMENT ÉGLISE</label>
                    <select
                      name="eglise"
                      value={formData.eglise}
                      onChange={handleChange}
                      style={inputStyle}
                      className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-none outline-none focus:border-slate-600 transition-colors cursor-pointer"
                    >
                      <option value="">[ AUCUNE ÉGLISE SPÉCIFIQUE ]</option>
                      {churches.map(c => (
                        <option key={c.id} value={c.id}>{c.nom.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Pole Select */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase">RATTACHEMENT PÔLE TECHNIQUE</label>
                    <select
                      name="pole"
                      value={formData.pole}
                      onChange={handleChange}
                      style={inputStyle}
                      className="w-full text-xs py-2 px-3 bg-slate-950 border border-slate-800 text-white rounded-none outline-none focus:border-slate-600 transition-colors cursor-pointer"
                    >
                      <option value="">[ AUCUN PÔLE SPÉCIFIQUE ]</option>
                      {poles.map(p => (
                        <option key={p.id} value={p.id}>{p.nom.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  {/* Toggle Active status */}
                  <div className="flex items-center gap-3 pt-3 select-none">
                    <input 
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer bg-slate-950 border-slate-800"
                    />
                    <label htmlFor="is_active" className="text-[10px] font-bold tracking-wider text-slate-300 cursor-pointer uppercase">
                      COMPTE ACTIF (PEUT SE CONNECTER À LA PLATEFORME)
                    </label>
                  </div>
                </>
              ) : (
                <div className="bg-slate-950/30 p-4 border border-slate-800/50 space-y-2">
                  <p className="text-[9px] font-black text-slate-400 tracking-widest uppercase">[ LIAISON DE SÉCURITÉ ]</p>
                  <p className="text-[9px] text-slate-500 uppercase leading-relaxed">
                    VOTRE ÉGLISE, VOTRE RÔLE ET VOTRE PÔLE TECHNIQUE SONT LIÉS À VOTRE CONTRAT D'ACCÈS ET NE PEUVENT ÊTRE MODIFIÉS QUE PAR UN SUPER-ADMINISTRATEUR.
                  </p>
                  <div className="pt-2 text-[9px] text-slate-300 space-y-1">
                    <div>RÔLE: <span className="text-white font-bold">{(roles.find(r => r.value === formData.role)?.label || formData.role || "SANS RÔLE SPÉCIFIQUE").toUpperCase()}</span></div>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-slate-800">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-slate-400 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-all rounded-none border border-slate-800 cursor-pointer active:scale-[0.98]"
            >
              ANNULER
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-indigo-950/20 hover:bg-indigo-900/30 disabled:opacity-50 text-indigo-400 hover:text-indigo-300 font-bold text-[10px] uppercase tracking-widest transition-all rounded-none border border-indigo-900 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting ? 'ENREGISTREMENT...' : userToEdit ? 'ENREGISTRER MODIFICATIONS' : 'CRÉER COMPTE MEMBRE'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
