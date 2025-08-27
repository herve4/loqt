import os
import shutil

# Définir le chemin racine du projet
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ARCHIVE_DIR = os.path.join(PROJECT_ROOT, 'archive')

# Listes de fichiers et dossiers à traiter (basées sur docs/CLEANUP.md)
FILES_TO_ARCHIVE = [
    'backup.sql',
    'backup_.sql',
    'backup_avant_recreation.sql',
    'pg_backup.sql',
    'db.sqlite3.backup',
    'sglci.tar',
]

FILES_TO_DELETE = [
    'DROP DATABASE loqt;',
    'datadump.json',
    'migrate.load',
    'logistque/events/CLEANUP.md',
    'logistque/events/archive_unused_files.py',
]

DIRS_TO_ARCHIVE = [
    'logistque/events/analytics',
    'logistque/events/communication',
]

def archive_file(filename):
    """Déplace un fichier vers le dossier d'archive."""
    src = os.path.join(PROJECT_ROOT, filename)
    dest = os.path.join(ARCHIVE_DIR, filename)
    if os.path.exists(src):
        try:
            shutil.move(src, dest)
            print(f"[ARCHIVÉ] '{filename}' déplacé vers '{ARCHIVE_DIR}'")
        except Exception as e:
            print(f"[ERREUR] Impossible d'archiver '{filename}': {e}")
    else:
        print(f"[INFO] Le fichier '{filename}' n'existe pas, ignoré.")

def delete_file(filename):
    """Supprime un fichier de la racine du projet."""
    src = os.path.join(PROJECT_ROOT, filename)
    if os.path.exists(src):
        try:
            os.remove(src)
            print(f"[SUPPRIMÉ] Le fichier '{filename}' a été supprimé.")
        except Exception as e:
            print(f"[ERREUR] Impossible de supprimer '{filename}': {e}")
    else:
        print(f"[INFO] Le fichier '{filename}' n'existe pas, ignoré.")

def archive_directory(dirname):
    """Déplace un dossier vers le dossier d'archive."""
    src = os.path.join(PROJECT_ROOT, dirname)
    dest = os.path.join(ARCHIVE_DIR, dirname)
    if os.path.isdir(src):
        try:
            shutil.move(src, dest)
            print(f"[ARCHIVÉ] Le dossier '{dirname}' déplacé vers '{ARCHIVE_DIR}'")
        except Exception as e:
            print(f"[ERREUR] Impossible d'archiver le dossier '{dirname}': {e}")
    else:
        print(f"[INFO] Le dossier '{dirname}' n'existe pas ou n'est pas un répertoire, ignoré.")

def main():
    """Fonction principale pour exécuter le nettoyage."""
    print("--- Début du script de nettoyage du projet ---")

    # 1. Créer le dossier d'archive s'il n'existe pas
    if not os.path.exists(ARCHIVE_DIR):
        os.makedirs(ARCHIVE_DIR)
        print(f"[CRÉÉ] Dossier d'archive créé à: '{ARCHIVE_DIR}'")

    # 2. Archiver les fichiers
    print("\n--- Archivage des fichiers ---")
    for f in FILES_TO_ARCHIVE:
        archive_file(f)

    # 3. Supprimer les fichiers
    print("\n--- Suppression des fichiers ---")
    for f in FILES_TO_DELETE:
        delete_file(f)

    # 4. Archiver les dossiers (après vérification)
    print("\n--- Archivage des dossiers ---")
    for d in DIRS_TO_ARCHIVE:
        archive_directory(d)

    print("\n--- Nettoyage terminé ---")

if __name__ == '__main__':
    main()
