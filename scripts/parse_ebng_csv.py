#!/usr/bin/env python
"""
Parse the real EBNG-CI CSV and convert to import format
"""
import csv
import os

def parse_ebng_csv(input_file):
    """Parse EBNG-CI CSV and extract regions/churches"""
    
    data = []
    current_region = None
    
    # Try different encodings
    for encoding in ['latin-1', 'iso-8859-1', 'cp1252', 'utf-8']:
        try:
            with open(input_file, 'r', encoding=encoding) as f:
                reader = csv.reader(f, delimiter=';')
                
                rows = list(reader)
                
                # Start from row with headers (skip first 3 rows which are empty or titles)
                header_row = 2
                start_row = 3
                
                for i in range(start_row, len(rows)):
                    row = rows[i]
                    if not row or not any(row):  # Skip empty rows
                        continue
                    
                    num = row[0].strip() if len(row) > 0 else ''
                    region = row[1].strip() if len(row) > 1 else ''
                    church = row[2].strip() if len(row) > 2 else ''
                    
                    # If we have a number and region, this is a new region
                    if num and region:
                        # Remove "REGION" prefix if present
                        current_region = region.replace('REGION ', '').strip()
                        
                        # If church name is also provided on same line, use it
                        if church:
                            data.append({
                                'region': current_region,
                                'ville': current_region,
                                'eglise': church
                            })
                    
                    # If we have a number but no region (just continuing from previous), 
                    # and we have a church, add it to current region
                    elif num and not region and church and current_region:
                        data.append({
                            'region': current_region,
                            'ville': current_region,
                            'eglise': church
                        })
                    
                    # If no number but we have a church name, it's a church in current region
                    elif church and not num and current_region:
                        data.append({
                            'region': current_region,
                            'ville': current_region,
                            'eglise': church
                        })
                
                return data
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(f"  ⚠ Encoding {encoding} failed: {e}")
            continue
    
    print("❌ Could not decode file with any encoding")
    return []

def save_as_csv(data, output_file):
    """Save parsed data as CSV"""
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['region', 'ville', 'eglise'])
        writer.writeheader()
        writer.writerows(data)
    
    print(f"✓ Saved {len(data)} records to {output_file}")
    return len(data)

if __name__ == '__main__':
    input_file = r'C:\Users\Utilisateur\Downloads\DECOUPAGE EBNG-CI (6) (1).csv'
    output_file = os.path.join(os.path.dirname(__file__), 'eglises_import.csv')
    
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        exit(1)
    
    print("Parsing EBNG-CI CSV...")
    data = parse_ebng_csv(input_file)
    
    print(f"✓ Extracted {len(data)} churches")
    
    # Show sample
    print("\nSample data:")
    for row in data[:5]:
        print(f"  {row}")
    
    # Save
    count = save_as_csv(data, output_file)
    print("\n✓ Ready to import!")
