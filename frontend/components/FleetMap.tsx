
import React, { useEffect, useRef } from 'react';

const FleetMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const map = L.map(mapRef.current).setView([48.8566, 2.3522], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    const locations = [
      { pos: [48.8566, 2.3522], label: 'Hub Central - Paris' },
      { pos: [45.7640, 4.8357], label: 'Entrepôt Sud - Lyon' },
      { pos: [44.8378, -0.5792], label: 'Centre Logistique - Bordeaux' },
    ];

    const blueIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    locations.forEach(loc => {
      L.marker(loc.pos, {icon: blueIcon}).addTo(map).bindPopup(`<div class="font-bold text-slate-900">${loc.label}</div>`);
    });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Suivi de la Flotte & des Actifs</h1>
        <p className="text-slate-500">Géolocalisation en direct des entrepôts et des véhicules de transport actifs.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 h-[600px] bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-800 p-2">
          <div ref={mapRef} className="w-full h-full rounded-[2.2rem]" />
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-800">
            <h3 className="font-black text-white mb-6 uppercase tracking-tighter text-lg italic">Expéditions Actives</h3>
            <div className="space-y-4">
              {[
                { id: 'TR-902', from: 'Paris', to: 'Lyon', status: 'En Transit', progress: 65, color: 'bg-blue-600' },
                { id: 'TR-114', from: 'Bordeaux', to: 'Paris', status: 'Chargement', progress: 10, color: 'bg-amber-600' },
                { id: 'TR-882', from: 'Marseille', to: 'Lyon', status: 'Arrivé', progress: 100, color: 'bg-emerald-600' },
              ].map(shipment => (
                <div key={shipment.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all group">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-blue-500 uppercase tracking-widest">{shipment.id}</span>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                      shipment.status === 'Arrivé' ? 'bg-emerald-600/20 text-emerald-400' : 
                      shipment.status === 'Chargement' ? 'bg-amber-600/20 text-amber-400' : 
                      'bg-blue-600/20 text-blue-400'
                    }`}>
                      {shipment.status}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">{shipment.from} <span className="text-slate-600 mx-1">→</span> {shipment.to}</p>
                  <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${shipment.color} rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]`} style={{ width: `${shipment.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 border border-white/10 group">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner border border-white/10 group-hover:scale-110 transition-transform">🛰️</div>
            <h3 className="font-black text-xl mb-3 tracking-tighter uppercase italic">Suivi de Précision</h3>
            <p className="text-xs text-blue-100/70 mb-6 leading-relaxed">Passez à LOQT PRO Connect pour installer des capteurs IoT sur tous vos conteneurs d'équipement.</p>
            <button className="w-full py-3 bg-white text-blue-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0">Améliorer Flotte</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FleetMap;
