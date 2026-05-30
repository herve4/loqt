# accounts/models.py
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils.safestring import mark_safe
class CustomUserManager(BaseUserManager):
    def create_user(self, email=None, phone=None, password=None, **extra_fields):
        if not email and not phone:
            raise ValueError('Un utilisateur doit avoir un email ou un téléphone')
        
        if email:
            email = self.normalize_email(email)
            extra_fields['email'] = email
        
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email=email, password=password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    roles = (
        ('super_admin', 'Super-Administrateur'),
        ('pasteur_national', 'Pasteur Responsable National'),
        ('rln', 'Responsable Logistique National (RLN)'),
        ('pasteur_local', 'Pasteur Responsable Local'),
        ('rll', 'Responsable Logistique Local (RLL)'),
        ('technicien', 'Membre Technicien'),
        # Nouveaux types d'utilisateurs
        ('pasteur', 'Pasteur'),
        ('resp_dept', 'Responsable de Département'),
        ('adj_dept', 'Adjoint Responsable de Département'),
        ('resp_sec', 'Responsable de Section'),
        ('adj_sec', 'Adjoint Responsable de Section'),
        ('membre_dept', 'Membre de Département'),
        ('membre_sec', 'Membre de Section'),
    )
    email = models.EmailField(unique=True, null=True, blank=True,verbose_name='Adresse email')
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True,verbose_name='Numéro de téléphone')
    first_name = models.CharField(max_length=150, verbose_name='Nom')
    last_name = models.CharField(max_length=150, verbose_name='Prénoms')
    role = models.CharField(max_length=20, choices=roles, verbose_name='Rôle')
    eglise = models.ForeignKey('logistque.Eglise', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Eglise')
    pole = models.ForeignKey('logistque.PoleCompetence', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Pôle Technique')
    section = models.CharField(max_length=100, blank=True, null=True, verbose_name="Section")
    image = models.ImageField(upload_to='profile_images/', null=True, blank=True,max_length=255, verbose_name='Image de profil')
    qr_code = models.ImageField(upload_to='user_qr_codes/', null=True, blank=True, verbose_name='QR Code')
    accept_terms = models.BooleanField(default=False, verbose_name='Accepter les conditions')
    onboarding_completed = models.BooleanField(default=True, verbose_name="Onboarding terminé")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone']

    objects = CustomUserManager()

    def __str__(self):
        return self.email or self.phone or f"{self.get_full_name()} ({self.role})" or "Utilisateur"
    
    def save(self, *args, **kwargs):
        # Automatisation des permissions selon le rôle
        admin_roles = [
            'super_admin', 'pasteur_national', 'rln', 'pasteur_local', 'rll',
            'pasteur', 'resp_dept', 'adj_dept', 'resp_sec', 'adj_sec'
        ]
        if self.role in admin_roles:
            self.is_staff = True
        else:
            self.is_staff = False
            
        super().save(*args, **kwargs)

        # Génération automatique du QR code si inexistant
        if not self.qr_code:
            import qrcode
            from io import BytesIO
            from django.core.files import File
            from django.conf import settings
            
            try:
                base_url = getattr(settings, 'SITE_DOMAIN', 'sglci.sajholding.org')
                if not base_url.startswith(('http://', 'https://')):
                    base_url = f'https://{base_url}'
                
                # Le QR code encode le lien public de vérification du membre
                verification_url = f"{base_url}/public/verify-member/{self.pk}/"
                
                qr = qrcode.QRCode(
                    version=None,
                    error_correction=qrcode.constants.ERROR_CORRECT_H,
                    box_size=10,
                    border=4,
                )
                qr.add_data(verification_url)
                qr.make(fit=True)
                
                # Style du QR Code (Bleu et fond blanc)
                img_qr = qr.make_image(
                    fill_color="#2563eb",
                    back_color="#ffffff"
                ).convert('RGB')
                
                qr_io = BytesIO()
                img_qr.save(qr_io, format='PNG', optimize=True, quality=95)
                qr_io.seek(0)
                
                filename = f"qr_user_{self.pk}.png"
                self.qr_code.save(filename, File(qr_io), save=False)
                
                super().save(update_fields=['qr_code'])
            except Exception as e:
                print(f"Erreur lors de la génération du QR code de l'utilisateur: {e}")
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def user_image_preview(self):
        if not self.image:
            return "-"
        return mark_safe(f'<img src="{self.image.url}" width="50" height="50" />')

    user_image_preview.short_description = "Image"
    user_image_preview.allow_tags = True

    def qr_code_preview(self):
        if not self.qr_code:
            return "-"
        return mark_safe(f'<img src="{self.qr_code.url}" width="50" height="50" />')
    qr_code_preview.short_description = "QR Code"
    qr_code_preview.allow_tags = True
    
    class Meta:
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
        
        permissions = (
            ('can_view_dashboard', 'Peut accéder au tableau de bord'),
            ('can_view_users', 'Peut voir les utilisateurs'),
            ('can_add_user', 'Peut ajouter un utilisateur'),
            ('can_edit_user', 'Peut éditer un utilisateur'),
            ('can_delete_user', 'Peut supprimer un utilisateur'),
        )
    
        
class EmailVerification(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.email} - {self.code} ({'Vérifié' if self.is_verified else 'En attente'})"

    class Meta:
        verbose_name = 'Vérification Email'
        verbose_name_plural = 'Vérifications Emails'
