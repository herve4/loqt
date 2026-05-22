
import { Material, EventLogistics, Church, City } from './types';

export const IVORY_COAST_REGIONS = [
  "Lagunes", "Lacs", "Gbêkê", "San-Pédro", "Poro", "Haut-Sassandra", "Tonkpi", 
  "Gôh", "Nawa", "Indénié-Djuablin", "Sud-Comoé", "Hambol", "Gontougo"
];

export const MOCK_CITIES: City[] = [
  { name: "Abidjan", region: "Lagunes" },
  { name: "Yamoussoukro", region: "Lacs" },
  { name: "Bouaké", region: "Gbêkê" },
  { name: "San-Pédro", region: "San-Pédro" },
  { name: "Korhogo", region: "Poro" },
  { name: "Daloa", region: "Haut-Sassandra" },
  { name: "Man", region: "Tonkpi" },
  { name: "Gagnoa", region: "Gôh" },
];

export const MOCK_CHURCHES: Church[] = [
  { id: 'c1', name: "Temple de la Victoire (Riviera)", city: "Abidjan", region: "Lagunes", pastor: "Jean Koffi", memberCount: 1200, logisticsLead: "Marc Traoré" },
  { id: 'c2', name: "Église Bethesda", city: "Bouaké", region: "Gbêkê", pastor: "Paul N'Guessan", memberCount: 450, logisticsLead: "Simon Bamba" },
  { id: 'c3', name: "Arche de l'Alliance", city: "San-Pédro", region: "San-Pédro", pastor: "Pierre Kouassi", memberCount: 300, logisticsLead: "Lucie Yao" },
  { id: 'c4', name: "Temple de l'Espérance", city: "Yamoussoukro", region: "Lacs", pastor: "Amon Kouamé", memberCount: 600, logisticsLead: "Franck Esso" },
];

export const MOCK_MATERIALS: Material[] = [
  { 
    id: 1, 
    nom: 'Projecteur Epson 4K', 
    categorie: { id: 1, nom: 'Équipement AV' }, 
    sous_categorie: { id: 1, nom: 'Vidéo' }, 
    logistique: { id: 1, responsable: 'Média' }, 
    quantite: 12, 
    eglise: { id: 1, nom: 'Temple Riviera', ville: 'Abidjan', region: 'Lagunes' },
    description: 'Vidéoprojecteur haute définition pour grandes salles.',
    images_materiel: [
      { id: 101, image: 'https://picsum.photos/seed/p1/400/300', description: 'Vue face' },
      { id: 102, image: 'https://picsum.photos/seed/p1-2/400/300', description: 'Détail' }
    ],
    is_deleted: false,
    created_at: '2023-10-01T10:00:00Z',
    updated_at: '2023-10-01T10:00:00Z'
  },
  { 
    id: 2, 
    nom: 'Enceinte JBL PRX 800', 
    categorie: { id: 2, nom: 'Audio' }, 
    sous_categorie: { id: 2, nom: 'Sonorisation' }, 
    logistique: { id: 2, responsable: 'Son' }, 
    quantite: 8, 
    eglise: { id: 1, nom: 'Temple Riviera' },
    description: 'Enceinte active 1500W.',
    images_materiel: [{ id: 103, image: 'https://picsum.photos/seed/s1/400/300' }],
    is_deleted: false,
    created_at: '2023-10-15T10:00:00Z',
    updated_at: '2023-10-15T10:00:00Z'
  },
  { 
    id: 3, 
    nom: 'Écran LED P3.9', 
    categorie: { id: 3, nom: 'Visuel' }, 
    sous_categorie: { id: 3, nom: 'Écrans Géants' }, 
    logistique: { id: 1, responsable: 'Média' }, 
    quantite: 40, 
    eglise: { id: 2, nom: 'Église Bethesda', ville: 'Bouaké' },
    description: 'Dalles LED pour affichage extérieur/intérieur.',
    images_materiel: [{ id: 104, image: 'https://picsum.photos/seed/l1/400/300' }],
    is_deleted: false,
    created_at: '2023-09-20T10:00:00Z',
    updated_at: '2023-09-20T10:00:00Z'
  }
];

export const CATEGORIES = ['Équipement AV', 'Audio', 'Visuel', 'Scène', 'Mobilier', 'Éclairage'];
export const SUB_CATEGORIES_DATA = [
  { id: 1, nom: 'Vidéo', categorie_id: 1 },
  { id: 2, nom: 'Sonorisation', categorie_id: 2 },
  { id: 3, nom: 'Écrans Géants', categorie_id: 3 },
  { id: 4, nom: 'Structure', categorie_id: 4 },
];

export const MOCK_EVENTS: EventLogistics[] = [
  { id: 'ev1', title: 'Convention Nationale 2024', startDate: '2024-08-12', endDate: '2024-08-18', location: 'Stade Ebimpé', status: 'planned', materials: ['1', '2'], attendees: 25000, description: 'Rassemblement annuel de toutes les églises de Côte d\'Ivoire.' },
  { id: 'ev2', title: 'Séminaire des Responsables', startDate: '2024-06-05', endDate: '2024-06-07', location: 'Hôtel Président Yamoussoukro', status: 'planned', materials: ['1'], attendees: 400, description: 'Formation intensive pour les leaders locaux.' },
];
