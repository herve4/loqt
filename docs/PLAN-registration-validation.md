# PLAN-registration-validation.md

## Overview
Ce plan décrit l'implémentation du système de validation des inscriptions. Lorsqu'un utilisateur s'inscrit, il est mis en attente (`pending`). Seuls les responsables de son département ou de sa section (ou d'autres administrateurs selon leur scope) peuvent approuver ou rejeter son inscription. Tant qu'il n'est pas approuvé, l'accès à la plateforme lui est refusé et il est redirigé vers une page d'attente/verrouillage.

---

## Project Type
**WEB** (Django Backend + React Frontend)

---

## Success Criteria
1. Les nouveaux utilisateurs s'inscrivant via le formulaire public ou via Google Login se retrouvent avec le statut `validation_status = 'pending'`.
2. Les utilisateurs existants restent configurés avec `validation_status = 'approved'`.
3. Les utilisateurs `'pending'` ou `'rejected'` ne peuvent pas accéder au tableau de bord ni aux autres fonctionnalités du site. Ils sont redirigés vers une page de verrouillage spécifique.
4. Les responsables de département (`resp_dept`, `adj_dept`) ou de section (`resp_sec`, `adj_sec`) voient un onglet "Validation" dans l'Annuaire Membres contenant uniquement les inscriptions en attente sur lesquelles ils ont autorité (même département/section, et restriction régionale/église).
5. Les responsables peuvent approuver ou rejeter un utilisateur via un bouton direct.

---

## Open Questions (Socratic Discovery)
1. **[Scope des Validateurs]** Souhaitez-vous que les rôles d'administration locale, comme le Pasteur Local (`pasteur_local`) et le Responsable Logistique Local (`rll`), puissent également valider les inscriptions des membres de leur propre église (en guise de secours si aucun chef de département n'est encore configuré) ?
2. **[Politique de Rejet]** Lorsqu'une demande d'inscription est rejetée, l'utilisateur doit-il simplement être bloqué sur l'écran "Inscription rejetée", ou doit-il pouvoir modifier ses informations (par exemple changer d'église ou de département) pour soumettre à nouveau sa demande ?
3. **[Validation Automatique]** Existe-t-il des rôles (ex: `super_admin` créés depuis la console) qui doivent être automatiquement approuvés sans passer par la case validation ?

---

## Proposed Changes

### Backend (Django)

#### 1. [MODIFY] [accounts/models.py](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/accounts/models.py)
* Ajouter un champ `validation_status` dans `CustomUser` avec les options `pending`, `approved`, `rejected` (par défaut `approved`).
* Ajouter une méthode `can_validate(self, member)` sur `CustomUser` pour définir précisément le périmètre d'autorité d'un validateur.

#### 2. [MODIFY] [accounts/serializers.py](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/accounts/serializers.py)
* Inclure le champ `validation_status` dans `UserSerializer` pour qu'il soit sérialisé dans le profil.

#### 3. [MODIFY] [api/serializers/common.py](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/api/serializers/common.py)
* Modifier `UserRegisterSerializer` pour forcer `validation_status='pending'` à la création du membre.

#### 4. [MODIFY] [logistque/api_auth.py](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/logistque/api_auth.py)
* Modifier `GoogleLoginAPIView` pour s'assurer que les nouveaux utilisateurs créés via Google Login soient enregistrés avec `validation_status='pending'`.

#### 5. [MODIFY] [accounts/api_views.py](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/accounts/api_views.py)
* Mettre à jour `IsSelfOrSuperAdmin` pour autoriser les validateurs à lire (`GET`) et modifier (`PATCH`) les membres en attente rentrant dans leur scope d'autorité.
* Mettre à jour `UserViewSet.get_queryset` pour filtrer la liste des membres renvoyée :
  * Un membre standard ne voit que les membres `approved`.
  * Un validateur voit les membres `approved` + les membres `pending` de son ressort.
  * Un `super_admin` voit tout le monde.
* Mettre à jour `UserViewSet.get_serializer` pour empêcher un utilisateur d'éditer son propre statut, et restreindre les validateurs à ne modifier *que* le champ `validation_status` lors de l'édition d'autrui.

---

### Frontend (React)

#### 6. [NEW] [PendingValidationPage.jsx](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/frontend/src/pages/PendingValidationPage.jsx)
* Créer une page d'attente à l'esthétique monospace retro-futuriste (scanline, texte vert/bleu, boîte de détails technique, bouton Refresh et Déconnexion).

#### 7. [NEW] [RejectedPage.jsx](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/frontend/src/pages/RejectedPage.jsx)
* Créer une page de rejet avec indicateur d'accès refusé rouge et bouton de déconnexion.

#### 8. [MODIFY] [components/ProtectedRoute.jsx](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/frontend/src/components/ProtectedRoute.jsx)
* Intercepter le statut de l'utilisateur connecté : si `pending`, rediriger vers `/pending-validation` ; si `rejected`, rediriger vers `/rejected`.

#### 9. [MODIFY] [App.jsx](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/frontend/src/App.jsx)
* Déclarer les routes `/pending-validation` et `/rejected`.

#### 10. [MODIFY] [pages/MembersList.jsx](file:///c:/Users/Utilisateur/Desktop/projects/loqt/loqt/frontend/src/pages/MembersList.jsx)
* Ajouter un sélecteur d'onglets ("Annuaire" / "Inscriptions en attente") visible uniquement pour les rôles d'encadrement/validation.
* Afficher la liste des demandes en attente avec des boutons d'actions directes ("Approuver" / "Rejeter").

---

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass
- Security: ✅ No critical issues
- Build: ✅ Success
- Date: 2026-06-03
