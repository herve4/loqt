import React, { useState, useEffect, useMemo } from 'react';
import { commonService } from '../services/commonService';

const Churches: React.FC = () => {
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');

  useEffect(() => {
    const fetchChurches = async () => {
      try {
        const data = await commonService.getEglises();
        setChurches(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChurches();
  }, []);

  const filtered = churches.filter(c => {
    const matchesSearch = c.nom?.toLowerCase().includes(search.toLowerCase()) || c.ville_nom?.toLowerCase().includes(search.toLowerCase());
    const matchesRegion = selectedRegion === 'All' || c.region_nom === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Églises & Réseau</h1>
          <p className="text-slate-500">Gestion des {churches.length} sites et responsables en Côte d'Ivoire.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-800 transition-all">
            Villes & Régions
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
            + Nouvelle Église
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-4">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Filtrer par Région</h3>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedRegion('All')}
                className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedRegion === 'All' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Toutes les régions
              </button>
              {Array.from(new Set(churches.map((c: any) => c.region_nom).filter(Boolean))).slice(0, 8).map((region: any) => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedRegion === region ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-6 rounded-3xl border border-white/5 shadow-2xl">
            <h4 className="font-black text-white text-sm uppercase italic mb-2">Statistiques Côte d'Ivoire</h4>
            <div className="space-y-4 mt-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs text-white/60">Villes actives</span>
                <span className="text-xl font-black text-white">{Array.from(new Set(churches.map((c: any) => c.ville_nom).filter(Boolean))).length}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs text-white/60">Membres totaux</span>
                <span className="text-xl font-black text-white">1,955</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-4">
          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm mb-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
              <input
                type="text"
                placeholder="Rechercher une église, une ville ou un pasteur..."
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(church => (
              <div key={church.id} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 group hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/10 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">⛪</div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest">{church.region_nom || 'N/A'}</span>
                  </div>
                </div>
                <h3 className="text-xl font-black text-white mb-1 group-hover:text-blue-400 transition-colors">{church.nom}</h3>
                <p className="text-sm font-bold text-slate-400 flex items-center gap-2 mb-4">
                  <span className="text-blue-500">📍</span> {church.ville_nom || 'Ville inconnue'}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pasteur</p>
                    <p className="text-xs font-bold text-slate-200">{church.pasteur || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Responsable Log.</p>
                    <p className="text-xs font-bold text-slate-200">{church.responsable_logistique || '—'}</p>
                  </div>
                  <div className="col-span-2 mt-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 mb-1">
                      <span>Membres actifs</span>
                      <span className="text-white">{church.nombre_membres || '—'}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: '75%' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Churches;
