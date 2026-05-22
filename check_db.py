import sqlite3
import os

db_path = 'db.sqlite3'
if not os.path.exists(db_path):
    print(f"{db_path} not found")
else:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        cur.execute("PRAGMA table_info(accounts_customuser)")
        cols = cur.fetchall()
        print("Columns in accounts_customuser:")
        for col in cols:
            print(f" - {col[1]} ({col[2]})")
            
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'logistque%'")
        tables = cur.fetchall()
        print("\nTables in logistque:")
        for table in tables:
            print(f" - {table[0]}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()
