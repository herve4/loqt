#!/usr/bin/env python
"""Parse EBNG-CI CSV - Simplified version"""
import csv

input_file = r'C:\Users\Utilisateur\Downloads\DECOUPAGE EBNG-CI (6) (1).csv'
output_file = r'C:\Users\Utilisateur\Desktop\projects\loqt\loqt\scripts\eglises_import.csv'

data = []
current_region = None

# Read with latin-1 encoding
with open(input_file, 'r', encoding='latin-1') as f:
    reader = csv.reader(f, delimiter=';')
    rows = list(reader)

# Process rows starting from line 3
for i in range(3, len(rows)):
    row = rows[i]
    if not row or not any(row):
        continue
    
    num = row[0].strip() if len(row) > 0 else ''
    region = row[1].strip() if len(row) > 1 else ''
    church = row[2].strip() if len(row) > 2 else ''
    
    # New region with church on same line
    if num and region:
        current_region = region.replace('REGION ', '').strip()
        if church:
            data.append({'region': current_region, 'ville': current_region, 'eglise': church})
    
    # Number without region = continue previous region with new church
    elif num and not region and church and current_region:
        data.append({'region': current_region, 'ville': current_region, 'eglise': church})
    
    # No number = church in current region
    elif church and not num and current_region:
        data.append({'region': current_region, 'ville': current_region, 'eglise': church})

# Write output
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['region', 'ville', 'eglise'])
    writer.writeheader()
    writer.writerows(data)

print(f"✓ Parsed {len(data)} churches")
print(f"✓ Saved to {output_file}")

# Show sample
print("\nSample (first 10):")
for row in data[:10]:
    print(f"  {row['region']:20s} | {row['eglise']}")
