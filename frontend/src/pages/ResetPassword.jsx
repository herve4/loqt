import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: (data) => authService.confirmPasswordReset(data),
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    },
    onError: (err) => {
      setError(err.response?.data?.message || "Le lien est invalide ou a expiré.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    resetMutation.mutate({ uid, token, password });
  };

  if (success) {
    return (
      <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex items-center justify-center px-4">
        <div className="max-w-[480px] w-full bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 text-center">
          <div className="size-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Succès !</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
          </p>
          <Link to="/login" className="text-primary font-bold hover:underline">Se connecter maintenant</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display antialiased">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center py-10 md:py-20 px-4">
          <div className="layout-content-container flex flex-col w-full max-w-[480px] flex-1 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <header className="flex items-center justify-center border-b border-solid border-slate-100 dark:border-slate-800 pb-6 mb-8">
              <div className="flex items-center gap-3 text-primary">
                <span className="material-symbols-outlined text-3xl">lock_reset</span>
                <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold">Réinitialisation</h2>
              </div>
            </header>

            <div className="flex flex-col gap-2 mb-8 text-center">
              <h1 className="text-2xl font-extrabold">Nouveau mot de passe</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Choisissez un mot de passe robuste de 8 caractères minimum.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
            )}

            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Nouveau mot de passe</label>
                <input 
                  className="form-input w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none" 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Confirmer le mot de passe</label>
                <input 
                  className="form-input w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary outline-none" 
                  type="password" 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button 
                className="w-full rounded-xl h-14 bg-primary text-white font-bold transition-all shadow-lg hover:bg-primary/90 disabled:opacity-70" 
                type="submit"
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'Réinitialisation...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
