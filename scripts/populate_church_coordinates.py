import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'loqt.settings')
django.setup()

from logistque.models import Eglise

COORDINATES_MAP = {
    'ANGRE': (5.412, -3.987),
    'E/CHINOISE': (5.340, -4.000),
    'ABOBO AKEKOI': (5.420, -4.015),
    'ABOBO MARAHOUE': (5.430, -4.020),
    'BIABOU': (5.435, -4.008),
    'ANYAMA': (5.494, -4.051),
    'AZAGUIE': (5.633, -4.083),
    'ALEPE': (5.498, -3.663),
    'AGBOVILLE': (5.929, -4.218),
    'ADZOPE': (6.107, -3.862),
    'GBANGUIE': (6.120, -3.870),
    'AKOUPE': (6.383, -3.883),
    'ABENGOUROU': (6.729, -3.496),
    'BONGOUANOU': (6.647, -4.200),
    'ARRAH': (6.671, -3.971),
    'AGNIBILEKRO': (7.130, -3.204),
    'BONDOUKOU': (8.040, -2.800),
    'COCODY': (5.346, -3.985),
    'ADJAME': (5.355, -4.021),
    'KOUMASSI': (5.300, -3.990),
    'TREICHVILLE': (5.307, -4.027),
    'BINGERVILLE': (5.357, -3.896),
    'MAROC PAYS': (5.370, -4.080),
    'N’ZEREKORE': (7.756, -8.817),
    'TOIT ROUGE': (5.334, -4.075),
    'SONGON': (5.321, -4.261),
    'DABOU': (5.325, -4.377),
    'JACQUEVILLE': (5.207, -4.414),
    'GRAND LAHOU': (5.138, -5.024),
    'MAROC': (5.365, -4.075),
    'NIANGON': (5.348, -4.095),
    'ATTINGUIE': (5.417, -4.183),
    'ADAROME': (5.500, -4.300),
    'SIKENSI': (5.676, -4.575),
    'N’DOUCI': (5.975, -4.630),
    'DALOA': (6.877, -6.450),
    'GONATE': (6.917, -6.317),
    'ISSIA': (6.492, -6.586),
    'ZOUGOUGBEU': (6.767, -6.867),
    'GADOUAN': (6.900, -6.650),
    'VAVOUA': (7.381, -6.477),
    'ZUENOULA': (7.430, -6.049),
    'SEGUELA': (7.961, -6.673),
    'SAN-PEDRO': (4.748, -6.636),
    'G-BEREBY': (4.817, -6.917),
    'TOUIH': (5.150, -6.750),
    'TABOU': (4.423, -7.362),
    'SOUBRE': (5.785, -6.608),
    'FRESCO': (5.089, -5.564),
    'ME’AGUI': (5.405, -6.814),
    'GONZAGUEVILLE': (5.240, -3.910),
    'PORT-BOUET': (5.253, -3.953),
    'G. BASSAM': (5.210, -3.738),
    'BONOUA': (5.272, -3.595),
    'ADIAKE': (5.286, -3.300),
    'ABOISSO': (5.467, -3.208),
    'ASSINIE': (5.130, -3.280),
    'MAFERE': (5.350, -3.000),
    'EHANIA': (5.400, -2.950),
    'AYAME': (5.604, -3.167),
    'BOUAKE': (7.693, -5.031),
    'BEOUMI': (7.671, -5.580),
    'SAKASSOU': (7.455, -5.292),
    'DJEBONOUA': (7.467, -5.050),
    'DAOUKRO': (7.059, -3.963),
    'M’BAHIAKRO': (7.450, -4.333),
    'YAKRO': (6.820, -5.276),
    'TIEBISSOU': (7.157, -5.221),
    'BOUAFLE': (6.989, -5.748),
    'SINFRA': (6.619, -5.912),
    'OUME': (6.383, -5.417),
    'TOUMODI': (6.554, -5.018),
    'TAABO': (6.217, -5.050),
    'DIMBOKRO': (6.647, -4.705),
    'BOCANDA': (7.067, -4.500),
    'DIVO': (5.837, -5.357),
    'OGOUDOU': (5.867, -5.117),
    'LAKOTA': (5.847, -5.681),
    'HIRE': (6.067, -5.333),
    'HERMANKONO': (5.667, -5.300),
    'GAGNOA': (6.131, -5.950),
    'MAN': (7.412, -7.553),
    'TOUBA': (8.283, -7.683),
    'BANGOLO': (7.017, -7.483),
    'DANANE': (7.259, -8.156),
    'DUEKOUE': (6.746, -7.349),
    'GUIGLO': (6.543, -7.493),
    'BLOLEQUIN': (6.568, -8.000),
    'TOULEPLEU': (6.583, -8.417),
    'KORHOGO': (9.458, -5.629),
    'FERKESSEDOUGOU': (9.592, -5.195),
    'ODIENNE': (9.505, -7.564),
    'Eglise Centrale': (5.346, -3.985),
}

updated = 0
for eglise in Eglise.objects.all():
    name = eglise.nom.upper()
    coords = None
    for key, val in COORDINATES_MAP.items():
        if key in name or name in key:
            coords = val
            break
    if coords:
        eglise.latitude = coords[0]
        eglise.longitude = coords[1]
        eglise.save()
        updated += 1

print(f"Mise à jour réussie de {updated} églises !")
