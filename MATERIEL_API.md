# API Matériel - Documentation Technique

Cette documentation décrit tous les endpoints API disponibles pour la gestion du matériel dans l'application LOGISTIQUE. Ces endpoints peuvent être utilisés par un frontend moderne (React, Vue.js, Angular, etc.).

## Configuration de l'API

### Base URL
```
https://votre-domaine.com/api/
```

### Authentification
La plupart des endpoints nécessitent une authentification :
- **Session Cookie** : Pour les applications web traditionnelles
- **Token JWT** : Pour les applications mobiles/SPA
- **API Key** : Pour les intégrations externes

### Headers requis
```http
Content-Type: application/json
X-CSRFToken: [token_csrf]  # Pour les requêtes POST/PUT/DELETE
Authorization: Bearer [token]  # Si authentification par token
```

## Endpoints du Matériel

### 1. Liste des matériels

**GET** `/materiels/`

Retourne la liste des matériels accessibles à l'utilisateur connecté.

#### Paramètres de requête (query params)
| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `page` | integer | Numéro de page (pagination) | `?page=2` |
| `searchInput` | string | Recherche par nom | `?searchInput=projecteur` |
| `categorie` | string | Filtre par catégorie | `?categorie=Son` |
| `sous_categorie` | string | Filtre par sous-catégorie | `?sous_categorie=Micro` |
| `logistique` | integer | Filtre par logistique ID | `?logistique=5` |

#### Réponse réussie (200)
```json
{
  "count": 150,
  "next": "https://votre-domaine.com/materiels/?page=3",
  "previous": "https://votre-domaine.com/materiels/?page=1",
  "results": [
    {
      "id": 1,
      "nom": "Projecteur Epson",
      "categorie": {
        "id": 1,
        "nom": "Son"
      },
      "sous_categorie": {
        "id": 3,
        "nom": "Vidéo"
      },
      "quantite": 2,
      "eglise": {
        "id": 5,
        "nom": "Église Centrale"
      },
      "logistique": {
        "id": 2,
        "responsable": "Jean Dupont"
      },
      "description": "Projecteur haute luminosité",
      "images_materiel": [
        {
          "id": 1,
          "image": "https://votre-domaine.com/media/materiels/proj1.jpg",
          "description": ""
        }
      ],
      "qr_code": "https://votre-domaine.com/media/qrcodes/materiel_1.png",
      "code_barre": "https://votre-domaine.com/media/barcodes/materiel_1.png",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    }
  ]
}
```

#### Réponses d'erreur
- **401** : Non authentifié
- **403** : Permissions insuffisantes
- **404** : Page non trouvée

---

### 2. Détail d'un matériel

**GET** `/materiels/{id}/`

Retourne les détails complets d'un matériel spécifique.

#### Paramètres URL
| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | integer | ID du matériel |

#### Réponse réussie (200)
```json
{
  "id": 1,
  "nom": "Projecteur Epson",
  "categorie": {
    "id": 1,
    "nom": "Son"
  },
  "sous_categorie": {
    "id": 3,
    "nom": "Vidéo"
  },
  "quantite": 2,
  "eglise": {
    "id": 5,
    "nom": "Église Centrale",
    "ville": "Paris",
    "region": "Île-de-France"
  },
  "logistique": {
    "id": 2,
    "responsable": {
      "id": 12,
      "username": "jdupont",
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean.dupont@email.com"
    }
  },
  "description": "Projecteur haute luminosité 5000 lumens, parfait pour les grands événements.",
  "images_materiel": [
    {
      "id": 1,
      "image": "https://votre-domaine.com/media/materiels/proj1.jpg",
      "description": "Vue face"
    },
    {
      "id": 2,
      "image": "https://votre-domaine.com/media/materiels/proj2.jpg",
      "description": "Vue arrière"
    }
  ],
  "qr_code": "https://votre-domaine.com/media/qrcodes/materiel_1.png",
  "code_barre": "https://votre-domaine.com/media/barcodes/materiel_1.png",
  "is_deleted": false,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:22:00Z",
  "slug": "projecteur-epson-1"
}
```

#### Réponses d'erreur
- **401** : Non authentifié
- **403** : Permissions insuffisantes
- **404** : Matériel non trouvé

---

### 3. Créer un matériel

**POST** `/materiel/ajouter/`

Crée un nouveau matériel. Supporte les requêtes AJAX pour l'upload d'images.

#### Corps de la requête (JSON)
```json
{
  "nom": "Micro sans fil Shure",
  "categorie": 1,
  "sous_categorie": 2,
  "quantite": 4,
  "eglise": 5,
  "description": "Micro sans fil professionnel avec récepteur"
}
```

#### Upload d'images (multipart/form-data)
Pour ajouter des images lors de la création :
```http
POST /materiel/ajouter/
Content-Type: multipart/form-data

nom: Micro sans fil Shure
categorie: 1
sous_categorie: 2
quantite: 4
eglise: 5
description: Micro sans fil professionnel
images: [fichier_image_1.jpg, fichier_image_2.jpg]
```

#### Réponse réussie (201)
```json
{
  "success": true,
  "materiel_id": 123,
  "id": 123,
  "nom": "Micro sans fil Shure",
  "categorie": {
    "id": 1,
    "nom": "Son"
  },
  "sous_categorie": {
    "id": 2,
    "nom": "Micro"
  },
  "quantite": 4,
  "eglise": {
    "id": 5,
    "nom": "Église Centrale"
  },
  "description": "Micro sans fil professionnel avec récepteur",
  "created_at": "2024-01-25T09:15:00Z",
  "files": [
    {
      "id": 45,
      "url": "https://votre-domaine.com/media/materiels/micro_1.jpg",
      "name": "micro_1.jpg"
    }
  ]
}
```

#### Réponses d'erreur
- **400** : Données invalides
- **401** : Non authentifié
- **403** : Permissions insuffisantes
- **422** : Erreur de validation

---

### 4. Mettre à jour un matériel

**PUT/PATCH** `/materiels/{id}/update/`

Modifie les informations d'un matériel existant.

#### Corps de la requête (JSON)
```json
{
  "nom": "Micro sans fil Shure Pro",
  "categorie": 1,
  "sous_categorie": 2,
  "quantite": 6,
  "eglise": 5,
  "description": "Micro sans fil professionnel avec récepteur amélioré"
}
```

#### Upload d'images supplémentaires
```http
POST /materiels/123/update/
Content-Type: multipart/form-data

images: [nouvelle_image.jpg]
delete_images: [45, 46]  // IDs des images à supprimer
```

#### Réponse réussie (200)
```json
{
  "success": true,
  "id": 123,
  "nom": "Micro sans fil Shure Pro",
  "categorie": {
    "id": 1,
    "nom": "Son"
  },
  "sous_categorie": {
    "id": 2,
    "nom": "Micro"
  },
  "quantite": 6,
  "eglise": {
    "id": 5,
    "nom": "Église Centrale"
  },
  "description": "Micro sans fil professionnel avec récepteur amélioré",
  "updated_at": "2024-01-25T10:30:00Z",
  "files": [
    {
      "id": 47,
      "url": "https://votre-domaine.com/media/materiels/micro_pro_1.jpg",
      "name": "micro_pro_1.jpg"
    }
  ]
}
```

#### Réponses d'erreur
- **400** : Données invalides
- **401** : Non authentifié
- **403** : Permissions insuffisantes
- **404** : Matériel non trouvé

---

### 5. Supprimer un matériel (corbeille)

**DELETE** `/materiels/{id}/delete/`

Met un matériel dans la corbeille (soft delete).

#### Réponse réussie (200)
```json
{
  "success": true,
  "message": "Matériel déplacé dans la corbeille"
}
```

#### Réponses d'erreur
- **401** : Non authentifié
- **403** : Permissions insuffisantes
- **404** : Matériel non trouvé

---

### 6. Supprimer définitivement un matériel

**POST** `/materiels/{id}/restore/delete-finally/`

Supprime définitivement un matériel de la base de données.

#### Réponse réussie (200)
```json
{
  "success": true,
  "message": "Matériel supprimé définitivement"
}
```

#### Réponses d'erreur
- **401** : Non authentifié
- **403** : Permissions insuffisantes
- **404** : Matériel non trouvé

---

### 7. Restaurer un matériel

**POST** `/materiels/{id}/restore/`

Restaure un matériel de la corbeille.

#### Réponse réussie (200)
```json
{
  "success": true,
  "message": "Matériel restauré avec succès"
}
```

#### Réponses d'erreur
- **401** : Non authentifié
- **403** : Permissions insuffisantes
- **404** : Matériel non trouvé

---

## Endpoints de gestion

### 8. Statistiques du matériel

**GET** `/api/materiel-stats/`

Retourne des statistiques sur le matériel.

#### Réponse réussie (200)
```json
{
  "total_materiels": 150,
  "total_categories": 12,
  "materiels_par_categorie": [
    {
      "categorie": "Son",
      "count": 45
    },
    {
      "categorie": "Lumière",
      "count": 38
    },
    {
      "categorie": "Vidéo",
      "count": 28
    }
  ],
  "materiels_recent": [
    {
      "id": 123,
      "nom": "Micro sans fil",
      "created_at": "2024-01-25T09:15:00Z"
    }
  ],
  "materiels_en_corbeille": 5
}
```

---

### 9. Sous-catégories dynamiques

**GET** `/get_sous_categories/`

Retourne les sous-catégories pour une catégorie donnée.

#### Paramètres de requête
| Paramètre | Type | Description |
|-----------|------|-------------|
| `categorie` | integer | ID de la catégorie |

#### Réponse réussie (200)
```json
[
  {
    "id": 1,
    "nom": "Micro"
  },
  {
    "id": 2,
    "nom": "Enceinte"
  },
  {
    "id": 3,
    "nom": "Mélangeur"
  }
]
```

---

### 10. Exporter les matériels

**POST** `/materiels/export/`

Exporte les matériels filtrés au format Excel.

#### Corps de la requête
```json
{
  "data": [
    ["Projecteur Epson", "Son", "Vidéo", "2", "Logistique Centrale", "Église Centrale"],
    ["Micro Shure", "Son", "Micro", "4", "Logistique Centrale", "Église Centrale"]
  ]
}
```

#### Réponse réussie (200)
```http
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename=MaterielsFiltres.xlsx

[Binaire du fichier Excel]
```

---

### 11. Demande de permission

**POST** `/materiels/demande-permission/`

Permet de demander la permission d'ajouter du matériel.

#### Corps de la requête
```json
{
  "raison": "J'ai besoin d'ajouter du matériel pour les événements de mon église"
}
```

#### Réponse réussie (201)
```json
{
  "success": true,
  "message": "Votre demande a été envoyée à l'administrateur",
  "demande_id": 45
}
```

#### Réponses d'erreur
- **400** : Demande déjà en cours
- **401** : Non authentifié

---

## Endpoints des catégories

### 12. Lister les catégories

**GET** `/categories/`

Retourne la liste de toutes les catégories de matériel.

#### Réponse réussie (200)
```json
[
  {
    "id": 1,
    "nom": "Son",
    "description": "Matériel audio",
    "materiels_count": 45,
    "sous_categories": [
      {
        "id": 1,
        "nom": "Micro"
      },
      {
        "id": 2,
        "nom": "Enceinte"
      }
    ]
  },
  {
    "id": 2,
    "nom": "Lumière",
    "description": "Matériel d'éclairage",
    "materiels_count": 38,
    "sous_categories": [
      {
        "id": 4,
        "nom": "Projecteur"
      },
      {
        "id": 5,
        "nom": "Lyre"
      }
    ]
  }
]
```

---

### 13. Lister les sous-catégories

**GET** `/sous-categories/`

Retourne la liste de toutes les sous-catégories.

#### Paramètres de requête
| Paramètre | Type | Description |
|-----------|------|-------------|
| `categorie` | integer | Filtre par catégorie ID |

#### Réponse réussie (200)
```json
[
  {
    "id": 1,
    "nom": "Micro",
    "categorie": {
      "id": 1,
      "nom": "Son"
    },
    "materiels_count": 15
  },
  {
    "id": 2,
    "nom": "Enceinte",
    "categorie": {
      "id": 1,
      "nom": "Son"
    },
    "materiels_count": 20
  }
]
```

---

## Gestion des erreurs

### Format d'erreur standard
```json
{
  "error": "Message d'erreur",
  "code": "ERROR_CODE",
  "details": {
    "field_name": ["Erreur spécifique au champ"]
  },
  "timestamp": "2024-01-25T10:30:00Z"
}
```

### Codes d'erreur courants
| Code | Description |
|------|-------------|
| `AUTHENTICATION_REQUIRED` | Utilisateur non authentifié |
| `PERMISSION_DENIED` | Permissions insuffisantes |
| `NOT_FOUND` | Ressource non trouvée |
| `VALIDATION_ERROR` | Erreur de validation des données |
| `DUPLICATE_REQUEST` | Demande en double (ex: permission) |
| `RATE_LIMIT_EXCEEDED` | Trop de requêtes |

---

## Exemples d'utilisation

### JavaScript (Fetch API)

```javascript
// Lister les matériels avec filtres
async function getMateriels(filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/materiels/?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    credentials: 'same-origin'
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

// Créer un matériel avec images
async function createMateriel(materielData, images) {
  const formData = new FormData();
  
  // Ajouter les champs du matériel
  Object.keys(materielData).forEach(key => {
    formData.append(key, materielData[key]);
  });
  
  // Ajouter les images
  images.forEach(image => {
    formData.append('images', image);
  });
  
  const response = await fetch('/materiel/ajouter/', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin'
  });
  
  return await response.json();
}

// Utilisation
const materiels = await getMateriels({
  searchInput: 'projecteur',
  categorie: 'Son',
  page: 1
});

const newMateriel = await createMateriel(
  {
    nom: 'Nouveau projecteur',
    categorie: 1,
    quantite: 2,
    eglise: 5
  },
  [imageFile1, imageFile2]
);
```

### React Hook personnalisé

```javascript
import { useState, useEffect } from 'react';

export function useMateriels(filters = {}) {
  const [materiels, setMateriels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMateriels() {
      try {
        setLoading(true);
        const params = new URLSearchParams(filters);
        const response = await fetch(`/materiels/?${params}`);
        const data = await response.json();
        setMateriels(data.results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMateriels();
  }, [JSON.stringify(filters)]);

  return { materiels, loading, error };
}

// Utilisation dans un composant
function MaterielList() {
  const { materiels, loading, error } = useMateriels({
    searchInput: searchTerm,
    categorie: selectedCategory
  });

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      {materiels.map(materiel => (
        <MaterielCard key={materiel.id} materiel={materiel} />
      ))}
    </div>
  );
}
```

---

## Limites et quotas

| Ressource | Limite | Description |
|----------|--------|-------------|
| Requêtes/minute | 100 | Par utilisateur authentifié |
| Upload d'images | 5MB | Par image |
| Images par matériel | 10 | Maximum |
| Taille des requêtes | 10MB | Corps de la requête |

---

## Version de l'API

- **Version actuelle** : v1
- **Rétrocompatibilité** : 6 mois
- **Changelog** : Disponible sur `/api/changelog/`

Pour toute question technique ou problème avec l'API, contactez l'équipe de développement à api-support@logistique.com.
