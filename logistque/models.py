# models.py
import os
from django.conf import settings
from django.forms import ValidationError
from django.urls import reverse
from django.utils import timezone
from django.db import models
import requests
# from accounts.models import CustomUser
from django.utils.safestring import mark_safe
import qrcode
import barcode
from PIL import Image, ImageDraw, ImageEnhance,ImageOps, ImageFont
from PIL.ImageEnhance import Brightness, Contrast
from barcode.writer import ImageWriter
from io import BytesIO
from django.core.files import File
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils.html import mark_safe
from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from datetime import datetime, date, time
from django.contrib.auth.models import Permission

# Import des modèles pour éviter les références circulaires
from django.contrib.auth.models import User

#from PIL import ImageEnhance
# models.py
User = settings.AUTH_USER_MODEL
class Region(models.Model):
    nom = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom

    class Meta:
        verbose_name = "Région"
        verbose_name_plural = "Régions"

class Ville(models.Model):
    nom = models.CharField(max_length=100)
    region = models.ForeignKey(Region, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.nom} ({self.region.nom})"
    
    class Meta:
        verbose_name = "Ville"
        verbose_name_plural = "Villes"

class CampMondial(models.Model):
    titre = models.CharField(max_length=150)
    ville = models.ForeignKey(Ville, on_delete=models.CASCADE)
    date_debut = models.DateField()
    date_fin = models.DateField()
    description = models.TextField()
    renfort_national = models.BooleanField(default=False)
    image = models.ImageField(upload_to='camps/', null=True, blank=True)

    class Meta:
        ordering = ['-date_debut']

    def __str__(self):
        return f"Camp {self.titre} à {self.ville.nom}"
    
    def image_preview(self):
        if self.image:
            return mark_safe(f'<img src="{self.image.url}" width="50" height="50" />')
        return "-"
    
    image_preview.short_description = "Image"
    image_preview.allow_tags = True

class CampMateriel(models.Model):
    camp = models.ForeignKey(CampMondial, on_delete=models.CASCADE)
    materiel = models.ForeignKey('Materiel', on_delete=models.CASCADE)
    quantite_utilisee = models.PositiveIntegerField()
    date_utilisation = models.DateField(auto_now=True)

    def __str__(self):
        return f"{self.materiel.nom} pour {self.camp.titre}"
    
    class Meta:
        verbose_name = "Matériel Utilisé"
        verbose_name_plural = "Matériels Utilisés"

def resize_logo_for_qr(logo_path):
    """Redimensionne le logo pour l’insérer au centre du QR code."""
    logo = Image.open(logo_path).convert("RGBA")
    logo.thumbnail((500, 500))
    return logo

class Eglise(models.Model):
    nom = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    image = models.ImageField(upload_to='eglises/', null=True, blank=True)
    pays = models.CharField(max_length=100, blank=True, null=True,default='Côte d\'Ivoire')
    latitude = models.FloatField(max_length=9, blank=True, null=True)
    longitude = models.FloatField(max_length=9, blank=True, null=True)
    region = models.ForeignKey(Region, on_delete=models.CASCADE,related_name='region_eglise', null=True, blank=True)
    ville = models.ForeignKey(Ville, on_delete=models.CASCADE,related_name='ville_eglise')
    pasteur = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, related_name='pasteur_eglise')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    logo = models.ImageField(upload_to='logos_eglises/', null=True, blank=True, default=f'logo_ebng.png',auto_created=True,error_messages={'error': 'Le chemin vers le logo est requis.'})
    is_active = models.BooleanField(default=True, verbose_name="Est active")
    is_national_hq = models.BooleanField(default=False, verbose_name="Siège National")


    class Meta:
        verbose_name = "Eglise"
        verbose_name_plural = "Eglises"

    def __str__(self):
        return f"{self.nom} ({self.ville.nom})"

    # champ temporaire, non stocké en base
    _request = None

    def set_request(self, request):
        self._request = request

    def save(self, *args, **kwargs):
            
        if self._request and not self.ville:  # ne géolocalise que si pas encore renseigné
            ip = self._get_client_ip()
            if ip:
                try:
                    response = requests.get(f'https://ipapi.co/{ip}/json/')
                    if response.status_code == 200:
                        data = response.json()
                        self.ville = data.get('city')
                        self.pays = data.get('country_name')
                        loc = data.get('loc')  # format : "lat,lon"
                        if loc:
                            lat, lon = loc.split(',')
                            self.latitude = lat
                            self.longitude = lon
                except Exception as e:
                    print("Erreur géolocalisation IP :", e)
        super().save(*args, **kwargs)
        

    def _get_client_ip(self):
        x_forwarded_for = self._request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return self._request.META.get('REMOTE_ADDR')
    
    class Meta:
        verbose_name = "Eglise"
        verbose_name_plural = "Eglises"

class Logistique(models.Model):
    eglise = models.OneToOneField(Eglise, on_delete=models.CASCADE,related_name='logistique_eglise')
    responsable = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, related_name='responsable_logistique')

    def __str__(self):
        return f"Logistique de {self.eglise.nom}"
    
    class Meta:
        verbose_name = "Logistique"
        verbose_name_plural = "Logistiques"

class MembreLogistique(models.Model):
    utilisateur = models.OneToOneField(User, on_delete=models.CASCADE)
    logistique = models.ForeignKey(Logistique, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.utilisateur.get_full_name()} - {self.logistique}"
    
    class Meta:
        verbose_name = "Membre Logistique"
        verbose_name_plural = "Membres Logistique"

class CategorieMateriel(models.Model):
    nom = models.CharField(max_length=100)

    def __str__(self):
        return self.nom
    
    class Meta:
        verbose_name = "Catégorie de Matériel"
        verbose_name_plural = "Catégories de Matériels"
        
        
class SousCategorieMateriel(models.Model):
    categorie = models.ForeignKey(CategorieMateriel, on_delete=models.CASCADE,
    null=True,
    blank=True,
    verbose_name="Sous-Catégorie")
    nom = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.categorie} - {self.nom}"
    
    class Meta:
        verbose_name = "Sous-Catégorie de Matériel"
        verbose_name_plural = "Sous-Catégories de Matériels"

import unicodedata      

def remove_accents(text):
    """ supprimer les accents et caractères spéciaux du texte"""
    return ''.join(
        c for c in unicodedata.normalize('NFD', text)
        if unicodedata.category(c) != 'Mn'
    )

class Materiel(models.Model):
    ETAT_CHOICES = [
        ('OP', 'Opérationnel'),
        ('PA', 'En panne'),
        ('RE', 'En réparation'),
        ('PE', 'Perdu'),
    ]
    nom = models.CharField(max_length=100, verbose_name='Nom')
    identifiant_unique = models.CharField(max_length=50, unique=True, blank=True, null=True, verbose_name='ID Unique')
    categorie = models.ForeignKey(CategorieMateriel, on_delete=models.SET_NULL, null=True, verbose_name='Catégorie', related_name='materiels_categorie')
    sous_categorie = models.ForeignKey(SousCategorieMateriel, on_delete=models.CASCADE, null=True, blank=True, verbose_name='Sous-Catégorie', related_name='materiels_sous_categorie')
    quantite = models.PositiveIntegerField(verbose_name='Quantité')
    etat = models.CharField(max_length=2, choices=ETAT_CHOICES, default='OP', verbose_name='État')
    image = models.ImageField(upload_to='materiels/', null=True, blank=True, verbose_name='Image')
    description = models.TextField(blank=True, null=True, verbose_name='Description')
    logistique = models.ForeignKey(Logistique, on_delete=models.CASCADE, verbose_name='Logistique', related_name='materiels_logistique')
    eglise = models.ForeignKey(Eglise, on_delete=models.CASCADE, null=True, blank=True, verbose_name='Eglise', related_name='materiels_eglise')
    is_deleted = models.BooleanField(default=False, verbose_name='Supprimer')
    slug = models.SlugField(unique=True, blank=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True, verbose_name='QR Code')
    code_barre = models.ImageField(upload_to='barcodes/', blank=True, null=True, verbose_name='Code Barre')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Date de Création', null=True, blank=True)

    def __str__(self):
        return f"{self.nom} ({self.quantite})"
    
    def image_materiel_preview(self):
        if not self.image:
            try:
                self.image = self.images_materiel.first().image
            except AttributeError:
                return ''
        return mark_safe(f'<img src="{self.image.url}" width="50" height="50" />')
    image_materiel_preview.short_description = 'Image'
    image_materiel_preview.allow_tags = True

    def _generate_qr_data(self):
            """Génère le texte structuré pour le QR code avec toutes les infos"""
            try:
                base_url = settings.SITE_DOMAIN
                if not base_url.startswith(('http://', 'https://')):
                    base_url = f'https://{base_url}'
                
                public_url = f"{base_url}{reverse('materiel-detail', args=[self.pk, self.slug])}"
                
                data_lines = [
                    f"=== {self.eglise.nom if self.eglise else 'Non spécifié'} ===",
                    f"� Matériel: {self.nom}",
                    "",
                    "👤 Responsable:",
                    f"📞 {self.logistique.responsable.get_full_name() if self.logistique and self.logistique.responsable else 'Non spécifié'}",
                    "",
                    f"🔗 Lien: {public_url}",
                    f"📅 Créé le: {self.created_at.strftime('%d/%m/%Y %H:%M')}",
                    "=== Scannez pour plus d'infos ==="
                ]
                
                return '\n'.join(data_lines)
            except Exception:
                # Fallback si erreur de génération
                return f"Matériel: {self.nom}\nQuantité: {self.quantite}\nID: {self.pk}"
            
            return '\n'.join(data_lines)

    def _generate_styled_qr_code(self, data, logo_path=None):
        """Génère un QR code stylisé avec logo centré"""
        qr = qrcode.QRCode(
            version=None,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=12,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        # Style personnalisé
        img_qr = qr.make_image(
            fill_color="#2563eb",  # Bleu vif
            back_color="#f8fafc"   # Blanc cassé
        ).convert('RGB')
        
        # Amélioration qualité
        img_qr = ImageEnhance.Sharpness(img_qr).enhance(1.4)
        
        # Ajout du logo
        if logo_path and os.path.exists(logo_path):
            try:
                logo = Image.open(logo_path).convert('RGBA')
                qr_size = img_qr.size[0]
                
                # Taille du logo (18% de la taille du QR)
                logo_size = max(1, int(qr_size * 0.18))
                logo.thumbnail((logo_size, logo_size), Image.LANCZOS)
                
                # Création d'un fond blanc arrondi
                bg_size = int(logo_size * 1.2)
                bg = Image.new('RGBA', (bg_size, bg_size), (255, 255, 255, 0))
                mask = Image.new('L', (bg_size, bg_size), 0)
                draw = ImageDraw.Draw(mask)
                draw.ellipse((0, 0, bg_size, bg_size), fill=255)
                
                # Positionnement du logo au centre du fond
                logo_pos = ((bg_size - logo.size[0]) // 2, (bg_size - logo.size[1]) // 2)
                bg.paste(logo, logo_pos, logo)
                
                # Positionnement sur le QR code
                qr_pos = (
                    (img_qr.size[0] - bg_size) // 2,
                    (img_qr.size[1] - bg_size) // 2
                )
                img_qr.paste(bg, qr_pos, mask)
            except Exception as e:
                print(f"Erreur traitement logo: {e}")
        
        return img_qr

    def _generate_custom_barcode(self, data, user_info):
        """Génère un code-barres avec infos utilisateur"""
        # Configuration
        options = {
            'write_text': False,
            'quiet_zone': 6,
            'module_height': 10,
            'background': '#ffffff',
            'foreground': '#1e3a8a',
            'font_size': 14,
            'text_distance': 4
        }
        
        # Génération du code-barres dans un buffer
        code128 = barcode.get_barcode_class('code128')
        barcode_buffer = BytesIO()
        code128(data, writer=ImageWriter()).write(barcode_buffer, options)
        barcode_buffer.seek(0)
        barcode_img = Image.open(barcode_buffer)
        
        # Préparation du texte
        user_text = f"{user_info.get('nom', '')} {user_info.get('prenom', '')}"
        phone_text = f"Tél: {user_info.get('phone', '')}"
        
        # Calcul des dimensions
        draw = ImageDraw.Draw(barcode_img)
        try:
            font = ImageFont.truetype("arial.ttf", 16)
        except:
            font = ImageFont.load_default()
        
        # Agrandir l'image pour le texte
        new_height = barcode_img.height + 50
        new_img = Image.new('RGB', (barcode_img.width, new_height), 'white')
        new_img.paste(barcode_img, (0, 0))
        draw = ImageDraw.Draw(new_img)
        
        # Ajout des textes
        text_y = barcode_img.height + 10
        draw.text(
            (10, text_y), 
            user_text, 
            fill='#1e3a8a', 
            font=font
        )
        draw.text(
            (10, text_y + 25), 
            phone_text, 
            fill='#4b5563', 
            font=font
        )
        
        # Ajout d'un petit texte d'identification
        draw.text(
            (barcode_img.width - 100, text_y + 15),
            f"MAT-{self.pk}",
            fill='#9ca3af',
            font=font
        )
        
        return new_img
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nom)
        
        super().save(*args, **kwargs)
        
        # Données utilisateur
        user_info = {
            'nom': self.logistique.responsable.last_name if self.logistique and self.logistique.responsable else '',
            'prenom': self.logistique.responsable.first_name if self.logistique and self.logistique.responsable else '',
            'phone': self.logistique.responsable.phone if self.logistique and self.logistique.responsable else ''
        }
        
        # Génération QR code
        qr_data = self._generate_qr_data()
        logo_path = self.eglise.logo.path if self.eglise and self.eglise.logo else None
        qr_img = self._generate_styled_qr_code(qr_data, logo_path)
        
        qr_io = BytesIO()
        qr_img.save(qr_io, format='PNG', optimize=True, quality=95)
        self.qr_code.save(f"qr_{self.slug}_{self.pk}.png", File(qr_io), save=False)
        
        # Génération code-barres
        barcode_data = f"MAT{self.pk}{self.logistique.responsable.id if self.logistique and self.logistique.responsable else 0}"
        barcode_img = self._generate_custom_barcode(barcode_data, user_info)

        barcode_io = BytesIO()
        barcode_img.save(barcode_io, format='PNG')
        barcode_io.seek(0)
        self.code_barre.save(f"barcode_{self.slug}_{self.pk}.png", File(barcode_io), save=False)
        
        super().save(update_fields=['qr_code', 'code_barre', 'slug'])
    
    def code_barre_previews(self):
        if not self.code_barre:
            return ''
        return mark_safe(f'<img src="{self.code_barre.url}" width="100" height="50" />')
    code_barre_previews.short_description = 'Code Barre'
    code_barre_previews.allow_tags = True
    
    def qr_code_previews(self):
        if not self.qr_code:
            return ''
        return mark_safe(f'<img src="{self.qr_code.url}" width="50" height="50" />')
    qr_code_previews.short_description = 'QR Code'
    qr_code_previews.allow_tags = True
    
    def get_absolute_url(self):
        return reverse('materiel-detail', kwargs={'pk': self.pk, 'slug': self.slug})
    
    class Meta:
        verbose_name = "Matériel"
        verbose_name_plural = "Matériels"
        ordering = ['nom']

class MaterielImage(models.Model):
    materiel = models.ForeignKey(Materiel, related_name='images_materiel', on_delete=models.CASCADE,
    null=True,
    blank=True,
    verbose_name="Matériel")
    image = models.ImageField(upload_to='materiel/images/',
    null=True,
    blank=True,
    verbose_name="Image")
    description = models.CharField(max_length=255, blank=True,
    null=True,
    verbose_name="Description")

    def __str__(self):
        return f"Image de {self.materiel.nom}"
    
    class Meta:
        verbose_name = "Image de Matériel"
        verbose_name_plural = "Images de Matériels"
        
        ordering = ['materiel']
        
    def previews(self):
        return mark_safe(f'<img src="{self.image.url}" width="50" height="50" />')
    previews.short_description = 'Image'
    previews.allow_tags = True

class MouvementMateriel(models.Model):
    TYPE_MOUVEMENT = [
        ('IN', 'Entrée (Check-in)'),
        ('OUT', 'Sortie (Check-out)'),
        ('PRET', 'Prêt / Appui'),
    ]
    materiel = models.ForeignKey(Materiel, on_delete=models.CASCADE, related_name='mouvements')
    type_mouvement = models.CharField(max_length=4, choices=TYPE_MOUVEMENT)
    eglise_origine = models.ForeignKey(Eglise, on_delete=models.CASCADE, related_name='mouvements_sortants')
    eglise_destination = models.ForeignKey(Eglise, on_delete=models.CASCADE, related_name='mouvements_entrants', null=True, blank=True)
    evenement = models.ForeignKey('Evenement', on_delete=models.SET_NULL, null=True, blank=True)
    quantite = models.PositiveIntegerField()
    date_mouvement = models.DateTimeField(default=timezone.now)
    responsable = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    batch_id = models.CharField(max_length=50, blank=True, null=True, verbose_name="ID de Batch")
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = "Mouvement de Matériel"
        verbose_name_plural = "Mouvements de Matériel"

class FicheDefectuosite(models.Model):
    GRAVITE_CHOICES = [
        ('Low', 'Faible'),
        ('Medium', 'Moyen'),
        ('Critical', 'Critique'),
    ]
    materiel = models.ForeignKey(Materiel, on_delete=models.CASCADE, related_name='fiches_defectuosite')
    rapporteur = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField(verbose_name="Description de la panne")
    photo = models.ImageField(upload_to='pannes/', null=True, blank=True)
    niveau_gravite = models.CharField(max_length=10, choices=GRAVITE_CHOICES, default='Medium')
    date_signalement = models.DateTimeField(auto_now_add=True)
    repare = models.BooleanField(default=False)
    date_reparation = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Fiche de défectuosité"
        verbose_name_plural = "Fiches de défectuosité"
    

class PoleCompetence(models.Model):
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Pôle de Compétence"
        verbose_name_plural = "Pôles de Compétence"

    def __str__(self):
        return self.nom

# # Model pour les événements
class Evenement(models.Model):
    TYPE_ORGANISATEUR = [
        ('eglise', 'Église'),
        ('externe', 'Entité Externe')
    ]
    
    TYPE_EVENEMENT = [
        ('seminaire', 'Séminaire'),
        ('conference', 'Conférence'),
        ('culte', 'Culte Spécial'),
        ('concert', 'Concert'),
        ('camp', 'Camp Mondial'),
        ('autre', 'Autre')
    ]

    TYPE_PROGRAMME = [
        ('national', 'National'),
        ('local', 'Local'),
    ]
    
    STATUS_EVENTS = [
        ('en_attente', 'En attente'),
        ('valide', 'Validé'),
        ('refuse', 'Refusé')
    ]

    titre = models.CharField(max_length=200, verbose_name="Titre de l'événement")
    type_evenement = models.CharField(max_length=20, choices=TYPE_EVENEMENT, verbose_name="Type d'événement")
    type_programme = models.CharField(max_length=10, choices=TYPE_PROGRAMME, default='local', verbose_name="Échelle du programme")
    organisateur_type = models.CharField(
        max_length=20, 
        choices=TYPE_ORGANISATEUR, 
        verbose_name="Type d'organisateur",
        blank=True, 
        null=True
    )
    lieu = models.CharField(max_length=200, verbose_name="Lieu de l'événement", blank=True, null=True)
    organisateur_nom = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Nom de l'organisateur"
    )
    eglise = models.ForeignKey(
        'Eglise', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name="Église concernée"
    )
    date_debut = models.DateTimeField(verbose_name="Date et heure de début", null=True, blank=True)
    date_fin = models.DateTimeField(verbose_name="Date et heure de fin", null=True, blank=True)
    formatted_date_debut = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Date de début formatée"
    )
    formatted_date_fin = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        verbose_name="Date de fin formatée"
    )
    description = models.TextField(blank=True, verbose_name="Description", null=True)
    chronogramme = models.JSONField(
        default=list, 
        blank=True,
        verbose_name="Programme détaillé (JSON)"
    )
    logisticiens_gestion = models.ManyToManyField(
        User, 
        blank=True,
        related_name='evenements_logisticiens', 
        verbose_name='Logisticiens assignés'
    )
    materiels_utilises = models.ManyToManyField(
        'Materiel',
        through='logistque.EvenementMateriel',
        related_name='evenements',
        blank=True,
        verbose_name='Matériels utilisés',
        help_text='Matériels utilisés pour cet événement'
    )
    image = models.ImageField(
        upload_to='evenements/', 
        null=True, 
        blank=True, 
        verbose_name="Image de l'événement"
    )
    besoin_chronogramme = models.BooleanField(
        default=False, 
        verbose_name="Nécessite un chronogramme ?"
    )
    besoin_images = models.BooleanField(
        default=False, 
        verbose_name="Nécessite des images d'illustration ?"
    )
    statut = models.CharField(
        max_length=20, 
        choices=STATUS_EVENTS,
        default='en_attente',
        verbose_name="Statut de l'événement"
    )
    def get_status(self):
        """Détermine automatiquement le statut en fonction des dates actuelles"""
        from django.utils import timezone
        now = timezone.now()
        if self.date_debut and self.date_fin:
            if now < self.date_debut:
                return 'À venir'
            elif self.date_debut <= now <= self.date_fin:
                return 'En cours'
            else:
                return 'Terminé'
        return 'Non défini'

    class Meta:
        verbose_name = "Événement"
        verbose_name_plural = "Événements"
        ordering = ['date_debut']
        constraints = [
            models.UniqueConstraint(
                fields=['titre', 'date_debut'], 
                name='unique_evenement_date'
            ),
            models.CheckConstraint(
                check=models.Q(date_fin__gt=models.F('date_debut')),
                name='check_date_fin_apres_debut',
                violation_error_message="La date de fin doit être postérieure à la date de début"
            )
        ]

    @property
    def status_display(self):
        """Retourne le statut formaté pour l'affichage"""
        status = self.get_status()
        status_classes = {
            'À venir': 'badge badge-info',
            'En cours': 'badge badge-success',
            'Terminé': 'badge badge-secondary',
            'Non défini': 'badge badge-warning'
        }
        return mark_safe(f'<span class="{status_classes.get(status, "badge")}">{status}</span>')

    def export_to_dict(self):
        """Exporte les données de l'événement dans un dictionnaire"""
        return {
            'id': self.id,
            'titre': self.titre,
            'type_evenement': self.get_type_evenement_display(),
            'organisateur_type': self.get_organisateur_type_display() if self.organisateur_type else None,
            'organisateur_nom': self.organisateur_nom,
            'eglise': self.eglise.nom if self.eglise else None,
            'lieu': self.lieu,
            'date_debut': self.date_debut.isoformat() if self.date_debut else None,
            'date_fin': self.date_fin.isoformat() if self.date_fin else None,
            'description': self.description,
            'statut': self.get_status(),
            'materiels': [{
                'nom': em.materiel.nom,
                'quantite': em.quantite,
                'categorie': em.materiel.categorie.nom if em.materiel.categorie else None
            } for em in self.materiels_associes.all()],
            'participants': [{
                'nom': p.nom,
                'prenom': p.prenom,
                'email': p.email,
                'telephone': p.telephone
            } for p in self.participants.all()]
        }

    def __str__(self):
        return f"{self.titre} - {self.get_type_evenement_display()} - {self.date_debut.strftime('%d/%m/%Y') if self.date_debut else 'Date non définie'}"
    
    def clean(self):
        """Validation personnalisée du modèle"""
        super().clean()
        
        # Vérification des dates
        if self.date_debut and self.date_fin and self.date_fin <= self.date_debut:
            raise ValidationError({
                'date_fin': 'La date de fin doit être postérieure à la date de début.'
            })
            
        # Si l'organisateur est une église, on s'assure que le champ eglise est rempli
        if self.organisateur_type == 'eglise' and not self.eglise:
            raise ValidationError({
                'eglise': 'Une église doit être sélectionnée lorsque le type d\'organisateur est "Église".'
            })
            
        # Si l'organisateur est externe, on s'assure que le nom est renseigné
        if self.organisateur_type == 'externe' and not self.organisateur_nom:
            raise ValidationError({
                'organisateur_nom': 'Le nom de l\'organisateur est obligatoire pour un organisateur externe.'
            })
    
    def save(self, *args, **kwargs):
        """Surcharge de la méthode save pour inclure la validation"""
        self.full_clean()
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('events:event_detail', kwargs={'pk': self.pk})

class EvenementImage(models.Model):
    evenement = models.ForeignKey(
        'Evenement', 
        on_delete=models.CASCADE, 
        related_name='images_illustration',
        verbose_name="Événement"
    )
    image = models.ImageField(upload_to='evenements/illustrations/', verbose_name="Image")
    date_ajoutee = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Illustration d'Événement"
        verbose_name_plural = "Illustrations d'Événements"
        ordering = ['-date_ajoutee']

class EvenementMateriel(models.Model):
    """
    Modèle de relation entre un événement et un matériel avec quantité.
    Gère la validation des quantités et la cohérence des données.
    """

    evenement = models.ForeignKey(
        'Evenement',
        on_delete=models.CASCADE,
        related_name='materiels_associes',
        verbose_name="Événement",
        null=True,
        blank=True,
        help_text="Événement auquel le matériel est associé"
    )
    materiel = models.ForeignKey(
        'Materiel',
        on_delete=models.CASCADE,
        related_name='evenements_associes',
        verbose_name="Matériel",
        null=True,
        blank=True,
        help_text="Matériel utilisé pour l'événement"
    )
    quantite = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name="Quantité",
        null=True,
        blank=True,
        help_text="Quantité de matériel utilisée pour l'événement"
    )
    date_ajout = models.DateTimeField(auto_now_add=True)
    ajoute_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Ajouté par",
        help_text="Utilisateur qui a ajouté le matériel"
    )

    class Meta:
        unique_together = ('evenement', 'materiel')
        verbose_name = "Matériel d'événement"
        verbose_name_plural = "Matériels d'événement"

class PermissionRequest(models.Model):
    """
    Modèle pour gérer les demandes de permission des utilisateurs
    """
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('rejected', 'Rejetée'),
    ]
    
    ACTION_TYPE_CHOICES = [
        ('create', 'Création'),
        ('update', 'Modification'),
        ('delete', 'Suppression'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name="Utilisateur",
        related_name='permission_requests'
    )
    reason = models.TextField(
        verbose_name="Raison de la demande",
        help_text="Expliquez pourquoi vous avez besoin de cette permission"
    )
    action_type = models.CharField(
        max_length=10,
        choices=ACTION_TYPE_CHOICES,
        default='create',
        verbose_name="Type d'action"
    )
    materiel_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        verbose_name="ID du matériel (si applicable)"
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name="Statut"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de demande"
    )
    reviewed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de révision"
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_permissions',
        verbose_name="Révisé par"
    )
    admin_notes = models.TextField(
        null=True,
        blank=True,
        verbose_name="Notes de l'administrateur"
    )
    
    class Meta:
        verbose_name = "Demande de permission"
        verbose_name_plural = "Demandes de permission"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Demande de {self.user.get_full_name()} - {self.get_action_type_display()}"
    
    def approve(self, reviewed_by):
        """Approuver la demande de permission"""
        self.status = 'approved'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by
        self.save()
        
        # Donner les permissions à l'utilisateur
        if self.action_type == 'create':
            self.user.user_permissions.add(
                Permission.objects.get(codename='add_materiel')
            )
        elif self.action_type == 'update':
            self.user.user_permissions.add(
                Permission.objects.get(codename='change_materiel')
            )
        elif self.action_type == 'delete':
            self.user.user_permissions.add(
                Permission.objects.get(codename='delete_materiel')
            )
    
    def reject(self, reviewed_by, notes=''):
        """Rejeter la demande de permission"""
        self.status = 'rejected'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by
        self.admin_notes = notes
        self.save()

class ChronogrammeItem(models.Model):
    """
    Modèle représentant un élément du programme détaillé d'un événement.
    Gère les créneaux horaires, les responsables et le matériel nécessaire.
    """
    evenement = models.ForeignKey(
        Evenement, 
        on_delete=models.CASCADE, 
        related_name='chronogramme_evenement', 
        verbose_name='Événement',
        null=True,
        blank=True,
        help_text="Événement auquel cet élément de chronogramme est associé"
    )
    
    # Informations temporelles
    heure_debut = models.TimeField(
        verbose_name='Heure de début',
        null=True,
        blank=True,
        help_text="Heure de début de l'activité"
    )
    heure_fin = models.TimeField(
        verbose_name='Heure de fin',
        null=True,
        blank=True,
        help_text="Heure de fin de l'activité"
    )
    
    # Détails de l'activité
    titre = models.CharField(
        max_length=100, 
        verbose_name='Titre',
        null=True,
        blank=True,
        help_text="Titre de l'activité (ex: 'Cérémonie d'ouverture')"
    )
    description = models.TextField(
        verbose_name='Description',
        null=True,
        blank=True,
        help_text="Description détaillée de l'activité"
    )
    
    # Responsable et participants
    responsable = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name='Responsable',
        help_text="Membre en charge de cette activité"
    )
    pole = models.ForeignKey(
        PoleCompetence, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        verbose_name='Pôle de compétence'
    )
    
    # Matériel nécessaire
    materiels_needed = models.ManyToManyField(
        'Materiel', 
        blank=True, 
        verbose_name='Matériels nécessaires', 
        related_name='chronogramme_items',
        help_text="Matériel nécessaire pour cette activité"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création",
        null=True,
        blank=True
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification",
        null=True,
        blank=True
    )
    cree_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='activites_crees',
        verbose_name="Créé par",
        help_text="Utilisateur qui a créé cette activité",
        blank=True,
        
    )

    class Meta:
        verbose_name = "Élément du chronogramme"
        verbose_name_plural = "Éléments du chronogramme"
        ordering = ['heure_debut']
        constraints = [
            models.CheckConstraint(
                check=models.Q(heure_fin__gt=models.F('heure_debut')),
                name='check_heure_fin_apres_debut',
                violation_error_message="L'heure de fin doit être postérieure à l'heure de début"
            )
        ]

    def __str__(self):
        return f"{self.titre} ({self.heure_debut.strftime('%H:%M')}-{self.heure_fin.strftime('%H:%M')})"
    
    def clean(self):
        """
        Validation personnalisée pour s'assurer de la cohérence des données.
        """
        super().clean()
        
        # Vérification que l'heure de fin est postérieure à l'heure de début
        if self.heure_fin and self.heure_debut and self.heure_fin <= self.heure_debut:
            raise ValidationError({
                'heure_fin': "L'heure de fin doit être postérieure à l'heure de début."
            })
        
        # Vérification des chevauchements d'horaire pour le même événement
        if self.evenement_id and self.heure_debut and self.heure_fin:
            chevauchements = ChronogrammeItem.objects.filter(
                evenement=self.evenement,
                heure_debut__lt=self.heure_fin,
                heure_fin__gt=self.heure_debut
            ).exclude(pk=self.pk if self.pk else None)
            
            if chevauchements.exists():
                raise ValidationError({
                    'heure_debut': "Ce créneau horaire chevauche une autre activité du programme."
                })
    
    def save(self, *args, **kwargs):
        """Surcharge de la méthode save pour inclure la validation"""
        self.full_clean()
        super().save(*args, **kwargs)

class ChronogrammeTemplate(models.Model):
    """
    Modèle pour stocker des chronogrammes réutilisables avec structure dynamique.
    """
    nom = models.CharField(max_length=200, verbose_name="Nom du modèle")
    description = models.TextField(blank=True, verbose_name="Description")
    headers = models.JSONField(default=list, verbose_name="En-têtes de colonnes (JSON)")
    items = models.JSONField(default=list, verbose_name="Items du chronogramme (JSON)")
    cree_par = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='chronogramme_templates',
        verbose_name="Créé par"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Modèle de Chronogramme"
        verbose_name_plural = "Modèles de Chronogramme"
        ordering = ['-created_at']

    def __str__(self):
        return self.nom
    
    @property
    def duree(self):
        """Calcule et retourne la durée de l'activité en minutes"""
        if not self.heure_debut or not self.heure_fin:
            return 0
            
        debut = datetime.combine(datetime.today(), self.heure_debut)
        fin = datetime.combine(datetime.today(), self.heure_fin)
        return int((fin - debut).total_seconds() / 60)
    
    @property
    def duree_formatee(self):
        """Retourne la durée formatée (ex: '2h30' ou '45min')"""
        minutes = self.duree
        if minutes >= 60:
            heures = minutes // 60
            minutes_restantes = minutes % 60
            if minutes_restantes > 0:
                return f"{heures}h{minutes_restantes:02d}"
            return f"{heures}h"
        return f"{minutes}min"
    
    def get_materiels_disponibles(self):
        """
        Retourne la liste des matériels disponibles pour cette activité
        en fonction des contraintes de l'événement.
        """
        if not hasattr(self, 'evenement'):
            return Materiel.objects.none()
            
        # Récupère les matériels déjà réservés pour cet événement
        materiels_reserves = self.evenement.materiels_utilises.all()
        
        # Filtre pour ne garder que les matériels disponibles
        return Materiel.objects.filter(
            quantite_disponible__gt=0,
            est_actif=True
        ).exclude(
            # Exclut les matériels déjà réservés pour d'autres créneaux
            chronogramme_items__in=ChronogrammeItem.objects.filter(
                evenement=self.evenement
            ).exclude(pk=self.pk if self.pk else None)
        ).distinct()

class ReservationMateriel(models.Model):
    evenement = models.ForeignKey(
        Evenement, 
        on_delete=models.CASCADE, 
        related_name='reservations_evenement',
        null=True,
        blank=True,
        verbose_name="Événement"
    )
    materiel = models.ForeignKey(
        Materiel, 
        on_delete=models.CASCADE, 
        related_name='reservations_materiel',
        null=True,
        blank=True,
        verbose_name="Matériel"
    )
    quantite = models.PositiveIntegerField(
        default=1, 
        validators=[MinValueValidator(1)],
        verbose_name="Quantité"
    )
    date_reserver = models.DateTimeField(null=True, blank=True, default=timezone.now)
    statut = models.CharField(
        max_length=20, 
        choices=[
            ('en_attente', 'En attente'),
            ('valide', 'Validé'),
            ('refuse', 'Refusé')
        ],
        default='en_attente',
        verbose_name="Statut de la réservation"
    )

    class Meta:
        verbose_name = "Réservation de Matériel"
        verbose_name_plural = "Réservations de Matériel"
    
    def __str__(self):
        return f"{self.materiel.nom} pour {self.evenement.titre} ({self.quantite})"
class PhotosEvenement(models.Model):
    evenement = models.ForeignKey(
        Evenement, 
        on_delete=models.CASCADE,
        related_name='photos',
        null=True,
        blank=True,
        verbose_name="Événement"
    )
    image = models.ImageField(
        upload_to='evenements/photos/', 
        null=True, 
        blank=True,
        verbose_name="Photo"
    )
    date_ajout = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date d'ajout",
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = "Photo d'événement"
        verbose_name_plural = "Photos d'événement"
        ordering = ['-date_ajout']

    def __str__(self):
        return f"Photo de {self.evenement.titre}"

    def image_evenement_preview(self):
        if not self.image:
            return ''
        return mark_safe(f'<img src="{self.image.url}" width="50" height="50" />')
    
    image_evenement_preview.short_description = 'Aperçu'
    image_evenement_preview.allow_tags = True

# Model pour les demandes de permission des logisticiens

class DemandePermission(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('approuvee', 'Approuvée'),
        ('refusee', 'Refusée'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    permission_demande = models.CharField(max_length=100, editable=False)  # caché côté formulaire
    raison = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    date_demande = models.DateTimeField(auto_now_add=True)
    date_traitement = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.statut}"
    
    def save(self, *args, **kwargs):
        if self.statut == 'approuvee':
            self.date_traitement = timezone.now()
        super().save(*args, **kwargs)
        
    def get_user_email(self):
        return self.user.email
    
    class Meta:
        verbose_name = "Demande de Permission"
        verbose_name_plural = "Demandes de Permission"
        
        
class FormationLogisticien(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="formation_logisticien")
    eglise = models.ForeignKey(Eglise, on_delete=models.CASCADE, related_name="formations")
    date_form = models.DateField(auto_now_add=True)
    est_forme = models.BooleanField(default=False)
    remarque = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.get_full_name()} - {'Formé' if self.est_forme else 'Non formé'}"
    
    class Meta:
        verbose_name = "Formation Logisticien"
        verbose_name_plural = "Formations Logisticiens"


# Phase 4: Formation & Réunions
class ReunionDimanche(models.Model):
    date_reunion = models.DateField(default=timezone.now)
    heure_debut = models.TimeField(default="20:00")
    heure_fin = models.TimeField(default="21:30")
    eglise_hote = models.ForeignKey(Eglise, on_delete=models.CASCADE, verbose_name="Église Hôte")
    ordre_du_jour = models.TextField()
    pv_reunion = models.TextField(blank=True, verbose_name="Procès-verbal")
    participants = models.ManyToManyField(User, blank=True)

    class Meta:
        verbose_name = "Réunion du Dimanche"
        verbose_name_plural = "Réunions du Dimanche"

class RessourceFormation(models.Model):
    TYPE_RESSOURCE = [
        ('video', 'Vidéo'),
        ('pdf', 'Document PDF'),
        ('autre', 'Autre'),
    ]
    titre = models.CharField(max_length=200)
    type_ressource = models.CharField(max_length=10, choices=TYPE_RESSOURCE)
    lien_url = models.URLField(blank=True, null=True)
    fichier = models.FileField(upload_to='formations/', blank=True, null=True)
    image = models.ImageField(upload_to='formations/thumbnails/', blank=True, null=True)
    description = models.TextField(blank=True)
    pole = models.ForeignKey(PoleCompetence, on_delete=models.SET_NULL, null=True, blank=True)
    date_ajout = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    class Meta:
        verbose_name = "Ressource de Formation"
        verbose_name_plural = "Ressources de Formation"

class DemandeFormationSGL(models.Model): # Renommé pour éviter conflit si présent
    rll = models.ForeignKey(User, on_delete=models.CASCADE, related_name='demandes_formation_envoyees_sgl')
    rln = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='demandes_formation_recues_sgl')
    sujet = models.CharField(max_length=200)
    description = models.TextField()
    date_souhaitee = models.DateField()
    valide = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Demande de Formation (SGL)"
        verbose_name_plural = "Demandes de Formation (SGL)"

# Phase 5: Budget & Besoins
class ExpressionBesoin(models.Model):
    evenement = models.ForeignKey(Evenement, on_delete=models.CASCADE, null=True, blank=True)
    eglise = models.ForeignKey(Eglise, on_delete=models.CASCADE)
    demandeur = models.ForeignKey(User, on_delete=models.CASCADE)
    liste_materiel = models.TextField(help_text="Liste du matériel à acheter ou louer")
    estimation_budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    date_demande = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Expression de Besoin"
        verbose_name_plural = "Expressions de Besoins"

class ValidationCircuit(models.Model):
    ETAPES = [
        ('RLL', 'Responsable Local'),
        ('RLN', 'Responsable National'),
        ('PASTEUR', 'Pasteur Responsable'),
        ('VALIDE', 'Validé'),
        ('REFUSE', 'Refusé'),
    ]
    besoin = models.OneToOneField(ExpressionBesoin, on_delete=models.CASCADE, related_name='circuit')
    etape_actuelle = models.CharField(max_length=10, choices=ETAPES, default='RLL')
    date_derniere_action = models.DateTimeField(auto_now=True)
    notes_decision = models.TextField(blank=True)

    class Meta:
        verbose_name = "Circuit de Validation"
        verbose_name_plural = "Circuits de Validation"

# Phase 6: Formation & Capacitation
class Formation(models.Model):
    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.titre

    class Meta:
        verbose_name = "Thème de Formation"
        verbose_name_plural = "Thèmes de Formation"

class DemandeFormation(models.Model):
    STATUTS = [
        ('PENDING', 'En attente'),
        ('APPROVED', 'Approuvée'),
        ('REJECTED', 'Rejetée'),
        ('COMPLETED', 'Réalisée'),
    ]
    eglise = models.ForeignKey(Eglise, on_delete=models.CASCADE)
    demandeur = models.ForeignKey(User, on_delete=models.CASCADE)
    formation = models.ForeignKey(Formation, on_delete=models.CASCADE)
    nombre_participants = models.PositiveIntegerField(default=1)
    date_souhaitee = models.DateField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='PENDING')
    date_demande = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.formation.titre} - {self.eglise.nom}"

    class Meta:
        verbose_name = "Demande de Formation"
        verbose_name_plural = "Demandes de Formations"

class SessionFormation(models.Model):
    STATUTS = [
        ('PLANNING', 'En préparation'),
        ('CONFIRMED', 'Confirmée'),
        ('CANCELLED', 'Annulée'),
        ('COMPLETED', 'Terminée'),
    ]
    formation = models.ForeignKey(Formation, on_delete=models.CASCADE)
    date_debut = models.DateTimeField()
    date_fin = models.DateTimeField(null=True, blank=True)
    lieu = models.CharField(max_length=200, blank=True)
    formateur = models.CharField(max_length=200, blank=True)
    statut = models.CharField(max_length=20, choices=STATUTS, default='PLANNING')
    participants_inscrits = models.ManyToManyField(User, related_name='formations_suivies', blank=True)

    def __str__(self):
        return f"{self.formation.titre} le {self.date_debut.strftime('%d/%m/%Y')}"

    class Meta:
        verbose_name = "Session de Formation"
        verbose_name_plural = "Sessions de Formations"

