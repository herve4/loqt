import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { logisticsService } from '../services/api';

// Correction pour les icônes Leaflet par défaut
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const InteractiveMap = () => {
    const [churches, setChurches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChurches = async () => {
            try {
                const response = await logisticsService.getEglises({ limit: 1000 });
                const data = response.data;
                
                // Gérer les différents formats de réponse (liste directe ou objet avec .results)
                let churchList = [];
                if (Array.isArray(data)) {
                    churchList = data;
                } else if (data && Array.isArray(data.results)) {
                    churchList = data.results;
                } else {
                    console.error("Format de données inattendu pour les églises:", data);
                }

                const validChurches = churchList.filter(c => 
                    c.latitude !== null && 
                    c.latitude !== undefined && 
                    c.longitude !== null && 
                    c.longitude !== undefined
                );
                
                setChurches(validChurches);
            } catch (error) {
                console.error("Erreur lors de la récupération des églises:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChurches();
    }, []);

    if (loading) return <div className="h-full w-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">Chargement de la carte...</div>;

    // Centrer sur la Côte d'Ivoire par défaut
    const position = [7.539989, -5.54708]; 

    return (
        <div className="h-full w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 z-0">
            <MapContainer center={position} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {churches.map((church) => {
                    let logoUrl = church.logo;
                    if (logoUrl && !logoUrl.startsWith('http')) {
                        // Supprimer /api/ de la fin de API_URL pour avoir la base du serveur
                        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/').replace('/api/', '');
                        logoUrl = `${baseUrl}${logoUrl}`;
                    }

                    const customIcon = L.icon({
                        iconUrl: logoUrl || icon,
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32],
                        className: 'rounded-full border-2 border-primary bg-white shadow-sm'
                    });

                    return (
                        <Marker 
                            key={church.id} 
                            position={[church.latitude, church.longitude]}
                            icon={customIcon}
                        >
                            <Popup>
                                <div className="p-1">
                                    <h3 className="font-bold text-primary">{church.nom}</h3>
                                    <p className="text-xs text-slate-500">{church.ville_nom || 'Côte d\'Ivoire'}</p>
                                    <div className="mt-2 text-[10px] uppercase font-bold text-slate-400">Siège National: {church.is_national_hq ? 'Oui' : 'Non'}</div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default InteractiveMap;
