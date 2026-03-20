# Services API - Frontend React

Ce dossier contient les services API pour la communication entre le frontend React et le backend Django.

## Structure

```
frontend-services/
├── api/
│   ├── index.js              # Configuration principale
│   ├── auth.js              # Services d'authentification
│   ├── dashboard.js         # Services du dashboard
│   ├── materiels.js         # Services des matériels
│   ├── evenements.js        # Services des événements
│   ├── eglises.js          # Services des églises
│   └── utils.js            # Utilitaires communs
├── hooks/
│   ├── useAuth.js          # Hook d'authentification
│   ├── useApi.js           # Hook générique pour les appels API
│   └── useDashboard.js     # Hook du dashboard
└── constants/
    └── endpoints.js        # Constantes des endpoints
```

## Installation

```bash
npm install axios
# ou
yarn add axios
```

## Configuration

La configuration principale se trouve dans `api/index.js` avec l'URL de base du backend.

## Utilisation

```javascript
import { dashboardApi } from '../api';

// Récupérer les statistiques du dashboard
const stats = await dashboardApi.getStats();

// Récupérer les graphiques
const charts = await dashboardApi.getCharts();
```
