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
        ('pasteur', 'Pasteur'),
        ('membre', 'Membre'),
        ('responsable', 'Responsable'),
    )
    email = models.EmailField(unique=True, null=True, blank=True,verbose_name='Adresse email')
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True,verbose_name='Numéro de téléphone')
    first_name = models.CharField(max_length=150, verbose_name='Nom')
    last_name = models.CharField(max_length=150, verbose_name='Prénoms')
    role = models.CharField(max_length=20, choices=roles, verbose_name='Rôle')
    eglise = models.ForeignKey('logistque.Eglise', on_delete=models.SET_NULL, null=True, blank=True, verbose_name='Eglise')
    image = models.ImageField(upload_to='profile_images/', null=True, blank=True,max_length=255, verbose_name='Image de profil')
    accept_terms = models.BooleanField(default=False, verbose_name='Accepter les conditions')

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone']

    objects = CustomUserManager()

    def __str__(self):
        return self.email or self.phone or f"{self.get_full_name()} ({self.role})" or "Utilisateur"
    
    def save(self, *args, **kwargs):
        # Automatisation des permissions selon le rôle
        if self.role in ['pasteur', 'responsable']:
            self.is_staff = True
        else:
            self.is_staff = False
            
        super().save(*args, **kwargs)
    
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def user_image_preview(self):
        if not self.image:
            return "-"
        return mark_safe(f'<img src="{self.image.url}" width="50" height="50" />')

    user_image_preview.short_description = "Image"
    user_image_preview.allow_tags = True
    
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
        
    
        
        
        
