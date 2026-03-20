# API Endpoints Documentation - LOQT

## Base URL
```
https://sglci.sajholding.org
```

## Authentification
- Session Cookie pour web
- Token JWT pour mobile/SPA
- Headers requis: `Content-Type: application/json`, `X-CSRFToken`

### Endpoints d'Authentification
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/auth/login/` | Connexion utilisateur (API JSON) |
| POST | `/api/auth/register/` | Inscription nouvel utilisateur (API JSON) |
| POST | `/api/auth/logout/` | Déconnexion utilisateur (API JSON) |
| POST | `/connexion/` | Connexion utilisateur (Formulaire web) |
| POST | `/inscription/` | Inscription nouvel utilisateur (Formulaire web) |
| POST | `/deconnexion/` | Déconnexion utilisateur (Formulaire web) |
| GET | `/confirmation-deconnexion/` | Page confirmation déconnexion |

### Exemple d'utilisation (React)
```javascript
// Connexion API
const login = async (email, password) => {
  try {
    const response = await axios.post('https://sglci.sajholding.org/api/auth/login/', {
      user: email,
      password: password
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Inscription API
const register = async (userData) => {
  try {
    const response = await axios.post('https://sglci.sajholding.org/api/auth/register/', userData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Déconnexion API
const logout = async () => {
  try {
    const response = await axios.post('https://sglci.sajholding.org/api/auth/logout/', {}, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Dashboard Realtime API
const getRealtimeData = async () => {
  try {
    const response = await axios.get('https://sglci.sajholding.org/api/dashboard/realtime/', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Matériels List API
const getMateriels = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams(params).toString();
    const response = await axios.get(`https://sglci.sajholding.org/api/materiels/?${queryParams}`, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Categories List API
const getCategories = async () => {
  try {
    const response = await axios.get('https://sglci.sajholding.org/api/categories/', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Permission Request API
const requestPermission = async (reason, actionType, materielId = null) => {
  try {
    const response = await axios.post('https://sglci.sajholding.org/api/permissions/request/', {
      reason: reason,
      action_type: actionType,
      materiel_id: materielId
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Permission Status API
const getPermissionStatus = async () => {
  try {
    const response = await axios.get('https://sglci.sajholding.org/api/permissions/status/', {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

### Format des données
**Connexion :**
```json
{
  "user": "email@exemple.com",
  "password": "motdepasse",
  "remember_me": true
}
```

**Inscription :**
```json
{
  "email": "email@exemple.com",
  "password": "motdepasse",
  "first_name": "Prénom",
  "last_name": "Nom",
  "phone": "+22500000000",
  "role": "pasteur"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "email": "email@exemple.com",
    "first_name": "Prénom",
    "last_name": "Nom",
    "role": "pasteur"
  }
}
```

**Réponse Categories :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nom": "Équipement vidéo",
      "description": "Projecteurs, écrans, etc.",
      "sous_categories": [
        {"id": 1, "nom": "Projecteurs", "description": "Différents types de projecteurs"},
        {"id": 2, "nom": "Écrans", "description": "Écrans de projection"}
      ]
    }
  ]
}
```

**Réponse Permission Request :**
```json
{
  "success": true,
  "message": "Demande de permission envoyée avec succès",
  "request_id": 1
}
```

**Réponse Permission Status :**
```json
{
  "success": true,
  "status": "pending",
  "request_date": "2026-02-07T10:00:00",
  "reason": "J'ai besoin de créer du matériel pour l'événement",
  "action_type": "create"
}
```

**Statuts possibles :**
- `none` : Aucune demande trouvée
- `pending` : En attente de validation
- `approved` : Approuvée (permissions accordées)
- `rejected` : Rejetée (demande refusée)

**Réponse Dashboard Stats :**
```json
{
  "success": true,
  "stats": {
    "eglises_count": 15,
    "evenements_count": 25,
    "materiels_count": 150,
    "membres_count": 45,
    "camp_count": 8,
    "nb_regions": 20,
    "nb_villes": 1,
    "nb_responsables_logistique": 5,
    "nb_pasteurs": 12
  },
  "materiel_stats": [
    {"categorie__nom": "Sonorisation", "total": 25, "count": 8},
    {"categorie__nom": "Éclairage", "total": 30, "count": 12}
  ],
  "events_stats": [
    {"type_evenement": "camp", "count": 15},
    {"type_evenement": "conference", "count": 10}
  ],
  "eglises_by_region": [
    {"nom": "ABIDJAN", "nb_eglises": 5},
    {"nom": "BASSE-CÔTE", "nb_eglises": 3}
  ],
  "upcoming_camps": [
    {
      "id": 1,
      "titre": "Camp Mondial 2026",
      "date_debut": "2026-08-05",
      "date_fin": "2026-08-08",
      "lieu": "Yamoussoukro"
    }
  ]
}
```

**Réponse Dashboard Realtime :**
```json
{
  "success": true,
  "realtime_data": {
    "recent_events": 5,
    "new_materiels": 12,
    "new_eglises": 3,
    "low_stock_items": 2,
    "today_events": 1,
    "events_growth_rate": 15.5,
    "last_updated": "2026-02-07T10:00:56.458229"
  }
}
```

---

## 🏢 ÉGLISES

### Endpoints
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/eglises/` | Lister les églises |
| GET | `/eglises/{id}/` | Détail d'une église |
| POST | `/eglises/ajouter/` | Créer une église |
| PUT/PATCH | `/eglises/{id}/modifier/` | Modifier une église |
| DELETE | `/eglise/{id}/delete/` | Supprimer une église |
| GET | `/eglises/export/{format}/` | Exporter (excel/pdf/word) |

### Modèle Église
```python
class Eglise(models.Model):
    nom = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, unique=True)
    image = models.ImageField(upload_to='eglises/')
    pays = models.CharField(max_length=100, default='Côte d\'Ivoire')
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)
    region = models.ForeignKey(Region, on_delete=models.CASCADE)
    ville = models.ForeignKey(Ville, on_delete=models.CASCADE)
    pasteur = models.OneToOneField(User, on_delete=models.SET_NULL)
    logo = models.ImageField(upload_to='logos_eglises/')
```

---

## 📦 MATÉRIEL

### Endpoints Dashboard (API JSON)
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/dashboard/stats/` | Statistiques générales du dashboard |
| GET | `/api/dashboard/realtime/` | Données en temps réel du dashboard |

### Endpoints Matériels (API JSON)
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/materiels/` | Lister les matériels avec pagination et filtrage |
| GET | `/api/categories/` | Lister les catégories et sous-catégories |

### Endpoints Permissions (API JSON)
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/permissions/request/` | Demander une permission (nécessite authentification) |
| GET | `/api/permissions/status/` | Vérifier le statut de sa permission |
| POST | `/materiel/ajouter/` | Créer du matériel |
| PUT/PATCH | `/materiels/{id}/update/` | Modifier matériel |
| DELETE | `/materiels/{id}/delete/` | Supprimer (corbeille) |
| POST | `/materiels/{id}/restore/` | Restaurer matériel |
| POST | `/materiels/{id}/restore/delete-finally/` | Supprimer définitivement |
| GET | `/api/materiel-stats/` | Statistiques matériel |
| GET | `/get_sous_categories/` | Sous-catégories dynamiques |
| POST | `/materiels/export/` | Exporter Excel |
| POST | `/materiels/demande-permission/` | Demander permission |

### Modèle Materiel
```python
class Materiel(models.Model):
    nom = models.CharField(max_length=100)
    categorie = models.ForeignKey(CategorieMateriel, on_delete=models.SET_NULL)
    sous_categorie = models.ForeignKey(SousCategorieMateriel, on_delete=models.CASCADE)
    quantite = models.PositiveIntegerField()
    image = models.ImageField(upload_to='materiels/')
    description = models.TextField()
    logistique = models.ForeignKey(Logistique, on_delete=models.CASCADE)
    eglise = models.ForeignKey(Eglise, on_delete=models.CASCADE)
    is_deleted = models.BooleanField(default=False)
    slug = models.SlugField(unique=True)
    qr_code = models.ImageField(upload_to='qr_codes/')
    code_barre = models.ImageField(upload_to='barcodes/')
    created_at = models.DateTimeField(auto_now_add=True)
```

### Modèles associés
```python
class CategorieMateriel(models.Model):
    nom = models.CharField(max_length=100)

class SousCategorieMateriel(models.Model):
    categorie = models.ForeignKey(CategorieMateriel, on_delete=models.CASCADE)
    nom = models.CharField(max_length=100)

class MaterielImage(models.Model):
    materiel = models.ForeignKey(Materiel, related_name='images_materiel')
    image = models.ImageField(upload_to='materiel/images/')
    description = models.CharField(max_length=255)
```

---

## 📅 ÉVÉNEMENTS

### Endpoints
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/evenements/` | Tableau de bord |
| GET | `/evenements/calendar/` | Calendrier |
| GET | `/evenements/list/` | Liste des événements |
| POST | `/evenements/create/` | Créer événement |
| GET | `/evenements/{id}/` | Détail événement |
| PUT/PATCH | `/evenements/{id}/update/` | Modifier événement |
| DELETE | `/evenements/{id}/delete/` | Supprimer événement |
| POST | `/evenements/{event_pk}/participants/ajouter/` | Ajouter participant |
| DELETE | `/evenements/{event_id}/participants/{participant_pk}/supprimer/` | Supprimer participant |
| POST | `/evenements/{event_id}/inviter/` | Inviter participants |
| POST | `/evenements/{event_pk}/materiel/ajouter/` | Ajouter matériel |
| PUT/PATCH | `/evenements/materiel/{pk}/modifier/` | Modifier matériel événement |
| DELETE | `/evenements/materiel/{pk}/supprimer/` | Supprimer matériel événement |
| POST | `/evenements/{event_pk}/chronogramme/ajouter/` | Ajouter chronogramme |
| PUT/PATCH | `/evenements/chronogramme/{pk}/modifier/` | Modifier chronogramme |
| DELETE | `/evenements/chronogramme/{pk}/supprimer/` | Supprimer chronogramme |
| POST | `/evenements/{event_pk}/chronogram/items/reorder/` | Réorganiser chronogramme |
| PUT | `/evenements/api/events/{pk}/update_date/` | Mettre à jour date (drag-drop) |
| GET/POST | `/evenements/api/` | API REST (ViewSet) |

### Modèle Evenement
```python
class Evenement(models.Model):
    titre = models.CharField(max_length=200)
    type_evenement = models.CharField(max_length=20, choices=[
        ('seminaire', 'Séminaire'),
        ('conference', 'Conférence'),
        ('culte', 'Culte Spécial'),
        ('concert', 'Concert'),
        ('camp', 'Camp Mondial'),
        ('autre', 'Autre')
    ])
    organisateur_type = models.CharField(max_length=20, choices=[
        ('eglise', 'Église'),
        ('externe', 'Entité Externe')
    ])
    lieu = models.CharField(max_length=200)
    organisateur_nom = models.CharField(max_length=100)
    eglise = models.ForeignKey('Eglise', on_delete=models.SET_NULL)
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField()
    description = models.TextField()
    chronogramme = models.JSONField(default=list)
    logisticiens_gestion = models.ManyToManyField(User)
    materiels_utilises = models.ManyToManyField('Materiel', through='EvenementMateriel')
    image = models.ImageField(upload_to='evenements/')
    statut = models.CharField(max_length=20, default='en_attente')
```

### Modèles associés
```python
class EvenementMateriel(models.Model):
    evenement = models.ForeignKey('Evenement', on_delete=models.CASCADE)
    materiel = models.ForeignKey('Materiel', on_delete=models.CASCADE)
    quantite = models.PositiveIntegerField()
    date_ajout = models.DateTimeField(auto_now_add=True)
    ajoute_par = models.ForeignKey(User, on_delete=models.SET_NULL)

class ChronogrammeItem(models.Model):
    evenement = models.ForeignKey('Evenement', on_delete=models.CASCADE)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    titre = models.CharField(max_length=100)
    description = models.TextField()
    responsable = models.CharField(max_length=100)
    materiels_needed = models.ManyToManyField('Materiel')
    cree_par = models.ForeignKey(User, on_delete=models.SET_NULL)
```

---

## 🌍 VILLES & RÉGIONS

### Endpoints
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/villes/` | Lister les villes |
| POST | `/villes/ajouter/` | Créer une ville |
| PUT/PATCH | `/villes/{id}/modifier/` | Modifier ville |
| DELETE | `/villes/{id}/supprimer/` | Supprimer ville |
| GET | `/regions/` | Lister les régions |
| GET | `/regions/{id}/` | Détail région |
| POST | `/regions/ajouter/` | Créer région |
| PUT/PATCH | `/regions/{id}/modifier/` | Modifier région |
| DELETE | `/regions/{id}/supprimer/` | Supprimer région |
| GET | `/api/regions/export/` | Exporter régions |

### Modèles
```python
class Region(models.Model):
    nom = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

class Ville(models.Model):
    nom = models.CharField(max_length=100)
    region = models.ForeignKey(Region, on_delete=models.CASCADE)
```

---

## 🏕️ CAMPS

### Endpoints
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/camps/` | Lister les camps |
| GET | `/camps/{id}/` | Détail camp |
| POST | `/camps/ajouter/` | Créer camp |

### Modèles
```python
class CampMondial(models.Model):
    titre = models.CharField(max_length=150)
    ville = models.ForeignKey(Ville, on_delete=models.CASCADE)
    date_debut = models.DateField()
    date_fin = models.DateField()
    description = models.TextField()
    renfort_national = models.BooleanField(default=False)
    image = models.ImageField(upload_to='camps/')

class CampMateriel(models.Model):
    camp = models.ForeignKey(CampMondial, on_delete=models.CASCADE)
    materiel = models.ForeignKey('Materiel', on_delete=models.CASCADE)
    quantite_utilisee = models.PositiveIntegerField()
    date_utilisation = models.DateField(auto_now=True)
```

---

## 👥 UTILISATEURS & LOGISTIQUE

### Modèles
```python
class Logistique(models.Model):
    eglise = models.OneToOneField(Eglise, on_delete=models.CASCADE)
    responsable = models.OneToOneField(User, on_delete=models.SET_NULL)

class MembreLogistique(models.Model):
    utilisateur = models.OneToOneField(User, on_delete=models.CASCADE)
    logistique = models.ForeignKey(Logistique, on_delete=models.CASCADE)

class DemandePermission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission_demande = models.CharField(max_length=100)
    raison = models.TextField()
    statut = models.CharField(max_length=20, default='en_attente')
    date_demande = models.DateTimeField(auto_now_add=True)
```

---

## 📊 STATISTIQUES

### Endpoints disponibles
- `/api/materiel-stats/` : Statistiques du matériel
- `/api/regions/export/` : Export des régions

---

## 🔧 UTILISATION AVEC REACT

### Exemple de configuration
```javascript
const API_BASE_URL = 'https://votre-domaine.com';

// Configuration Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-CSRFToken': getCookie('csrftoken')
  },
  withCredentials: true
});

// Intercepteur pour authentification
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Exemples d'appels
```javascript
// Lister le matériel
const getMateriels = async (filters = {}) => {
  const response = await api.get('/materiels/', { params: filters });
  return response.data;
};

// Créer un événement
const createEvent = async (eventData) => {
  const response = await api.post('/evenements/create/', eventData);
  return response.data;
};

// Upload d'images
const uploadImages = async (materielId, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('images', file));
  
  const response = await api.post(`/materiel/ajouter/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
```

---

## 📝 NOTES IMPORTANTES

1. **Pagination** : La plupart des listes utilisent la pagination Django
2. **Permissions** : Vérifiez les droits d'accès pour chaque endpoint
3. **Validation** : Les formulaires incluent une validation côté serveur
4. **Uploads** : Utilisez `multipart/form-data` pour les fichiers
5. **Timezone** : Les dates sont en UTC, convertissez selon le besoin
6. **Soft Delete** : Le matériel utilise `is_deleted` au lieu d'une suppression réelle

Pour plus de détails techniques, consultez les fichiers modèles dans `logistque/models.py`.
