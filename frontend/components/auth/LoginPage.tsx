import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SGLCI_LOGO = (
    <svg viewBox="0 0 320 80" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
        <g fill="white">
            <path d="M38,14 L42,14 L43.5,20.5 C45.5,21.3 47.4,22.4 49,23.7 L55.5,21.5 L59.5,27.5 L54.5,32 C54.8,34 54.8,36 54.5,38 L59.5,42.5 L55.5,48.5 L49,46.3 C47.4,47.6 45.5,48.7 43.5,49.5 L42,56 L38,56 L36.5,49.5 C34.5,48.7 32.6,47.6 31,46.3 L24.5,48.5 L20.5,42.5 L25.5,38 C25.2,36 25.2,34 25.5,32 L20.5,27.5 L24.5,21.5 L31,23.7 C32.6,22.4 34.5,21.3 36.5,20.5 Z" />
            <circle cx="40" cy="35" r="8" fill="rgba(30,58,138,0.8)" />
            <text x="40" y="39.5" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif" fill="white" fontStyle="italic">S</text>
        </g>
        <text x="62" y="46" fontSize="32" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" fill="white" letterSpacing="-1">GLCI</text>
        <text x="10" y="70" fontSize="8" fontFamily="Arial, sans-serif" fill="rgba(255,255,255,0.5)" letterSpacing="0.5">Système de gestion de Logistique CI</text>
    </svg>
);

const STATS = [
    { label: 'Églises connectées', value: '120+', icon: '⛪' },
    { label: 'Matériels gérés', value: '5 000+', icon: '📦' },
    { label: 'Membres logistiques', value: '1 200+', icon: '👥' },
    { label: 'Régions couvertes', value: '14', icon: '🗺️' },
];

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login({ username, password });
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Identifiants invalides');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex">

            {/* ── LEFT PANEL — Branding ── */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden flex-col">
                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950" />
                {/* Decorative circles */}
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full border border-blue-500/10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/5 rounded-full border border-blue-500/10" />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />

                <div className="relative z-10 flex flex-col h-full p-12">
                    {/* Logo */}
                    <div>{SGLCI_LOGO}</div>

                    {/* Center content */}
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="max-w-md">
                            <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-4">Plateforme Nationale</p>
                            <h1 className="text-5xl font-black text-white leading-tight mb-6">
                                La logistique<br />
                                <span className="text-blue-400">de l'Église</span><br />
                                centralisée.
                            </h1>
                            <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                Coordonnez les ressources, les équipements et les équipes logistiques de toutes les assemblées de Côte d'Ivoire sur une seule plateforme.
                            </p>
                        </div>

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-4 mt-12 max-w-md">
                            {STATS.map(s => (
                                <div key={s.label} className="bg-white/5 border border-white/5 rounded-2xl p-4 backdrop-blur-sm hover:bg-white/10 transition-all">
                                    <span className="text-2xl">{s.icon}</span>
                                    <p className="text-2xl font-black text-white mt-2 leading-none">{s.value}</p>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        © 2025 SGLCI — Système de Gestion Logistique CI
                    </p>
                </div>
            </div>

            {/* ── RIGHT PANEL — Form ── */}
            <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 bg-slate-950 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl" />

                <div className="w-full max-w-md z-10">
                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8 flex justify-center">
                        <svg viewBox="0 0 320 80" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
                            <g fill="#2563EB">
                                <path d="M38,14 L42,14 L43.5,20.5 C45.5,21.3 47.4,22.4 49,23.7 L55.5,21.5 L59.5,27.5 L54.5,32 C54.8,34 54.8,36 54.5,38 L59.5,42.5 L55.5,48.5 L49,46.3 C47.4,47.6 45.5,48.7 43.5,49.5 L42,56 L38,56 L36.5,49.5 C34.5,48.7 32.6,47.6 31,46.3 L24.5,48.5 L20.5,42.5 L25.5,38 C25.2,36 25.2,34 25.5,32 L20.5,27.5 L24.5,21.5 L31,23.7 C32.6,22.4 34.5,21.3 36.5,20.5 Z" />
                                <circle cx="40" cy="35" r="8" fill="#0f172a" />
                                <text x="40" y="39.5" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial, sans-serif" fill="#2563EB" fontStyle="italic">S</text>
                            </g>
                            <text x="62" y="46" fontSize="32" fontWeight="900" fontFamily="Arial Black, Arial, sans-serif" fill="#2563EB" letterSpacing="-1">GLCI</text>
                        </svg>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">
                            Connexion
                        </h2>
                        <p className="text-slate-500 font-bold text-sm mt-1">Accédez à votre espace logistique</p>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-xs font-bold uppercase tracking-wider text-center mb-6 animate-in zoom-in duration-300">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identifiant</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">👤</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-11 pr-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/30 transition-all placeholder:text-slate-700"
                                    placeholder="jean@eglise.ci"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mot de passe</label>
                                <a href="#" className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors">Oublié ?</a>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors">🔒</span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-11 pr-4 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 focus:border-blue-600/30 transition-all placeholder:text-slate-700"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><span>Se connecter</span><span className="text-lg">→</span></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <p className="text-xs text-slate-600 font-bold">Pas encore de compte ?</p>
                        <Link
                            to="/register"
                            className="inline-block mt-3 text-sm font-black text-blue-500 hover:text-white transition-colors"
                        >
                            Créer un profil SGLCI →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
