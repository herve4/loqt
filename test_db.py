import os
import psycopg2
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

try:
    # Essayer de se connecter à la base de données
    conn = psycopg2.connect(
        dbname=os.getenv('POSTGRES_DB'),
        user=os.getenv('POSTGRES_USER'),
        password=os.getenv('POSTGRES_PASSWORD'),
        host=os.getenv('POSTGRES_HOST'),
        port=os.getenv('POSTGRES_PORT', '5432')
    )
    print("✅ Connexion à PostgreSQL réussie !")
    conn.close()
except Exception as e:
    print(f"❌ Erreur de connexion à PostgreSQL: {e}")
