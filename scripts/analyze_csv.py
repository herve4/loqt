#!/usr/bin/env python
import csv

input_file = r'C:\Users\Utilisateur\Downloads\DECOUPAGE EBNG-CI (6) (1).csv'

# Try different encodings
for encoding in ['latin-1', 'iso-8859-1', 'cp1252', 'utf-8']:
    try:
        with open(input_file, 'r', encoding=encoding) as f:
            reader = csv.reader(f, delimiter=';')
            rows = list(reader)
            print(f"✓ Successfully read with {encoding}")
            print(f"Total rows: {len(rows)}\n")
            
            # Show structure
            print("First 15 rows:")
            for i, row in enumerate(rows[:15]):
                col0 = row[0].strip() if len(row) > 0 else ''
                col1 = row[1].strip() if len(row) > 1 else ''
                col2 = row[2].strip() if len(row) > 2 else ''
                print(f"{i:3d}: [{col0:3s}] [{col1:20s}] [{col2:20s}]")
            
            print("\n\nLast 15 rows:")
            for i, row in enumerate(rows[-15:], len(rows)-15):
                col0 = row[0].strip() if len(row) > 0 else ''
                col1 = row[1].strip() if len(row) > 1 else ''
                col2 = row[2].strip() if len(row) > 2 else ''
                print(f"{i:3d}: [{col0:3s}] [{col1:20s}] [{col2:20s}]")
            break
    except:
        continue
