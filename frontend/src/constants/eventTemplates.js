export const CHRONOGRAM_TEMPLATES = [
    {
        id: 'camp',
        title: 'Camp Régional (IYF)',
        description: 'Programme type pour un camp de plusieurs jours.',
        items: [
            { heure: '05:30 - 06:00', activite: 'RÉVEIL - STRETCHING', responsable: 'Staff RS' },
            { heure: '06:00 - 07:30', activite: 'CLASSE D\'ÉVANGILE', responsable: 'Pasteur' },
            { heure: '07:30 - 08:30', activite: 'PETIT DÉJEUNER + BAIN', responsable: 'Cuisine' },
            { heure: '08:30 - 09:30', activite: 'MIND EDUCATION (RÉFLEXION)', responsable: 'Spécialiste' },
            { heure: '09:30 - 11:30', activite: 'ACADÉMIE (ATELIERS)', responsable: 'Responsables' },
            { heure: '12:30 - 14:00', activite: 'DÉJEUNER', responsable: 'Cuisine' },
            { heure: '16:00 - 17:30', activite: 'CONFÉRENCE-INVITÉ', responsable: 'Invité' },
            { heure: '19:30 - 19:50', activite: 'G. MUSICAL (PRESTATION)', responsable: 'Chorale' },
            { heure: '20:00 - 21:30', activite: 'PRÉDICATION', responsable: 'Pasteur Main' }
        ]
    },
    {
        id: 'party',
        title: 'Alloco Party (Festivité)',
        description: 'Format festif avec prestations et repas.',
        items: [
            { heure: '09:00 - 09:30', activite: 'Accueil et installation', responsable: 'Sécurité' },
            { heure: '09:30 - 09:45', activite: 'Prestation Groupe RS (1er passage)', responsable: 'Groupe RS' },
            { heure: '10:00 - 10:35', activite: 'Présentation des académies', responsable: 'IYF STAFF' },
            { heure: '10:45 - 11:45', activite: 'Conférence Thématique', responsable: 'Orateur' },
            { heure: '11:45 - 12:25', activite: 'Prestations Diverses', responsable: 'Artistes' },
            { heure: '12:25 - 13:15', activite: 'Repas (Alloco Party)', responsable: 'Catering' }
        ]
    },
    {
        id: 'seminaire',
        title: 'Séminaire Standard',
        description: 'Structure classique : Ouverture, Sessions, Pauses.',
        items: [
            { heure: '08:30 - 09:00', activite: 'Accueil / Badge / Café', responsable: 'Hôtesses' },
            { heure: '09:00 - 10:30', activite: 'Session d\'ouverture', responsable: 'Moderateur' },
            { heure: '10:30 - 11:00', activite: 'Pause Café', responsable: 'Logistique' },
            { heure: '11:00 - 13:00', activite: 'Travaux en Commission', responsable: 'Rapporteurs' },
            { heure: '13:00 - 14:30', activite: 'Déjeuner', responsable: 'Catering' },
            { heure: '14:30 - 16:00', activite: 'Restitution & Clôture', responsable: 'Pasteur' }
        ]
    }
];
