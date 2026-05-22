import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ user: '', password: '', remember_me: false });
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const loginMutation = useMutation({
    mutationFn: (credentials) => login(credentials),
    onSuccess: () => {
      navigate('/dashboard');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Identifiants incorrects ou erreur serveur');
      setShowToast(true);
    }
  });

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setShowToast(false);
    loginMutation.mutate(formData);
  };


  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-primary/10 px-6 md:px-10 py-4 bg-white dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="flex items-center gap-3 text-primary">
              <div className="size-8 flex items-center justify-center bg-primary text-white rounded-lg">
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
              </div>
              <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">SGL-CI Logistics</h2>
            </div>
          </header>

          <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 opacity-5 pointer-events-none overflow-hidden">
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
            </div>

            <div className="layout-content-container flex flex-col w-full max-w-[1000px] bg-white dark:bg-slate-900 shadow-xl rounded-2xl overflow-hidden md:flex-row relative z-10 border border-slate-200 dark:border-slate-800">
              {/* Left Side: Visual/Branding */}
              <div className="hidden md:flex md:w-1/2 bg-primary relative p-12 flex-col justify-between text-white overflow-hidden">
                <div 
                  className="absolute inset-0 opacity-30 bg-center bg-cover mix-blend-overlay"
                  style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80")' }}
                ></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-8">
                    <span className="material-symbols-outlined text-4xl">church</span>
                    <span className="text-2xl font-bold tracking-tight">SGL-CI</span>
                  </div>
                  <h1 className="text-4xl font-black leading-tight tracking-tight mb-4">Logistique Efficace pour un Impact Global</h1>
                  <p className="text-white/80 text-lg">Optimiser la gestion de notre communauté et de nos chaînes d'approvisionnement avec précision.</p>
                </div>
                <div className="relative z-10 pt-12 border-t border-white/20">
                  <div className="flex gap-4">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full border-2 border-primary bg-slate-200" style={{ backgroundImage: 'url("https://i.pravatar.cc/100?u=1")' }}></div>
                      <div className="w-10 h-10 rounded-full border-2 border-primary bg-slate-300" style={{ backgroundImage: 'url("https://i.pravatar.cc/100?u=2")' }}></div>
                      <div className="w-10 h-10 rounded-full border-2 border-primary bg-slate-400" style={{ backgroundImage: 'url("https://i.pravatar.cc/100?u=3")' }}></div>
                    </div>
                    <p className="text-sm self-center">Rejoint par plus de 500 gestionnaires</p>
                  </div>
                </div>
              </div>

              {/* Right Side: Login Form */}
              <div className="flex-1 p-8 md:p-16 flex flex-col justify-center">
                <div className="mb-10">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Bon retour parmi nous</h2>
                  <p className="text-slate-500 dark:text-slate-400">Veuillez entrer vos identifiants pour accéder au tableau de bord logistique.</p>
                </div>



                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Adresse Email ou Téléphone</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">mail</span>
                      <input 
                        name="user"
                        value={formData.user}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                        placeholder="nom@sgl-ci.org" 
                        type="text"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Mot de passe</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">lock</span>
                      <input 
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-12 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                        placeholder="••••••••" 
                        type={showPassword ? "text" : "password"}
                      />
                      <button 
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors" 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        name="remember_me"
                        checked={formData.remember_me}
                        onChange={handleChange}
                        className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" 
                        type="checkbox"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Se souvenir de moi</span>
                    </label>
                    <Link to="/forgot-password" size="sm" className="text-sm font-semibold text-primary hover:underline underline-offset-4">Mot de passe oublié ?</Link>
                  </div>
                  <button 
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70" 
                    type="submit"
                    disabled={loginMutation.isPending}
                  >
                    <span>{loginMutation.isPending ? 'Connexion en cours...' : 'Se connecter'}</span>
                    <span className="material-symbols-outlined">login</span>
                  </button>
                </form>
                <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Nouveau sur la plateforme ? <Link to="/register" className="text-primary font-bold hover:underline">Créer un compte</Link>
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Propulsé par <span className="font-bold text-slate-600 dark:text-slate-300">SGL-CI Global Services</span>
                  </p>
                </div>
              </div>
            </div>
          </main>
          <footer className="p-6 text-center text-slate-400 text-xs">
            © 2024 SGL-CI Logistics Management. Tous droits réservés. Usage professionnel uniquement.
          </footer>
        </div>
      </div>

      {/* Floating Toast */}
      <div className={`fixed top-6 right-6 z-[100] transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="max-w-md bg-white/95 border border-slate-100 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.08)] overflow-hidden relative group hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-300 backdrop-blur-md">
          {/* Dynamic colored accent bar at the left */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-red-500 to-rose-600"></div>
          
          <div className="p-5 flex items-start gap-4">
            {/* Icon with glowing background pulse */}
            <div className="relative flex items-center justify-center size-10 rounded-xl bg-red-50 text-red-500 shrink-0">
              <span className="material-symbols-outlined text-2xl animate-pulse">warning</span>
              <div className="absolute inset-0 bg-red-500/10 rounded-xl animate-ping opacity-75"></div>
            </div>
            
            {/* Text Content */}
            <div className="flex-1 pr-6">
              <h4 className="text-sm font-extrabold text-slate-900 tracking-tight uppercase mb-1">Erreur de connexion</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{error}</p>
            </div>
            
            {/* Close button with interactive scale/rotate */}
            <button 
              type="button"
              onClick={() => setShowToast(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:scale-110 active:scale-95 transition-all size-6 flex items-center justify-center rounded-lg hover:bg-slate-50"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          
          {/* Progress bar at the bottom */}
          {showToast && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
              <div className="h-full bg-gradient-to-r from-red-500 to-rose-600 animate-toast-progress"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
