import React, { useState, useEffect } from 'react';
import { suggestEquipmentForEvent } from '../services/geminiService';
import { eventService } from '../services/eventService';

const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventService.getEvents();
      setEvents(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSuggest = async (event: any) => {
    setIsSuggesting(true);
    setAiSuggestion(null);
    try {
      const result = await suggestEquipmentForEvent(event.titre, event.nombre_participants_estime);
      setAiSuggestion(result);
    } catch (err) {
      setAiSuggestion("Impossible de générer des suggestions pour le moment.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleDateClick = (date: string) => {
    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      setDateRange({ start: date, end: null });
    } else {
      if (new Date(date) < new Date(dateRange.start)) {
        setDateRange({ start: date, end: dateRange.start });
      } else {
        setDateRange({ ...dateRange, end: date });
      }
    }
  };

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-8 space-y-6">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">LOQT <span className="text-blue-500 not-italic">PLANNER</span></h1>
            <p className="text-slate-500">Gérez le calendrier logistique national CI.</p>
          </div>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
            + Nouvel Événement
          </button>
        </header>

        {/* Visual Calendar UI */}
        <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Août 2024</h2>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-600 rounded-full"></span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Plage sélectionnée</span>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-700">←</button>
                <button className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:border-slate-700">→</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-slate-600 uppercase tracking-widest pb-6">{day}</div>
            ))}
            {daysInMonth.map(day => {
              const dStr = `2024-08-${day.toString().padStart(2, '0')}`;
              const isEventStart = events.some((e: any) => e.date_debut === dStr);
              const isEventInRange = events.some((e: any) => e.date_fin && dStr >= e.date_debut && dStr <= e.date_fin);

              const isSelectedStart = dateRange.start === dStr;
              const isSelectedEnd = dateRange.end === dStr;
              const isInSelectedRange = dateRange.start && dateRange.end && new Date(dStr) >= new Date(dateRange.start) && new Date(dStr) <= new Date(dateRange.end);

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(dStr)}
                  className={`relative h-24 rounded-2xl border transition-all p-3 text-left group overflow-hidden ${isSelectedStart || isSelectedEnd ? 'border-blue-600 bg-blue-600/20 ring-2 ring-blue-600/50 scale-105 z-10' :
                    isInSelectedRange ? 'border-blue-800 bg-blue-600/10' :
                      isEventStart ? 'border-indigo-500/50 bg-indigo-500/10' :
                        isEventInRange ? 'border-indigo-800 bg-indigo-800/10' :
                          'border-slate-800 bg-slate-950/40 hover:bg-slate-800'
                    }`}
                >
                  <span className={`text-sm font-black ${(isEventStart || isEventInRange) ? 'text-indigo-400' : 'text-slate-500'} group-hover:text-slate-200 transition-colors`}>{day}</span>
                  {(isEventStart || isEventInRange) && (
                    <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-1">
                      <div className="h-1.5 w-full bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]"></div>
                      {isEventStart && <span className="text-[8px] font-bold text-indigo-300 uppercase truncate">Event CI</span>}
                    </div>
                  )}
                  {isInSelectedRange && !isSelectedStart && !isSelectedEnd && (
                    <div className="absolute inset-0 bg-blue-600/5 pointer-events-none"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-4 border-l-2 border-blue-600">Prochaines Missions</h3>
          {events.map((event: any) => (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className={`p-8 rounded-[2rem] border transition-all cursor-pointer group ${selectedEvent?.id === event.id
                ? 'border-blue-600 bg-blue-600/10 ring-1 ring-blue-600 shadow-2xl shadow-blue-900/10'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-xl'
                }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600/10 group-hover:border-blue-500/30 transition-all italic font-black text-blue-500">
                    {event.date_debut?.split('-')[2] || '??'}
                  </div>
                  <div>
                    <h3 className={`text-xl font-bold ${selectedEvent?.id === event.id ? 'text-blue-400' : 'text-slate-100'}`}>{event.titre}</h3>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-black uppercase tracking-widest">
                      <span>📍 {event.lieu || 'Non spécifié'}</span>
                      <span>👥 {event.nombre_participants_estime}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${event.statut === 'EN_COURS' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                  {event.statut}
                </span>
              </div>
              <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed font-medium">{event.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 space-y-6">
        {selectedEvent ? (
          <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-slate-800 sticky top-24 animate-in slide-in-from-right duration-500">
            <h3 className="text-2xl font-black text-white mb-8 uppercase tracking-tighter italic">Flux Logistique</h3>

            <div className="space-y-6 mb-10">
              <div className="p-6 bg-slate-950 rounded-[2rem] border border-slate-800 shadow-inner">
                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-6 border-b border-slate-800 pb-2 italic">Chronologie</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 font-black uppercase">Installation</p>
                      <p className="text-sm font-bold text-slate-200">{selectedEvent.date_debut}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-500 font-black uppercase">Clôture / Repli</p>
                      <p className="text-sm font-bold text-slate-200">{selectedEvent.date_fin || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-950 rounded-[2rem] border border-slate-800 shadow-inner">
                <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-6 border-b border-slate-800 pb-2">Kit Matériel</p>
                <div className="grid grid-cols-2 gap-2">
                  {(selectedEvent.materiels || []).map((mId: any) => (
                    <div key={mId} className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-tight flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Asset #{mId}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSuggest(selectedEvent)}
              disabled={isSuggesting}
              className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSuggesting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Génération en cours...
                </>
              ) : (
                <>✨ Optimiser Configuration</>
              )}
            </button>

            {aiSuggestion && (
              <div className="mt-8 p-8 bg-slate-950 rounded-[2rem] border border-blue-600/20 animate-in fade-in zoom-in duration-500 shadow-2xl shadow-blue-900/10">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                  Intelligence LOQT-Kit
                </p>
                <div className="text-xs text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto scrollbar-hide text-left font-medium">
                  {aiSuggestion}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[600px] bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-[3rem] flex items-center justify-center p-12 text-center text-slate-700 italic flex-col gap-6">
            <span className="text-6xl grayscale opacity-30">🗓️</span>
            <div className="space-y-2">
              <p className="font-black uppercase tracking-widest text-xs">Vue Planning</p>
              <p className="text-sm font-medium">Sélectionnez une mission pour visualiser les contraintes logistiques associées.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
