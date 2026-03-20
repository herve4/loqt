import os
import sys
import django
import openpyxl

# Configuration de l'environnement Django
sys.path.append('/home/herve/loqt')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Region, Eglise, Ville
from accounts.models import CustomUser

def import_data(file_path):
    print(f"Début de l'importation depuis {file_path}...")
    
    try:
        wb = openpyxl.load_workbook(file_path, data_only=True)
        sheet = wb.active
        
        current_region = None
        current_eglise_name = None
        
        # On commence à la ligne 4 (basé sur l'analyse précédente)
        # Row 3: ('N0', 'REGIONS', 'EGLISES', None, 'PASTEURS /MISS', None, 'SAMONIMS /MISS', None)
        # Row 4: (1, 'REGION ANGRÉ', 'ANGRE', None, 'LEE JUNG DO', 759999829, ... )
        
        count_created = 0
        
        # Création d'une ville par défaut si nécessaire
        default_region, _ = Region.objects.get_or_create(nom="NATIONALE")
        default_ville, _ = Ville.objects.get_or_create(nom="Abidjan", region=default_region)

        for row_idx, row in enumerate(sheet.iter_rows(min_row=4, values_only=True), 4):
            # Structure attendue: (N0, REGIONS, EGLISES, None, PASTEURS, PHONE1, PHONE2, ...)
            try:
                no, reg_name, eglise_name, _, past_name, past_phone1, past_phone2, _ = row[:8]
                
                # Mise à jour de la région courante si présente
                if reg_name:
                    current_region_name = str(reg_name).strip()
                    current_region, _ = Region.objects.get_or_create(nom=current_region_name)
                    print(f"Région: {current_region_name}")

                # Mise à jour de l'église courante si présente
                if eglise_name:
                    current_eglise_name = str(eglise_name).strip()
                
                if not current_eglise_name or not past_name:
                    continue

                # Création du Pasteur (User)
                phone = str(past_phone1).strip() if past_phone1 else None
                if phone and len(phone) > 20:
                    print(f"  [Warning] Téléphone trop long ligne {row_idx}: {phone}")
                    phone = phone[:20]
                    
                email = f"{str(past_name).lower().replace(' ', '.')}@sgl-ci.org"
                if len(email) > 254: # Limite standard email
                    email = email[:254]
                
                # Nettoyage du nom pour le pasteur
                full_name = str(past_name).strip()
                name_parts = full_name.split(' ')
                last_name = name_parts[0][:150]
                first_name = " ".join(name_parts[1:])[:150] if len(name_parts) > 1 else "Pasteur"

                # Recherche ou création de l'utilisateur
                user = None
                if phone:
                    user = CustomUser.objects.filter(phone=phone).first()
                if not user:
                    user = CustomUser.objects.filter(email=email).first()
                
                if not user:
                    user = CustomUser.objects.create_user(
                        email=email,
                        phone=phone,
                        password="PasswordSGL2025!", 
                        first_name=last_name,
                        last_name=first_name,
                        role='pasteur_local'
                    )
                    print(f"  Pasteur créé: {full_name} ({email})")

                # Création/Récupération de la Ville
                ville_name = current_eglise_name.capitalize()[:100]
                ville, _ = Ville.objects.get_or_create(
                    nom=ville_name,
                    region=current_region or default_region
                )

                # Création de l'Église
                eglise, created = Eglise.objects.get_or_create(
                    nom=current_eglise_name[:100],
                    defaults={
                        'region': current_region or default_region,
                        'ville': ville,
                        'pasteur': user,
                        'phone': phone
                    }
                )
                
                if created:
                    count_created += 1
                    print(f"  Église créée: {current_eglise_name}")
                elif not eglise.pasteur:
                    eglise.pasteur = user
                    eglise.save()
            except Exception as row_error:
                print(f"Erreur ligne {row_idx}: {row_error}")
                # On continue l'importation pour les autres lignes
                continue

        print(f"Importation terminée. {count_created} nouvelles églises créées.")

    except Exception as e:
        print(f"Erreur lors de l'importation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    file_path = "/home/herve/loqt/DECOUPAGE EBNG-CI (6) (1).xlsx"
    import_data(file_path)
