# Système de Gestion des Événements - Guide Utilisateur

Ce document explique en détail le système de gestion des événements de l'application LOGISTIQUE.

## Vue d'ensemble

Le système de gestion des événements permet de :
- 📅 **Organiser** et planifier tous les événements
- 🗓️ **Visualiser** les événements en calendrier
- 👥 **Gérer** les participants et le matériel
- 📊 **Suivre** le statut des événements
- 📤 **Exporter** les planning et données
- 🔄 **Mettre à jour** en temps réel

## Accès au système

### Qui peut utiliser le système ?

**👤 Utilisateurs connectés :**
- Voir tous les événements
- Participer aux événements
- Exporter les données

**👑 Organisateurs et Staff :**
- Créer et modifier les événements
- Gérer les participants
- Assigner le matériel

**🔐 Super-utilisateurs :**
- Accès à tous les événements de toutes les églises
- Gestion avancée des permissions

## Pages principales

### 1. Liste des Événements

#### Accès
Menu principal → Événements → Liste

#### Fonctionnalités principales

**🔍 Barre de recherche :**
- Recherche par titre d'événement
- Recherche instantanée sans rechargement

**🎛️ Filtres avancés :**
- **Type d'événement** : Service, Réunion, Événement spécial, Autre
- **Statut** : Prévu, En cours, Terminé, Annulé
- Application instantanée des filtres

**📊 Tableau des événements :**
| Colonne | Description |
|---------|-------------|
| **Nom** | Titre de l'événement (cliquable) |
| **Date** | Date de début et fin |
| **Lieu** | Église ou lieu de l'événement |
| **Type** | Badge coloré du type |
| **Statut** | Badge du statut actuel |
| **Actions** | Voir, Modifier (si autorisé) |

**📄 Pagination :**
- Navigation entre les pages
- Affichage du nombre total de pages
- Boutons Première/Précédent/Suivant/Dernière

### 2. Calendrier Interactif

#### Accès
Menu principal → Événements → Calendrier

#### Vues disponibles
- **📅 Mois** : Vue mensuelle classique
- **📆 Semaine** : Vue hebdomadaire détaillée
- **📋 Jour** : Vue journalière
- **📝 Liste** : Vue en liste chronologique

#### Fonctionnalités du calendrier

**🎛️ Barre d'outils :**
- Navigation : Précédent/Aujourd'hui/Suivant
- Changement de vue
- Mode sélection
- Création rapide

**🔍 Filtres du calendrier :**
- Type d'événement
- Église (pour les admins)
- Période de dates personnalisée
- Application en temps réel

**📝 Interaction avec les événements :**
- **Clic simple** : Accès à la fiche détaillée
- **Glisser-déposer** : Déplacer un événement
- **Sélection multiple** : Cocher plusieurs événements
- **Tooltips** : Informations au survol

**🎨 Personnalisation visuelle :**
- Codes couleur par type d'événement
- Événements du jour en surbrillance
- Animations fluides
- Design responsive

### 3. Fiche Détaillée d'Événement

#### Accès
Depuis la liste ou le calendrier, cliquez sur un événement

#### Sections de la fiche

**📋 En-tête complet :**
- Titre et statut de l'événement
- Actions rapides : Exporter, Modifier, Supprimer
- Barre d'information : dates, lieu, participants

**📅 Cartes de dates :**
- Carte "Date de début" avec icône
- Carte "Date de fin" avec icône
- Format lisible et professionnel

**📝 Description détaillée :**
- Texte formaté avec sauts de ligne
- Mise en page professionnelle
- Zone de texte extensible

**👤 Organisateur :**
- Photo de profil si disponible
- Nom complet et rôle
- Informations de contact

**📦 Matériel associé :**
- Liste du matériel assigné
- Quantités disponibles
- Statut de disponibilité

**👥 Participants :**
- Nombre total de participants
- Liste avec avatars
- Rôles et responsabilités

**⏱️ Timeline des activités :**
- Historique chronologique
- Actions et modifications
- Responsables de chaque action
- Navigation interactive

## Création et Modification

### Formulaire de Création

#### Accès
- Bouton "Créer" dans la liste
- Bouton "Nouvel Événement" dans le calendrier
- Clic sur une date vide dans le calendrier

#### Structure du formulaire (Wizard)

**📋 Étape 1 : Informations de base**
- Titre de l'événement
- Type d'événement
- Description
- Lieu

**📅 Étape 2 : Dates et horaires**
- Date et heure de début
- Date et heure de fin
- Gestion automatique des fuseaux horaires
- Validation des dates

**👥 Étape 3 : Participants**
- Sélection des participants
- Rôles et permissions
- Notifications automatiques

**📦 Étape 4 : Matériel**
- Sélection du matériel disponible
- Quantités requises
- Vérification des disponibilités

**✅ Étape 5 : Confirmation**
- Résumé de toutes les informations
- Validation finale
- Création de l'événement

#### Fonctionnalités du formulaire

**🎨 Interface intuitive :**
- Navigation entre étapes avec indicateurs
- Sauvegarde automatique du brouillon
- Validation en temps réel
- Aides contextuelles

**📱 Sélecteurs avancés :**
- Sélecteur de dates avec Flatpickr
- Sélecteur de participants avec Select2
- Recherche et filtrage intelligents

**🔄 Mises à jour dynamiques :**
- Vérification des disponibilités
- Calcul automatique des durées
- Suggestions intelligentes

## Gestion des Participants

### Ajout de participants
- **Sélection individuelle** : Choix dans la liste des utilisateurs
- **Sélection par groupe** : Ajout par équipe ou rôle
- **Invitation par email** : Envoi d'invitations personnalisées

### Rôles et permissions
- **Organisateur** : Accès complet à l'événement
- **Participant** : Visualisation et participation
- **Bénévole** : Accès limité aux tâches assignées

### Notifications
- **Email de confirmation** : Automatique à l'inscription
- **Rappels** : Avant l'événement
- **Modifications** : En cas de changements

## Gestion du Matériel

### Assignation
- **Consultation des disponibilités** : En temps réel
- **Réservation automatique** : Blocage des dates
- **Quantités** : Gestion précise des stocks

### Suivi
- **État du matériel** : Disponible/Utilisé/En maintenance
- **Historique** : Traçabilité complète
- **Retours** : Confirmation de restitution

## Système d'Exportation

### Formats disponibles
- **📄 PDF** : Rapport complet avec mise en page
- **📊 Excel** : Tableau de données filtrables
- **📋 CSV** : Données brutes pour import
- **📝 Word** : Document formaté

### Options d'export
- **Événements filtrés** : Selon les critères appliqués
- **Sélection multiple** : Événements cochés
- **Période personnalisée** : Plage de dates
- **Champs personnalisables** : Choix des informations

### Export depuis le calendrier
- **Vue actuelle** : Événements visibles
- **Sélection** : Événements cochés
- **Période** : Mois/semaine en cours

## Notifications et Temps Réel

### Types de notifications
- **Création** : Nouvel événement créé
- **Modification** : Changement de date/lieu
- **Annulation** : Événement supprimé
- **Rappel** : Approche de l'événement

### Canaux de notification
- **Interface** : Messages toast dans l'application
- **Email** : Notifications détaillées
- **WebSocket** : Mises à jour instantanées

## Fonctionnalités Avancées

### Mode Sélection Multiple
- **Activation** : Bouton "Sélectionner" dans le calendrier
- **Sélection** : Cochez les événements souhaités
- **Actions groupées** : Export, suppression, modification

### Glisser-Déposer
- **Déplacement** : Changez les dates facilement
- **Redimensionnement** : Modifiez la durée
- **Validation** : Contrôle des conflits

### Vue Timeline
- **Chronologie** : Vue linéaire des événements
- **Filtrage** : Par type ou participant
- **Navigation** : Zoom et déplacement

## Bonnes Pratiques

### 📝 Création d'événements
- **Titres clairs** : Soyez précis et concis
- **Descriptions complètes** : Incluez toutes les informations utiles
- **Dates réalistes** : Prévoyez le temps nécessaire
- **Lieux exacts** : Précisez les salles ou espaces

### 👥 Gestion des participants
- **Invitations anticipées** : Envoyez les invitations tôt
- **Rôles définis** : Clarifiez les responsabilités
- **Limites de capacité** : Respectez les contraintes

### 📦 Planification du matériel
- **Vérification préalable** : Confirmez les disponibilités
- **Quantités précises** : Évitez les surplus ou manques
- **Planification des retours** : Prévoyez la restitution

### 📅 Organisation du calendrier
- **Catégorisation** : Utilisez les types correctement
- **Couleurs cohérentes** : Facilitez la lecture visuelle
- **Mises à jour régulières** : Maintenez l'exactitude

## Dépannage Courant

### ❌ Problèmes fréquents

**Le calendrier ne s'affiche pas**
- Vérifiez votre connexion internet
- Rechargez la page (F5)
- Essayez un autre navigateur

**Impossible de déplacer un événement**
- Vérifiez vos permissions
- Confirmez que vous êtes l'organisateur
- Contactez l'administrateur

**Les notifications ne s'envoient pas**
- Vérifiez les adresses email
- Consultez le dossier spam
- Vérifiez les paramètres de notification

**L'exportation échoue**
- Réduisez la période d'exportation
- Essayez un autre format
- Vérifiez les filtres appliqués

### 📞 Contacter le support
Pour toute question ou problème technique :
- **Email** : support@logistique.com
- **Téléphone** : +33 1 23 45 67 89
- **Horaires** : Lun-Ven 9h-18h

---

Ce guide couvre l'ensemble des fonctionnalités du système de gestion des événements. Pour des questions spécifiques ou des suggestions d'amélioration, n'hésitez pas à contacter l'équipe technique.
