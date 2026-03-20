import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const resetMutation = useMutation({
    mutationFn: (email) => authService.requestPasswordReset(email),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    resetMutation.mutate(email);
  };

  if (submitted) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-screen flex items-center justify-center px-4">
        <div className="max-w-[480px] w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="size-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">mark_email_read</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Email envoyé !</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Si un compte est associé à <strong>{email}</strong>, vous recevrez un lien pour réinitialiser votre mot de passe d'ici quelques instants.
          </p>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 text-primary font-bold hover:underline">
            <span className="material-symbols-outlined">arrow_back</span>
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display antialiased">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-10 md:py-20 px-4">
          <div className="layout-content-container flex flex-col w-full max-w-[480px] flex-1 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 transition-all">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-100 dark:border-slate-800 pb-6 mb-8">
              <div className="flex items-center gap-3 text-slate-900 dark:text-slate-100">
                <div className="text-primary">
                  <span className="material-symbols-outlined text-3xl">local_shipping</span>
                </div>
                <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">SGL-CI</h2>
              </div>
              <Link to="/login" className="flex size-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </Link>
            </header>

            <div className="flex flex-col gap-2 mb-8 text-center md:text-left">
              <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold leading-tight tracking-tight">Mot de passe oublié</h1>
              <p className="text-slate-500 dark:text-slate-400 text-base font-normal">Pas de soucis, ça arrive. Entrez votre email pour recevoir un lien de réinitialisation.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold leading-normal" htmlFor="email">
                  Adresse Email
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" style={{ fontSize: '20px' }}>mail</span>
                  <input 
                    className="form-input flex w-full pl-11 pr-4 py-3.5 rounded-xl text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-base" 
                    id="email" 
                    name="email" 
                    placeholder="ex: jean.dupont@sgl-ci.org" 
                    required 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <button 
                  className="flex w-full items-center justify-center rounded-xl h-14 bg-primary hover:bg-primary/90 text-white text-base font-bold leading-normal tracking-wide transition-all shadow-lg shadow-primary/20 disabled:opacity-70" 
                  type="submit"
                  disabled={resetMutation.isPending}
                >
                  <span>{resetMutation.isPending ? 'Envoi en cours...' : 'Envoyer le lien'}</span>
                </button>
                <Link to="/login" className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-semibold group">
                  <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1" style={{ fontSize: '18px' }}>arrow_back</span>
                  <span>Retour à la connexion</span>
                </Link>
              </div>
            </form>
            <footer className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-slate-400 dark:text-slate-500 text-xs italic">
                © 2024 SGL-CI. Tous droits réservés.
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
