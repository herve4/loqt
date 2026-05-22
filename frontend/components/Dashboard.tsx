
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AppView } from '../types';
import { eventService } from '../services/eventService';
import { commonService } from '../services/commonService';
import { materialService } from '../services/materialService';

const chartData = [
  { name: 'Janv', events: 4, rentals: 24, efficiency: 82 },
  { name: 'Févr', events: 3, rentals: 18, efficiency: 85 },
  { name: 'Mars', events: 10, rentals: 45, efficiency: 78 },
  { name: 'Avr', events: 7, rentals: 32, efficiency: 90 },
  { name: 'Mai', events: 12, rentals: 60, efficiency: 88 },
];

interface DashboardProps {
  setActiveView: (view: AppView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const navigate = useNavigate();
  // const [aiInsight, setAiInsight] = useState<{ insights: string[], summary: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([ // fallback pour affichage immédiat
    { label: 'Églises', value: '0', icon: '⛪', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', view: AppView.MAP },
    { label: 'Événements', value: '0', icon: '📅', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', view: AppView.EVENTS },
    { label: 'Matériels', value: '0', icon: '📦', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', view: AppView.INVENTORY },
    { label: 'Membres Logistique', value: '0', icon: '👥', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20', view: AppView.SETTINGS },
    { label: 'Régions', value: '0', icon: '🗺️', color: 'bg-sky-500/10 text-sky-500 border-sky-500/20', view: AppView.MAP },
  ]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [events, eglises, regions, materielResp] = await Promise.all([
          eventService.getUpcomingEvents(),
          commonService.getEglises(),
          commonService.getRegions(),
          materialService.getMateriels(),
        ]);
        setUpcomingEvents(events);

        setStats([
          { label: 'Églises', value: eglises?.length?.toString() ?? '0', icon: '⛪', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', view: AppView.MAP },
          { label: 'Événements', value: events?.length?.toString() ?? '0', icon: '📅', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', view: AppView.EVENTS },
          { label: 'Matériels', value: materielResp?.count?.toString() ?? materielResp?.results?.length?.toString() ?? '0', icon: '📦', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', view: AppView.INVENTORY },
          { label: 'Membres Logistique', value: '1 205', icon: '👥', color: 'bg-violet-500/10 text-violet-500 border-violet-500/20', view: AppView.SETTINGS },
          { label: 'Régions', value: regions?.length?.toString() ?? '0', icon: '🗺️', color: 'bg-sky-500/10 text-sky-500 border-sky-500/20', view: AppView.MAP },
        ]);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight italic">LOQT <span className="text-blue-500 not-italic">OPÉRATIONS</span></h1>
          <p className="text-slate-400">Télémétrie en temps réel et gestion des ressources logistiques.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            SYSTÈME EN DIRECT
          </div>
          <button className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl shadow-sm hover:bg-slate-800 hover:border-slate-700 transition-all text-slate-200 font-semibold text-sm">Télécharger les analyses</button>
        </div>
      </header>

      {/* Stats Grid - 8 items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          // Map AppView to route
          let route = '/';
          switch (stat.view) {
            case AppView.DASHBOARD:
              route = '/'; break;
            case AppView.INVENTORY:
              route = '/inventory'; break;
            case AppView.EVENTS:
              route = '/events'; break;
            case AppView.MAP:
              route = '/map'; break;
            case AppView.CHURCHES:
              route = '/churches'; break;
            case AppView.SETTINGS:
              route = '/settings'; break;
            default:
              route = '/';
          }
          return (
            <button
              key={i}
              onClick={() => { setActiveView(stat.view); navigate(route); }}
              className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 group hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 text-left w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer active:scale-95"
              tabIndex={0}
              aria-label={`Voir la liste des ${stat.label}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 ${stat.color} border rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <span className="text-[10px] font-black text-slate-600 group-hover:text-blue-500 transition-colors uppercase tracking-widest">
                  Voir liste ➔
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500 truncate">{stat.label}</p>
              <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
            </button>
          );
        })}
        {/* ...existing code... */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Chart */}
          <div className="bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-800">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-white">Distribution des Ressources</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/20">Locations</button>
                <button className="px-3 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded-lg hover:bg-slate-700 hover:text-slate-200">Revenus</button>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRentals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#60a5fa' }}
                  />
                  <Area type="monotone" dataKey="rentals" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRentals)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Feed Simulation */}
          <div className="bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6">Flux d'Activité en Direct</h3>
            <div className="space-y-6">
              {[
                { time: 'il y a 2m', user: 'Système', text: 'Auto-équilibrage de l\'inventaire à l\'Entrepôt A', icon: '⚙️' },
                { time: 'il y a 15m', user: 'Alex', text: 'Sortie de "Système Audio JBL X" pour Tech Summit', icon: '🔊' },
                { time: 'il y a 1h', user: 'Hub IoT', text: 'Alerte maintenance : Durée de vie lampe Projecteur 4K à 5%', icon: '⚠️' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-lg border border-slate-700 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all duration-300">
                    {item.icon}
                  </div>
                  <div className="flex-1 border-b border-slate-800 pb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{item.user}</span>
                      <span className="text-xs text-slate-500">{item.time}</span>
                    </div>
                    <p className="text-slate-200 font-medium group-hover:text-white transition-colors">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-950 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-500/20 transition-all duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner border border-white/10">✨</div>
                <h3 className="text-xl font-black tracking-tight uppercase">Veille Opérationnelle</h3>
              </div>
              {loading ? (
                <div className="space-y-4">
                  <div className="h-4 bg-white/10 rounded-full animate-pulse w-3/4"></div>
                  <div className="h-4 bg-white/10 rounded-full animate-pulse w-full"></div>
                  <div className="h-4 bg-white/10 rounded-full animate-pulse w-5/6"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  <h4 className="text-lg font-bold text-white text-center">Suivi des événements en temps réel</h4>
                  {upcomingEvents.filter(ev => ev.status === 'ongoing').length === 0 ? (
                    <div className="text-slate-400 italic text-sm text-center py-8">
                      Aucun événement en cours actuellement.
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {upcomingEvents.filter(ev => ev.status === 'ongoing').map(ev => (
                        <li key={ev.id} className="bg-slate-800/60 rounded-xl p-4 flex flex-col gap-1 border border-blue-900/20">
                          <span className="font-bold text-blue-400">{ev.title || ev.nom}</span>
                          <span className="text-xs text-slate-400">Lieu : {ev.location || ev.lieu || 'N/A'}</span>
                          <span className="text-xs text-slate-400">Début : {ev.startDate || ev.date_debut}</span>
                          {ev.endDate || ev.date_fin ? <span className="text-xs text-slate-400">Fin : {ev.endDate || ev.date_fin}</span> : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6">Santé Opérationnelle</h3>
            <div className="space-y-6">
              {[
                { label: 'Capacité d\'Entrepôt', value: 78, color: 'bg-blue-500' },
                { label: 'Fiabilité des Actifs', value: 94, color: 'bg-emerald-500' },
                { label: 'Disponibilité Staff', value: 45, color: 'bg-amber-500' },
              ].map((bar, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-slate-500 uppercase tracking-tighter text-[10px]">{bar.label}</span>
                    <span className="text-slate-300">{bar.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${bar.color} rounded-full transition-all duration-1000`} style={{ width: `${bar.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
