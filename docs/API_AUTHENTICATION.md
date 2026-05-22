# Documentation API Authentication

## Vue d'ensemble
Les endpoints d'authentification utilisent l'authentification par token Django REST Framework (TokenAuthentication). Tous les appels API (sauf login et register) doivent inclure le header `Authorization: Token <token>`.

## Endpoints Disponibles

### 1. Login - Obtenir un token
**URL:** `POST /api/login/`  
**Authentification:** Non requise  
**Description:** Se connecter avec email/username et mot de passe

**Requête:**
```json
{
  "username": "utilisateur@example.com",
  "password": "motdepasse"
}
```

**Réponse (200 OK):**
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user_id": 1,
  "username": "utilisateur@example.com",
  "email": "utilisateur@example.com",
  "first_name": "Jean",
  "last_name": "Dupont",
  "role": "pasteur",
  "eglise": 5,
  "is_staff": false
}
```

**Erreurs:**
- 400: Identifiants invalides
- 404: Utilisateur non trouvé

---

### 2. Register - Créer un nouveau compte
**URL:** `POST /api/register/`  
**Authentification:** Non requise  
**Description:** Créer un nouveau compte utilisateur

**Requête:**
```json
{
  "email": "nouveau@example.com",
  "phone": "+33612345678",
  "first_name": "Marie",
  "last_name": "Martin",
  "password": "motdepasse123",
  "password_confirm": "motdepasse123",
  "role": "membre",
  "eglise": 5,
  "accept_terms": true
}
```

**Réponse (201 Created):**
```json
{
  "token": "9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b",
  "user_id": 2,
  "username": "nouveau@example.com",
  "email": "nouveau@example.com",
  "first_name": "Marie",
  "last_name": "Martin",
  "role": "membre",
  "eglise": 5,
  "is_staff": false,
  "message": "Inscription réussie"
}
```

**Erreurs:**
- 400: Données invalides ou email déjà utilisé

---

### 3. Get User Profile
**URL:** `GET /api/user/profile/`  
**Authentification:** Requise (Token)  
**Description:** Récupérer le profil de l'utilisateur connecté

**Requête Headers:**
```
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

**Réponse (200 OK):**
```json
{
  "id": 1,
  "email": "utilisateur@example.com",
  "phone": "+33612345678",
  "first_name": "Jean",
  "last_name": "Dupont",
  "role": "pasteur",
  "eglise": 5,
  "is_staff": false
}
```

---

### 4. Update User Profile
**URL:** `PUT /api/user/profile/` ou `PATCH /api/user/profile/`  
**Authentification:** Requise (Token)  
**Description:** Mettre à jour le profil de l'utilisateur connecté

**Requête:**
```json
{
  "first_name": "Jean-Pierre",
  "last_name": "Dupont-Martin",
  "phone": "+33612345679"
}
```

**Réponse (200 OK):**
```json
{
  "id": 1,
  "email": "utilisateur@example.com",
  "phone": "+33612345679",
  "first_name": "Jean-Pierre",
  "last_name": "Dupont-Martin",
  "role": "pasteur",
  "eglise": 5,
  "is_staff": false
}
```

---

### 5. Logout - Supprimer le token
**URL:** `POST /api/user/logout/`  
**Authentification:** Requise (Token)  
**Description:** Se déconnecter et supprimer le token

**Requête Headers:**
```
Authorization: Token 9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b
```

**Réponse (200 OK):**
```json
{
  "message": "Déconnexion réussie"
}
```

---

## Configuration du Frontend

### Service d'Authentification
Le service `authService` gère automatiquement:
- Stockage du token dans localStorage
- Inclusion du header Authorization dans les requêtes
- Gestion des erreurs d'authentification

### Utilisation:
```typescript
// Login
const user = await authService.login({ 
  username: 'email@example.com', 
  password: 'password' 
});

// Register
const newUser = await authService.register({
  email: 'new@example.com',
  password: 'password',
  password_confirm: 'password',
  first_name: 'John',
  last_name: 'Doe',
  role: 'membre',
  accept_terms: true
});

// Get profile
const profile = await authService.getCurrentUserProfile();

// Logout
await authService.logout();

// Get stored user
const user = authService.getCurrentUser();

// Get auth headers
const headers = authService.getAuthHeaders();
```

---

## Configuration du Backend

### Settings.py
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authtoken.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly'
    ]
}
```

### CustomUser Model
- `USERNAME_FIELD = 'email'` - L'email est utilisé comme identifiant
- Champs: id, email, phone, first_name, last_name, role, eglise, is_staff, is_active

### Rôles disponibles:
- `pasteur` - Pasteur (staff=true)
- `membre` - Membre (staff=false)
- `responsable` - Responsable (staff=true)

---

## Gestion des Erreurs

### 401 Unauthorized
Token manquant ou invalide
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
Permissions insuffisantes
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 400 Bad Request
Données invalides
```json
{
  "field": ["Error message"]
}
```

---

## Security Notes

1. **Stockage du Token:** Actuellement stocké dans localStorage. Pour un environnement production, considérer httpOnly cookies.
2. **HTTPS:** Toujours utiliser HTTPS en production pour protéger le token en transit.
3. **Token Expiration:** Pas de TTL configué actuellement. À implémenter pour la production.
4. **CORS:** Vérifier la configuration CORS dans settings.py pour les domaines autorisés.

---

## Troubleshooting

### Le login échoue avec "Authentication credentials were not provided"
- Vérifier que le token est inclus dans le header `Authorization`
- Format correct: `Authorization: Token <token>`

### L'inscription échoue avec "Email already exists"
- L'email est déjà enregistré
- Utiliser un email différent

### 403 Forbidden sur les endpoints protégés
- Vérifier que l'utilisateur est authentifié
- Vérifier les permissions de l'utilisateur (rôle, is_staff)

