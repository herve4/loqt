import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authService, logisticsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
  const { updateAuthUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    region: '',
    eglise: '',
    pole: '',
    password: '',
    confirm_password: '',
    accept_terms: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);

  const { data: eglisesData } = useQuery({
    queryKey: ['eglises'],
    queryFn: () => logisticsService.getEglises().then(r => r.data),
  });

  const { data: polesData } = useQuery({
    queryKey: ['poles'],
    queryFn: () => logisticsService.getPoles().then(r => r.data),
  });
  
  const { data: regionsData } = useQuery({
    queryKey: ['regions'],
    queryFn: () => logisticsService.getRegions().then(r => r.data),
  });

  const eglisesRaw = Array.isArray(eglisesData) ? eglisesData : (eglisesData?.results || []);
  const poles = Array.isArray(polesData) ? polesData : (polesData?.results || []);
  const regionsRaw = Array.isArray(regionsData) ? regionsData : (regionsData?.results || []);

  // On ne garde que les régions qui ont au moins une église associée
  // et on nettoie le nom (enlève le préfixe "REGION ")
  const regions = regionsRaw
    .filter(r => eglisesRaw.some(e => String(e.region) === String(r.id)))
    .map(r => ({
      ...r,
      nom: r.nom.replace(/^REGION\s+/i, '').trim()
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom));

  const eglises = formData.region 
    ? eglisesRaw.filter(e => String(e.region) === String(formData.region))
    : [];

  const registerMutation = useMutation({
    mutationFn: (data) => authService.register(data),
    onSuccess: (response) => {
      updateAuthUser(response.data.user);
      navigate('/dashboard');
    },
    onError: (err) => {
      const data = err.response?.data;
      if (typeof data === 'object') {
        setError(Object.values(data).flat().join(', '));
      } else {
        setError("Une erreur est survenue lors de l'inscription.");
      }
    }
  });

  const handleSendCode = async () => {
    if (!formData.email) {
      setError('Veuillez entrer votre email pour recevoir le code.');
      return;
    }
    setError('');
    setSuccess('');
    setIsVerifying(true);
    try {
      await authService.sendVerificationCode(formData.email);
      setShowCodeInput(true);
      setSuccess('Code envoyé ! Vérifiez votre boîte mail.');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi du code.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Veuillez entrer le code reçu.');
      return;
    }
    setError('');
    setIsVerifying(true);
    try {
      await authService.verifyCode(formData.email, verificationCode);
      setIsEmailVerified(true);
      setShowCodeInput(false);
      setSuccess('Email vérifié avec succès !');
    } catch (err) {
      setError(err.response?.data?.message || "Code incorrect.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      // Reset eglise if region changes
      if (name === 'region') {
        newData.eglise = '';
      }
      return newData;
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.fullName || !formData.email || !formData.phone) {
        setError('Veuillez remplir tous les champs personnels.');
        return;
      }
      if (!isEmailVerified) {
        setError("Veuillez d'abord vérifier votre adresse email.");
        return;
      }
      setError('');
      setSuccess('');
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      handleNext();
      return;
    }
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (!formData.accept_terms) {
      setError('Veuillez accepter les conditions d\'utilisation.');
      return;
    }

    // Séparation du nom complet en Prénom et Nom pour le backend
    const nameParts = formData.fullName.trim().split(' ');
    const firstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    const lastName = nameParts[0];

    const payload = {
      first_name: lastName, // Dans CustomUser, first_name est "Nom" et last_name est "Prénoms"
      last_name: firstName,
      email: formData.email,
      phone: formData.phone,
      eglise: formData.eglise,
      pole: formData.pole,
      password: formData.password,
      accept_terms: formData.accept_terms,
      role: 'technicien' // Rôle par défaut
    };

    registerMutation.mutate(payload);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-20 py-4 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3 text-primary">
              <div className="size-8 flex items-center justify-center bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">account_balance</span>
              </div>
              <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">SGL-CI</h2>
            </div>
            <Link to="/login" className="flex items-center justify-center rounded-full h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </Link>
          </header>

          <main className="flex-1 flex justify-center py-10 px-4">
            <div className="layout-content-container flex flex-col max-w-[640px] w-full bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="mb-6">
                <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-black leading-tight tracking-tight">
                  {step === 1 ? 'Vos informations' : 'Votre service'}
                </h1>
                <div className="flex gap-2 mt-4">
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                  <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 text-green-600 dark:text-green-400 text-xs rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {success}
                </div>
              )}
              <form className="flex flex-col" onSubmit={handleSubmit}>
                {step === 1 ? (
                  <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Nom Complet</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">person</span>
                        <input 
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 text-sm transition-all" 
                          placeholder="Entrez votre nom complet" 
                          type="text"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Adresse Email</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">mail</span>
                          <input 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isEmailVerified}
                            className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 text-sm transition-all disabled:opacity-70" 
                            placeholder="exemple@email.com" 
                            type="email"
                          />
                        </div>
                        {!isEmailVerified && (
                          <button 
                            type="button"
                            onClick={handleSendCode}
                            disabled={isVerifying || !formData.email}
                            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 rounded-lg transition-all disabled:opacity-50"
                          >
                            {isVerifying ? '...' : 'Vérifier'}
                          </button>
                        )}
                        {isEmailVerified && (
                          <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 flex items-center rounded-lg border border-green-200 dark:border-green-800">
                             <span className="material-symbols-outlined text-[18px]">verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {showCodeInput && !isEmailVerified && (
                      <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Code de sécurité reçu</label>
                        <div className="flex gap-2">
                          <input 
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="flex-1 px-4 py-2 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 text-sm" 
                            placeholder="Entrez le code" 
                            type="text"
                            maxLength="6"
                          />
                          <button 
                            type="button"
                            onClick={handleVerifyCode}
                            disabled={isVerifying}
                            className="bg-slate-800 text-white text-xs font-bold px-4 rounded-lg hover:bg-slate-700 transition-all disabled:opacity-50"
                          >
                            Valider
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Numéro de Téléphone</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">call</span>
                        <input 
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 text-sm transition-all" 
                          placeholder="+225 07 00 00 00 00" 
                          type="tel"
                        />
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={handleNext}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
                      disabled={!isEmailVerified}
                    >
                      Suivant
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>

                    <div className="flex items-center my-4">
                      <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                      <span className="px-4 text-xs text-slate-400 font-bold uppercase tracking-widest text-[9px]">OU S'INSCRIRE AVEC</span>
                      <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                    </div>

                    <div className="w-full flex justify-center google-login-container select-none">
                      <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                          try {
                            const res = await authService.googleLogin(credentialResponse.credential);
                            updateAuthUser(res.data.user);
                            if (res.data.user.onboarding_completed) {
                              navigate('/dashboard');
                            } else {
                              navigate('/onboarding');
                            }
                          } catch (err) {
                            setError(err.response?.data?.message || "Erreur lors de l'authentification Google");
                          }
                        }}
                        onError={() => {
                          setError("Échec de l'authentification Google");
                        }}
                        theme="outline"
                        shape="square"
                        size="large"
                        locale="fr"
                        width="350px"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Région</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">map</span>
                          <select 
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-8 py-2.5 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 text-sm appearance-none cursor-pointer transition-all"
                          >
                            <option value="">Région</option>
                            {regions.map(r => (
                              <option key={r.id} value={r.id}>{r.nom}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Église Locale</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">church</span>
                          <select 
                            name="eglise"
                            value={formData.eglise}
                            onChange={handleChange}
                            required
                            disabled={!formData.region}
                            className="w-full pl-10 pr-8 py-2.5 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 text-sm appearance-none cursor-pointer transition-all disabled:opacity-50"
                          >
                            <option value="">{!formData.region ? "Choisir région" : "Église"}</option>
                            {eglises.map(eglise => (
                              <option key={eglise.id} value={eglise.id}>{eglise.nom}</option>
                            ))}
                          </select>
                          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Pôle Technique</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">handyman</span>
                        <select 
                          name="pole"
                          value={formData.pole}
                          onChange={handleChange}
                          className="w-full pl-10 pr-8 py-2.5 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 text-sm appearance-none cursor-pointer transition-all"
                        >
                          <option value="">Sélectionner un pôle</option>
                          {poles.map(pole => (
                            <option key={pole.id} value={pole.id}>{pole.nom}</option>
                          ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Mot de passe</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock</span>
                          <input 
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 text-sm transition-all" 
                            placeholder="••••••••" 
                            type="password"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Confirmer</label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">lock_reset</span>
                          <input 
                            name="confirm_password"
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-background-dark border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-slate-900 dark:text-slate-100 text-sm transition-all" 
                            placeholder="••••••••" 
                            type="password"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 mt-1">
                      <input 
                        name="accept_terms"
                        checked={formData.accept_terms}
                        onChange={handleChange}
                        className="mt-1 h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary" 
                        id="terms" 
                        type="checkbox"
                      />
                      <label className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight" htmlFor="terms">
                        J'accepte les <a className="text-primary hover:underline font-medium" href="#">Conditions d'utilisation</a>
                      </label>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button 
                        type="button"
                        onClick={handleBack}
                        className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        Retour
                      </button>
                      <button 
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="flex-[2] bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {registerMutation.isPending ? 'Patientez...' : 'Terminer'}
                        {!registerMutation.isPending && <span className="material-symbols-outlined text-[18px]">check_circle</span>}
                      </button>
                    </div>
                  </div>
                )}
              </form>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Vous avez déjà un compte ? <Link to="/login" className="text-primary font-bold hover:underline">Se connecter</Link>
                </p>
              </div>
            </div>
          </main>
          <footer className="py-6 text-center text-slate-400 dark:text-slate-600 text-xs">
            © 2024 SGL-CI Registration System. Tous droits réservés.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Register;
