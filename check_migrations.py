import sqlite3
import os

db_path = 'db.sqlite3'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        cur.execute("SELECT app, name FROM django_migrations WHERE app IN ('accounts', 'logistque')")
        rows = cur.fetchall()
        print("Migration history for accounts and logistque:")
        for row in rows:
            print(f" - {row[0]}: {row[1]}")
    except Exception as e:
        print(f"Error checking migrations: {e}")
    finally:
        conn.close()
else:
    print("db.sqlite3 not found")
