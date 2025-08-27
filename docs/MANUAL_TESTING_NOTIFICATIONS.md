# Guide de Test Manuel : Système de Notifications

Ce document fournit des instructions détaillées pour tester manuellement le système de notifications de l'application LOQT. Ces tests couvrent les fonctionnalités de base et avancées des notifications.

## Table des matières

1. [Prérequis](#prérequis)
2. [Test des Notifications Web](#test-des-notifications-web)
3. [Test des Notifications par Email](#test-des-notifications-par-email)
4. [Test des Notifications Push (si configuré)](#test-des-notifications-push)
5. [Test des Préférences de Notification](#test-des-préférences-de-notification)
6. [Test des Performances](#test-des-performances)
7. [Test de la Gestion des Erreurs](#test-de-la-gestion-des-erreurs)
8. [Test de Sécurité](#test-de-sécurité)
9. [Test de Compatibilité](#test-de-compatibilité)
10. [Journalisation et Dépannage](#journalisation-et-dépannage)

## Prérequis

- Un compte utilisateur avec des droits d'administration
- Un compte utilisateur standard pour les tests
- Accès à la console d'administration Django
- Accès aux journaux du serveur
- Client de messagerie configuré (pour les tests d'emails)
- Navigateurs web modernes (Chrome, Firefox, Safari, Edge)

## Test des Notifications Web

### 1. Notification de Base

1. **Connexion** : Connectez-vous en tant qu'utilisateur standard
2. **Déclenchement** : Effectuez une action qui génère une notification (par exemple, créez un événement)
3. **Vérification** :
   - Une notification doit apparaître en temps réel (toast/notification flottante)
   - L'icône de notification dans la barre de navigation doit afficher un badge avec le nombre de notifications non lues
   - Le son de notification doit être joué (si activé)
   - La notification doit apparaître dans la liste des notifications

### 2. Marquer comme Lu

1. **Accès** : Cliquez sur l'icône de notification pour afficher la liste
2. **Action** : Cliquez sur une notification non lue
3. **Vérification** :
   - La notification doit être marquée comme lue
   - Le compteur de notifications non lues doit diminuer
   - La notification doit apparaître en lecture dans la liste

### 3. Marquer Toutes comme Lues

1. **Accès** : Affichez la liste des notifications
2. **Action** : Cliquez sur "Marquer tout comme lu"
3. **Vérification** :
   - Toutes les notifications doivent être marquées comme lues
   - Le badge de notification doit disparaître ou afficher 0

### 4. Notification en Temps Réel

1. **Préparation** : Connectez-vous avec deux navigateurs différents (ou en navigation privée)
2. **Action** : Sur le premier navigateur, effectuez une action qui génère une notification
3. **Vérification** :
   - La notification doit apparaître en temps réel sur le deuxième navigateur
   - Le compteur de notifications doit se mettre à jour automatiquement

## Test des Notifications par Email

### 1. Configuration des Préférences

1. **Accès** : Allez dans les paramètres de notification
2. **Action** : Activez les notifications par email pour un type d'événement
3. **Vérification** :
   - Les modifications doivent être enregistrées
   - La préférence doit être reflétée dans la base de données

### 2. Réception d'Email

1. **Action** : Effectuez une action qui déclenche une notification par email
2. **Vérification** :
   - Un email doit être envoyé à l'adresse de l'utilisateur
   - L'email doit contenir le bon sujet et le bon contenu
   - Les liens dans l'email doivent fonctionner correctement

### 3. Désabonnement

1. **Action** : Cliquez sur le lien de désabonnement dans l'email
2. **Vérification** :
   - Vous devez être redirigé vers une page de confirmation
   - Les préférences de notification doivent être mises à jour
   - Aucun nouvel email ne doit être reçu pour ce type de notification

## Test des Notifications Push (si configuré)

### 1. Abonnement aux Notifications

1. **Action** : Acceptez les notifications push lorsque l'option est proposée
2. **Vérification** :
   - Une demande d'autorisation doit apparaître
   - L'abonnement doit être enregistré dans la base de données

### 2. Réception de Notification

1. **Action** : Effectuez une action qui déclenche une notification push
2. **Vérification** :
   - La notification doit apparaître même si le navigateur n'est pas actif
   - Le contenu de la notification doit être correct
   - Le clic sur la notification doit ouvrir l'application sur la page appropriée

## Test des Préférences de Notification

### 1. Modification des Préférences

1. **Accès** : Allez dans les paramètres de notification
2. **Action** : Modifiez plusieurs préférences
3. **Vérification** :
   - Les modifications doivent être enregistrées
   - Les préférences doivent être reflétées dans le comportement du système

### 2. Réinitialisation des Préférences

1. **Action** : Cliquez sur "Réinitialiser les préférences"
2. **Vérification** :
   - Toutes les préférences doivent revenir aux valeurs par défaut
   - Les modifications doivent être immédiatement effectives

## Test des Performances

### 1. Charge Élevée

1. **Préparation** : Créez un script pour générer un grand nombre de notifications
2. **Action** : Exécutez le script
3. **Vérification** :
   - Le système doit rester réactif
   - Les notifications doivent être traitées dans un délai raisonnable
   - Aucune donnée ne doit être perdue

### 2. Temps de Réponse

1. **Action** : Mesurez le temps entre le déclenchement d'une notification et son affichage
2. **Vérification** :
   - Le délai doit être inférieur à 2 secondes dans des conditions normales
   - Aucun délai excessif ne doit être observé

## Test de la Gestion des Erreurs

### 1. Connexion Perdue

1. **Préparation** : Déclenchez une notification
2. **Action** : Coupez temporairement la connexion Internet
3. **Vérification** :
   - Le système doit gérer gracieusement la déconnexion
   - Les notifications doivent être mises en file d'attente et envoyées une fois la connexion rétablie

### 2. Données Invalides

1. **Action** : Essayez d'envoyer une notification avec des données invalides
2. **Vérification** :
   - Le système doit rejeter les données invalides
   - Un message d'erreur approprié doit être enregistré
   - Aucune donnée corrompue ne doit être enregistrée

## Test de Sécurité

### 1. Accès Non Autorisé

1. **Action** : Essayez d'accéder aux notifications d'un autre utilisateur
2. **Vérification** :
   - L'accès doit être refusé
   - Une erreur 403 doit être renvoyée

### 2. Injection de Données

1. **Action** : Essayez d'injecter du code HTML/JavaScript dans une notification
2. **Vérification** :
   - Le code ne doit pas être exécuté
   - Les balises HTML doivent être échappées

## Test de Compatibilité

### 1. Navigateurs

1. **Action** : Testez les notifications sur différents navigateurs (Chrome, Firefox, Safari, Edge)
2. **Vérification** :
   - Les fonctionnalités doivent fonctionner de manière cohérente
   - Aucune erreur JavaScript ne doit apparaître dans la console

### 2. Appareils

1. **Action** : Testez sur différents appareils (ordinateur de bureau, tablette, mobile)
2. **Vérification** :
   - L'interface doit s'adapter à la taille de l'écran
   - Les interactions tactiles doivent fonctionner correctement

## Journalisation et Dépannage

### 1. Journaux du Serveur

1. **Accès** : Consultez les journaux du serveur
2. **Vérification** :
   - Les erreurs doivent être correctement enregistrées
   - Les informations de débogage doivent être disponibles si nécessaire

### 2. Outils de Développement

1. **Action** : Utilisez les outils de développement du navigateur
2. **Vérification** :
   - Aucune erreur ne doit apparaître dans la console
   - Les requêtes réseau doivent se terminer avec succès

## Modèle de Rapport de Test

Utilisez le modèle suivant pour documenter vos tests :

```markdown
## Test : [Nom du Test]
- **Date** : [Date du test]
- **Version** : [Version de l'application]
- **Environnement** : [Navigateur/Appareil/Système d'exploitation]
- **Prérequis** : [Conditions préalables]
- **Étapes** :
  1. [Étape 1]
  2. [Étape 2]
  3. [Étape 3]
- **Résultat Attendu** : [Description du résultat attendu]
- **Résultat Obtenu** : [Description du résultat obtenu]
- **Statut** : [PASSÉ/ÉCHOUÉ/BLOQUÉ]
- **Commentaires** : [Toute observation supplémentaire]
```

## Conclusion

Ce guide couvre les principaux scénarios de test pour le système de notifications. Des tests réguliers sont recommandés pour s'assurer que toutes les fonctionnalités continuent de fonctionner comme prévu après les mises à jour.
