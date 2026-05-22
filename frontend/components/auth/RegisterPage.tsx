import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { commonService } from '../../services/commonService';

const ROLES = [
    { value: 'membre', label: 'Membre', icon: '👤', desc: 'Accès standard aux ressources logistiques' },
    { value: 'responsable', label: 'Responsable', icon: '🛠️', desc: 'Gestion de l\'inventaire et des équipes' },
    { value: 'pasteur', label: 'Pasteur', icon: '✝️', desc: 'Accès administrateur complet' },
];

const STEPS = [
    { id: 1, title: 'Identité' },
    { id: 2, title: 'Profil' },
    { id: 3, title: 'Sécurité' },
];

const RegisterPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState<'forward' | 'back'>('forward');
    const [animating, setAnimating] = useState(false);
    const [churches, setChurches] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', email: '', phone: '',
        role: '', eglise: '', password: '', confirm_password: '', accept_terms: false,
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        commonService.getEglises().then(setChurches).catch(() => { });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const target = e.target as HTMLInputElement;
        const value = target.type === 'checkbox' ? target.checked : target.value;
        setFormData(prev => ({ ...prev, [e.target.name]: value }));
    };

    const goToStep = (next: number) => {
        setDirection(next > step ? 'forward' : 'back');
        setAnimating(true);
        setTimeout(() => { setStep(next); setAnimating(false); }, 280);
    };

    const validateStep = (): boolean => {
        setError('');
        if (step === 1) {
            if (!formData.first_name || !formData.last_name) { setError('Veuillez renseigner votre nom et prénom'); return false; }
            if (!formData.email && !formData.phone) { setError('Email ou téléphone requis'); return false; }
        }
        if (step === 2) {
            if (!formData.role) { setError('Veuillez sélectionner un rôle'); return false; }
        }
        if (step === 3) {
            if (!formData.password || formData.password.length < 8) { setError('Minimum 8 caractères'); return false; }
            if (formData.password !== formData.confirm_password) { setError('Les mots de passe ne correspondent pas'); return false; }
            if (!formData.accept_terms) { setError('Veuillez accepter les conditions d\'utilisation'); return false; }
        }
        return true;
    };

    const handleNext = () => { if (validateStep()) goToStep(step + 1); };
    const handleBack = () => goToStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep()) return;
        setIsLoading(true);
        try {
            await register({
                first_name: formData.first_name,
                last_name: formData.last_name,
                email: formData.email || undefined,
                phone: formData.phone || undefined,
                role: formData.role,
                eglise: formData.eglise ? Number(formData.eglise) : undefined,
                password: formData.password,
                password_confirm: formData.confirm_password, // Correction ici
                accept_terms: formData.accept_terms,
            });
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'inscription');
        } finally {
            setIsLoading(false);
        }
    };

    const slideClass = animating
        ? direction === 'forward' ? 'opacity-0 translate-x-5' : 'opacity-0 -translate-x-5'
        : 'opacity-100 translate-x-0';

    return (
        <div className="min-h-screen bg-slate-950 flex">

            {/* ══ LEFT — Form ══ */}
            <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 bg-slate-950 relative overflow-y-auto">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

                <div className="w-full max-w-md z-10 py-8">

                    {/* Mobile logo */}
                    <div className="lg:hidden mb-8 flex justify-center">
                        <svg viewBox="0 0 320 80" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
                            <g fill="#2563EB">
                                <path d="M38,14 L42,14 L43.5,20.5 C45.5,21.3 47.4,22.4 49,23.7 L55.5,21.5 L59.5,27.5 L54.5,32 C54.8,34 54.8,36 54.5,38 L59.5,42.5 L55.5,48.5 L49,46.3 C47.4,47.6 45.5,48.7 43.5,49.5 L42,56 L38,56 L36.5,49.5 C34.5,48.7 32.6,47.6 31,46.3 L24.5,48.5 L20.5,42.5 L25.5,38 C25.2,36 25.2,34 25.5,32 L20.5,27.5 L24.5,21.5 L31,23.7 C32.6,22.4 34.5,21.3 36.5,20.5 Z" />
                                <circle cx="40" cy="35" r="8" fill="#0f172a" />
                                <text x="40" y="39.5" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial" fill="#2563EB" fontStyle="italic">S</text>
                            </g>
                            <text x="62" y="46" fontSize="32" fontWeight="900" fontFamily="Arial Black, Arial" fill="#2563EB" letterSpacing="-1">GLCI</text>
                        </svg>
                    </div>

                    <div className="mb-5">
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Nouveau compte</h2>
                        <p className="text-slate-500 font-bold text-sm mt-1">Rejoignez le réseau logistique national</p>
                    </div>

                    {/* Step indicators */}
                    <div className="flex items-center gap-2 mb-5">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.id}>
                                <div className={`flex items-center gap-1.5 transition-all duration-500 ${step >= s.id ? 'opacity-100' : 'opacity-30'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${step > s.id ? 'bg-emerald-500 text-white' : step === s.id ? 'bg-blue-600 text-white scale-110 ring-4 ring-blue-600/20' : 'bg-slate-800 text-slate-500'}`}>
                                        {step > s.id ? '✓' : s.id}
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:block ${step === s.id ? 'text-blue-400' : step > s.id ? 'text-emerald-400' : 'text-slate-600'}`}>{s.title}</span>
                                </div>
                                {i < STEPS.length - 1 && <div className={`flex-1 h-px max-w-10 transition-all duration-700 ${step > s.id ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Form card */}
                    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[2rem] shadow-2xl overflow-hidden">
                        <div className="px-7 pt-5 pb-4 border-b border-white/5">
                            <div className={`transition-all duration-300 ${animating ? 'opacity-0 -translate-y-1' : 'opacity-100 translate-y-0'}`}>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-0.5">Étape {step} / {STEPS.length}</p>
                                <h3 className="text-base font-black text-white uppercase italic">
                                    {step === 1 && 'Votre identité'}{step === 2 && 'Votre profil SGLCI'}{step === 3 && 'Accès & sécurité'}
                                </h3>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="px-7 py-5 min-h-[270px]">
                                {error && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-bold text-center mb-4">
                                        ⚠️ {error}
                                    </div>
                                )}
                                <div className={`transition-all duration-280 ease-out space-y-3.5 ${slideClass}`}>

                                    {/* STEP 1 */}
                                    {step === 1 && (
                                        <>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { name: 'first_name', label: 'Nom *', ph: 'Kouamé' },
                                                    { name: 'last_name', label: 'Prénoms *', ph: 'Jean-Marc' },
                                                ].map(f => (
                                                    <div key={f.name} className="space-y-1">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{f.label}</label>
                                                        <input type="text" name={f.name} value={(formData as any)[f.name]} onChange={handleChange}
                                                            className="w-full bg-slate-950 border border-white/5 rounded-xl px-3.5 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-slate-700"
                                                            placeholder={f.ph} autoFocus={f.name === 'first_name'} />
                                                    </div>
                                                ))}
                                            </div>
                                            {[
                                                { name: 'email', type: 'email', label: 'Email', icon: '📧', ph: 'jean@eglise.ci' },
                                                { name: 'phone', type: 'tel', label: 'Téléphone', icon: '📱', ph: '+225 07 00 00 00 00' },
                                            ].map(f => (
                                                <div key={f.name} className="space-y-1">
                                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{f.label}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">{f.icon}</span>
                                                        <input type={f.type} name={f.name} value={(formData as any)[f.name]} onChange={handleChange}
                                                            className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-slate-700"
                                                            placeholder={f.ph} />
                                                    </div>
                                                </div>
                                            ))}
                                            <p className="text-[10px] text-slate-600 text-center">Email ou téléphone requis (au moins l'un)</p>
                                        </>
                                    )}

                                    {/* STEP 2 */}
                                    {step === 2 && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Rôle *</label>
                                                <div className="space-y-2">
                                                    {ROLES.map(r => (
                                                        <button key={r.value} type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, role: r.value }))}
                                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${formData.role === r.value ? 'border-blue-600 bg-blue-600/10 ring-1 ring-blue-600/30' : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'}`}>
                                                            <span className="text-xl">{r.icon}</span>
                                                            <div className="flex-1">
                                                                <p className={`text-xs font-black uppercase ${formData.role === r.value ? 'text-blue-400' : 'text-slate-300'}`}>{r.label}</p>
                                                                <p className="text-[10px] text-slate-600">{r.desc}</p>
                                                            </div>
                                                            {formData.role === r.value && <span className="text-blue-400 font-black">✓</span>}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Église rattachée</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">⛪</span>
                                                    <select name="eglise" value={formData.eglise} onChange={handleChange}
                                                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all appearance-none">
                                                        <option value="">— Sélectionner —</option>
                                                        {churches.map((c: any) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* STEP 3 */}
                                    {step === 3 && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mot de passe *</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">🔒</span>
                                                    <input type="password" name="password" value={formData.password} onChange={handleChange} autoFocus
                                                        className="w-full bg-slate-950 border border-white/5 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all placeholder:text-slate-700"
                                                        placeholder="Minimum 8 caractères" />
                                                </div>
                                                {formData.password && (
                                                    <div className="flex gap-1 mt-1.5">
                                                        {[1, 2, 3, 4].map(lvl => {
                                                            const s = Math.min(4, Math.floor(formData.password.length / 3));
                                                            return <div key={lvl} className={`h-1 flex-1 rounded-full transition-all duration-500 ${lvl <= s ? lvl <= 1 ? 'bg-rose-500' : lvl <= 2 ? 'bg-amber-500' : lvl <= 3 ? 'bg-blue-500' : 'bg-emerald-500' : 'bg-slate-800'}`} />;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmer *</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-sm">🔑</span>
                                                    <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange}
                                                        className={`w-full bg-slate-950 border rounded-xl pl-9 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-2 transition-all placeholder:text-slate-700 ${formData.confirm_password && formData.password !== formData.confirm_password ? 'border-rose-500/50 focus:ring-rose-500/50' : formData.confirm_password && formData.password === formData.confirm_password ? 'border-emerald-500/50 focus:ring-emerald-500/50' : 'border-white/5 focus:ring-blue-600/50'}`}
                                                        placeholder="••••••••" />
                                                    {formData.confirm_password && (
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                                                            {formData.password === formData.confirm_password ? '✅' : '❌'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-800 hover:border-blue-600/30 transition-all">
                                                <div onClick={() => setFormData(prev => ({ ...prev, accept_terms: !prev.accept_terms }))}
                                                    className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${formData.accept_terms ? 'bg-blue-600 border-blue-600' : 'border-slate-600'}`}>
                                                    {formData.accept_terms && <span className="text-white text-xs font-black">✓</span>}
                                                </div>
                                                <span className="text-[11px] text-slate-400 leading-relaxed">
                                                    J'accepte les <span className="text-blue-500 font-bold">conditions d'utilisation</span> du Système de Gestion Logistique CI.
                                                </span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Nav buttons */}
                            <div className="px-7 pb-5 flex gap-3">
                                {step > 1 && (
                                    <button type="button" onClick={handleBack}
                                        className="flex-1 py-3.5 rounded-xl border border-white/10 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-white/5 hover:text-white transition-all">
                                        ← Retour
                                    </button>
                                )}
                                {step < 3 ? (
                                    <button type="button" onClick={handleNext}
                                        className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all">
                                        Suivant →
                                    </button>
                                ) : (
                                    <button type="submit" disabled={isLoading}
                                        className="flex-1 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                        {isLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Créer mon compte</span><span>🚀</span></>}
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="px-7 pb-5 pt-4 text-center border-t border-white/5">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Déjà inscrit ?</p>
                            <Link to="/login" className="inline-block mt-2 text-xs font-black text-blue-500 hover:text-white transition-colors">Se connecter →</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ══ RIGHT — Design Panel ══ */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden flex-col">
                <div className="absolute inset-0 bg-gradient-to-tl from-indigo-950 via-blue-950 to-slate-950" />
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl" />
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />

                <div className="relative z-10 flex flex-col h-full p-12">
                    {/* Logo */}
                    <div>
                        <svg viewBox="0 0 320 80" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
                            <g fill="white">
                                <path d="M38,14 L42,14 L43.5,20.5 C45.5,21.3 47.4,22.4 49,23.7 L55.5,21.5 L59.5,27.5 L54.5,32 C54.8,34 54.8,36 54.5,38 L59.5,42.5 L55.5,48.5 L49,46.3 C47.4,47.6 45.5,48.7 43.5,49.5 L42,56 L38,56 L36.5,49.5 C34.5,48.7 32.6,47.6 31,46.3 L24.5,48.5 L20.5,42.5 L25.5,38 C25.2,36 25.2,34 25.5,32 L20.5,27.5 L24.5,21.5 L31,23.7 C32.6,22.4 34.5,21.3 36.5,20.5 Z" />
                                <circle cx="40" cy="35" r="8" fill="rgba(30,58,138,0.8)" />
                                <text x="40" y="39.5" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial" fill="white" fontStyle="italic">S</text>
                            </g>
                            <text x="62" y="46" fontSize="32" fontWeight="900" fontFamily="Arial Black, Arial" fill="white" letterSpacing="-1">GLCI</text>
                        </svg>
                    </div>

                    <div className="flex-1 flex flex-col justify-center max-w-md">
                        <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.3em] mb-4">En 3 étapes simples</p>
                        <h1 className="text-4xl font-black text-white leading-snug mb-6">
                            Rejoignez <span className="text-indigo-400">1 200+</span><br />
                            membres à travers<br />
                            <span className="text-blue-400">toute la Côte d'Ivoire.</span>
                        </h1>
                        <p className="text-slate-400 text-sm leading-relaxed mb-10">
                            Votre compte vous donne accès à la gestion des équipements, événements et équipes logistiques de toute votre assemblée.
                        </p>

                        {/* Dynamic onboarding steps */}
                        <div className="space-y-3">
                            {[
                                { num: '01', label: 'Identité', desc: 'Nom, prénom, contact' },
                                { num: '02', label: 'Profil SGLCI', desc: 'Rôle et église d\'affiliation' },
                                { num: '03', label: 'Sécurité', desc: 'Mot de passe et conditions' },
                            ].map((item, i) => (
                                <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ${step === i + 1 ? 'border-blue-500/40 bg-blue-600/10' : step > i + 1 ? 'border-emerald-500/20 bg-emerald-600/5' : 'border-white/5 bg-white/[0.02]'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-all ${step > i + 1 ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-600'}`}>
                                        {step > i + 1 ? '✓' : item.num}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black uppercase tracking-wider transition-colors ${step === i + 1 ? 'text-blue-400' : step > i + 1 ? 'text-emerald-400' : 'text-slate-600'}`}>{item.label}</p>
                                        <p className="text-[11px] text-slate-600 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">© 2025 SGLCI — Côte d'Ivoire</p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
