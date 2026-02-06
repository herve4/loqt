# Système de Gestion du Matériel - Guide Utilisateur

Ce document explique en détail le système de gestion du matériel de l'application LOGISTIQUE.

## Vue d'ensemble

Le système de gestion du matériel permet de :
- 📦 **Cataloguer** tous les équipements et ressources
- 🔍 **Rechercher** et filtrer rapidement le matériel
- 📸 **Visualiser** les équipements avec photos
- 📊 **Suivre** les quantités et les mouvements
- 🏷️ **Générer** QR codes et codes-barres
- 📤 **Exporter** les données en Excel

## Accès au système

### Qui peut utiliser le système ?

Le système est accessible selon les permissions de l'utilisateur :

**✅ Accès complet** (demande approuvée) :
- Voir tous les matériels
- Ajouter, modifier, supprimer
- Exporter les données
- Accéder à la corbeille

**⏳ En attente** :
- Peut voir les matériels existants
- Bouton "Ajouter" désactivé
- Message "Demande en cours..."

**❌ Accès refusé** :
- Peut voir les matériels
- Possibilité de refaire une demande

**🔒 Pas de demande** :
- Peut voir les matériels
- Bouton pour faire une demande d'accès

## Page principale : Liste des matériels

### 1. En-tête et informations
```
📦 Liste des Matériels
Total : 25 matériels affichés
```

### 2. Barre d'actions supérieure
- **📥 Exporter en Excel** : Exporte les matériels visibles après filtrage
- **➕ Ajouter un matériel** : Ouvre le formulaire de création (si autorisé)

### 3. Zone de filtrage avancé

#### Filtres disponibles :
- **🔍 Recherche textuelle** : Recherche par nom de matériel
- **📦 Catégorie** : Filtre par catégorie principale
- **📂 Sous-catégorie** : Filtre par sous-catégorie (dépend de la catégorie)
- **🏢 Logistique** : Filtre par service/équipe logistique
- **🔢 Quantité** : Filtre par quantité exacte

**Fonctionnement intelligent :**
- Les filtres s'appliquent instantanément sans recharger la page
- Le compteur se met à jour en temps réel
- Les sous-catégories s'adaptent automatiquement à la catégorie choisie

### 4. Tableau des matériels

#### Colonnes du tableau :
| Colonne | Description |
|---------|-------------|
| **Image** | Miniatures des photos (jusqu'à 3, +X si plus) |
| **Nom** | Nom du matériel (tronqué à 12 caractères) |
| **Responsable** | Personne responsable du matériel |
| **Catégorie** | Catégorie principale du matériel |
| **Église** | Église ou service propriétaire |
| **Quantité** | Nombre d'unités disponibles |
| **Actions** | Boutons d'action rapide |

#### Actions disponibles par matériel :
- **👁️ Voir** : Ouvre la fiche détaillée
- **✏️ Modifier** : Modifie les informations
- **🗑️ Supprimer** : Met à la corbeille (avec confirmation)

## Modal de visualisation rapide

### Ouverture
Cliquez sur les miniatures d'images dans le tableau pour ouvrir une fenêtre modale.

### Contenu de la modal
- **🎠 Carrousel d'images** : Navigation entre toutes les photos
- **📋 Informations détaillées** : Nom, quantité, responsable, catégorie
- **📱 QR Code et Code-barre** : Si générés pour le matériel
- **🔧 Actions rapides** :
  - Imprimer la fiche
  - Télécharger le QR Code
  - Télécharger le Code-barre
  - Partager les informations

### Navigation dans le carrousel
- **Flèches gauche/droite** : Navigation manuelle
- **Clic sur les points** : Accès direct à une image
- **Auto-lecture** : Défilement automatique toutes les 4 secondes

## Fiche détaillée du matériel

### Accès
Depuis le tableau, cliquez sur l'icône 👁️ "Voir" pour accéder à la page détaillée.

### Sections de la fiche

#### 1. Galerie photo
- **Carrousel interactif** avec Swiper
- **Navigation** : flèches, points, auto-lecture
- **Effet de zoom** au survol
- **Responsive** : s'adapte à la taille de l'écran

#### 2. Informations principales
- **📦 Nom** du matériel
- **🏷️ Catégorie** avec badge coloré
- **🔢 Quantité** disponible
- **⛪ Église** propriétaire
- **👤 Responsable** désigné
- **📝 Description** (formatage préservé)
- **📅 Date d'ajout**

#### 3. Actions disponibles
- **🖨️ Imprimer/PDF** : Génère une version imprimable
- **📤 Partager** : Partage via système natif ou copie le lien
- **✏️ Modifier** : Accès au formulaire de modification
- **🗑️ Supprimer** : Met à la corbeille

## Système de corbeille

### Accès
Bouton flottant 🗑️ en bas à droite de la page liste.

### Fonctionnalités
- **📋 Liste des éléments supprimés** avec date de suppression
- **♻️ Restaurer** : Remet le matériel dans la liste active
- **🗑️ Supprimer définitivement** : Efface complètement le matériel
- **🔄 Vider la corbeille** : Supprime tous les éléments en une fois

## Système d'exportation

### Export Excel des données filtrées
1. Appliquez vos filtres dans la liste
2. Cliquez sur **📥 Exporter en Excel**
3. Le fichier contient uniquement les matériels visibles
4. Format : `.xlsx` compatible Excel

### Contenu de l'export
- Toutes les colonnes visibles dans le tableau
- Uniquement les données après filtrage
- Formatage propre pour une utilisation immédiate

## Gestion des permissions

### Demande d'accès
Si vous n'avez pas les droits pour ajouter du matériel :

1. Cliquez sur **👉 Faire une demande d'accès**
2. Remplissez le formulaire de demande
3. **⏳ En attente** : Votre demande est en cours de validation
4. **✅ Approuvée** : Accès complet au système
5. **❌ Refusée** : Possibilité de refaire une demande

### États possibles
- **Aucune demande** : Bouton pour faire une première demande
- **En attente** : Demande envoyée, en cours de traitement
- **Approuvée** : Accès complet au système
- **Refusée** : Demande rejetée, possibilité de renouveler

## Bonnes pratiques d'utilisation

### 📸 Photos du matériel
- **Qualité** : Photos claires et bien éclairées
- **Angles** : Plusieurs vues (face, dessus, côtés)
- **Contexte** : Matériel dans son environnement d'utilisation
- **Taille** : Images optimisées pour le web

### 🏷️ Catégorisation
- **Catégorie principale** : Type d'équipement (ex: "Son", "Lumière")
- **Sous-catégorie** : Détail spécifique (ex: "Micro", "Enceinte")
- **Cohérence** : Utilisez les mêmes termes pour éviter la duplication

### 📝 Description
- **Informations utiles** : État, marque, modèle, année
- **Usage** : Comment et où le matériel est utilisé
- **Maintenance** : Dernière révision, prochain entretien

### 🔢 Quantité
- **Unités** : Soyez précis sur ce que vous comptez
- **Disponibilité** : Indiquez si tout est disponible ou en prêt
- **Mise à jour** : Actualisez après chaque mouvement

## Fonctionnalités techniques

### 🔄 Recherche en temps réel
- **Instantanée** : Pas de rechargement de page
- **Multi-critères** : Combine plusieurs filtres
- **Intelligente** : Insensible à la casse

### 📱 Responsive Design
- **Mobile** : Adapté aux smartphones
- **Tablette** : Interface optimisée
- **Desktop** : Expérience complète

### ⚡ Performance
- **Chargement différé** : Images chargées au besoin
- **Cache** : Optimisation des requêtes
- **Compression** : Fichiers optimisés

## Dépannage courant

### ❌ Problèmes fréquents

**Les filtres ne fonctionnent pas**
- Vérifiez votre connexion internet
- Rechargez la page (F5)
- Videz le cache de votre navigateur

**Les images ne s'affichent pas**
- Vérifiez que les images sont bien uploadées
- Contrôlez la taille des fichiers (max 5MB)
- Essayez avec un autre navigateur

**L'export Excel ne fonctionne pas**
- Vérifiez qu'il y a des matériels visibles
- Autorisez les téléchargements dans votre navigateur
- Essayez de désactiver les bloqueurs de publicité

**Impossible d'ajouter du matériel**
- Vérifiez le statut de votre demande d'accès
- Contactez l'administrateur système
- Assurez-vous d'être bien connecté

### 📞 Contacter le support
Pour toute question ou problème technique :
- **Email** : support@logistique.com
- **Téléphone** : +33 1 23 45 67 89
- **Horaires** : Lun-Ven 9h-18h

---

Ce guide couvre l'ensemble des fonctionnalités du système de gestion du matériel. Pour des questions spécifiques ou des suggestions d'amélioration, n'hésitez pas à contacter l'équipe technique.
