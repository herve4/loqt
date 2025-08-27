# Plan de Nettoyage du Projet

Ce document décrit les fichiers et dossiers identifiés comme inutiles ou redondants. L'objectif est de nettoyer la racine du projet pour améliorer la clarté et la maintenabilité.

## Fichiers à Archiver

Les fichiers suivants seront déplacés dans un dossier `archive/` pour consultation ultérieure, mais retirés du projet principal.

| Fichier                        | Raison                               |
| ------------------------------ | ------------------------------------ |
| `backup.sql`                   | Sauvegarde de base de données.       |
| `backup_.sql`                  | Sauvegarde de base de données.       |
| `backup_avant_recreation.sql`  | Sauvegarde de base de données.       |
| `pg_backup.sql`                | Sauvegarde de base de données (PostgreSQL). |
| `db.sqlite3.backup`            | Sauvegarde de la base de données SQLite. |
| `sglci.tar`                    | Archive volumineuse, potentiellement obsolète. |

## Fichiers à Supprimer

Les fichiers suivants seront supprimés définitivement car ils sont considérés comme inutiles ou dangereux.

| Fichier                  | Raison                                     |
| ------------------------ | ------------------------------------------ |
| `DROP DATABASE loqt;`    | Fichier contenant une commande SQL destructive. |
| `datadump.json`          | Fichier JSON vide ou de test.              |
| `migrate.load` | Fichier de migration temporaire. |
| `logistque/events/CLEANUP.md` | Ancien fichier de nettoyage, remplacé par `docs/CLEANUP.md`. |
| `logistque/events/archive_unused_files.py` | Ancien script de nettoyage, remplacé par `scripts/archive_unused_files.py`. |

## Dossiers à Archiver

Les dossiers suivants ont été identifiés comme vides ou non utilisés dans le code base actuel.

| Dossier                  | Raison                                     |
| ------------------------ | ------------------------------------------ |
| `logistque/events/analytics/` | Application Django non utilisée. |
| `logistque/events/communication/` | Application Django non utilisée. |

## Prochaines Étapes

1.  **Validation** : Confirmer que cette liste est correcte.
2.  **Création du Script** : Développer un script `archive_unused_files.py` pour automatiser le processus.
3.  **Exécution** : Lancer le script pour nettoyer le projet.
