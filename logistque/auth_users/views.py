from django.http import JsonResponse
from django.shortcuts import redirect
from django.views.generic import CreateView
from django.urls import reverse, reverse_lazy
from django.core.signing import Signer
from django.contrib import messages
from django.core.exceptions import ValidationError
from accounts.models import CustomUser


class SignUpView(CreateView):
    template_name = 'registration/signup.html'
    success_url = reverse_lazy('login')
    model = CustomUser
    fields = ['last_name', 'first_name', 'email', 'phone', 'role','image']
    msg = ''

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Définition des informations de permissions pour chaque rôle
        context['permissions_info'] = {
            'membre': {
                'icon': 'fa-user',
                'description': 'Accès aux fonctionnalités de base',
                'permissions': [
                    'Consulter les événements',
                    'Participer aux discussions',
                    'Accéder aux ressources'
                ]
            },
            'pasteur': {
                'icon': 'fa-church',
                'description': 'Gestion des activités spirituelles',
                'permissions': [
                    'Toutes les permissions membres',
                    'Créer des événements',
                    'Gérer les groupes',
                    'Publier des annonces'
                ]
            },
            'responsable': {
                'icon': 'fa-user-tie',
                'description': 'Administration complète',
                'permissions': [
                    'Toutes les permissions pasteur',
                    'Gérer les utilisateurs',
                    'Configurer la plateforme',
                    'Accès aux statistiques'
                ]
            }
        }
        return context
    
    
    def validate_image(self, image):
        """Validation de l'image côté serveur"""
        if image:
            # Taille max: 5MB
            if image.size > 5 * 1024 * 1024:
                messages.error(self.request, "L'image est trop volumineuse (max 5MB)")
                raise ValidationError("L'image est trop volumineuse (max 5MB)")
            
            # Types autorisés
            valid_types = ['image/jpeg', 'image/png', 'image/gif']
            if image.content_type not in valid_types:
                messages.error(self.request, "Type d'image non supporté")
                raise ValidationError("Type d'image non supporté")

    def form_invalid(self, form):
        """Gestion des erreurs pour les requêtes AJAX"""
        msg = ''
        # Ajoutez ce logging pour debug
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Form errors: {form.errors}")
        logger.error(f"POST data: {self.request.POST}")
        
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            errors = {}
            for field in form.errors:
                errors[field] = form.errors[field]
            
            # Ajouter les erreurs non-field
            if '__all__' in form.errors:
                errors['non_field_errors'] = form.errors['__all__']
                msg = errors['non_field_errors']
                
            # Ajouter les erreurs de validation de l'image
            if 'image' in form.errors:
                errors['image'] = form.errors['image']
                msg = errors['image']
                
            # Ajouter les erreurs de validation pour le téléphone s'il existe déjà
            if 'phone' in form.errors:
                errors['phone'] = form.errors['phone']
                msg = errors['phone']
            
            # Ajouter les erreurs de validation pour le mot de passe
            if 'password1' in form.errors or 'password2' in form.errors:
                errors['password1'] = form.errors['password1']
                errors['password2'] = form.errors['password2']
                msg = errors['password1']
            
                
            # Ajouter les erreurs de validation pour l'accord des conditions
            if 'accept_terms' in form.errors:
                errors['accept_terms'] = form.errors['accept_terms']
                msg = errors['accept_terms']
                
            # Ajouter les erreurs de validation pour le rôle
            if 'role' in form.errors:
                errors['role'] = form.errors['role']
                msg = errors['role']
            
            
            
            return JsonResponse({
                'success': False,
                'errors': errors,
                'message': ' '.join(msg)
            }, status=400)
        
        return super().form_invalid(form)

    def form_valid(self, form):
        import logging
        logger = logging.getLogger(__name__)
        logger.info("Début de la validation du formulaire d'inscription")
        
        try:
            signer = Signer()
            # Récupération des données supplémentaires
            role = self.request.POST.get('role')
            password1 = self.request.POST.get('password1')
            password2 = self.request.POST.get('password2')
            phone = self.request.POST.get('phone')
            accept_terms = self.request.POST.get('accept_terms') == 'on'
            
            logger.info(f"Données du formulaire - Rôle: {role}, Téléphone: {phone}, Accepte les conditions: {accept_terms}")
            
            # Validation des données obligatoires
            if not all([role, password1, password2, phone]):
                error_msg = f"Champs manquants - Rôle: {role}, Téléphone: {phone}"
                logger.error(error_msg)
                raise ValidationError("Tous les champs obligatoires doivent être remplis")
                
            if 'phone' in form.cleaned_data:
                self.request.session['signup_phone'] = form.cleaned_data['phone']
                self.request.session['signup_phone_link'] = signer.sign(form.cleaned_data['phone'])
            else:
                error_msg = "Le numéro de téléphone est manquant dans form.cleaned_data"
                logger.error(error_msg)
                raise ValidationError("Le numéro de téléphone est requis")

            # Validation personnalisée
            self.validate_data(form, password1, password2, phone, accept_terms)
            
            # Création de l'utilisateur
            user = form.save(commit=False)
            user.role = role
            user.set_password(password1)
            
            # Attribution des permissions selon le rôle
            if role == 'pasteur':
                user.is_staff = True
            elif role == 'responsable':
                user.is_staff = True
                # user.is_superuser = True
            
            if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                user.save()
                messages.success(self.request, "Utilisateur créé avec succès.")
                # Redirection vers la page de connexion
                self.success_url = self.success_url + f'?role={role}&auth-phone-user='+self.request.session['signup_phone_link'] if self.request.session['signup_phone_link'] else self.success_url
                return JsonResponse({
                    'redirect_url': self.success_url,
                    'success': True
                })
            
            return super().form_valid(form)
            
        except ValidationError as e:
            form.add_error(None, e)
            return self.form_invalid(form)
        except Exception as e:
            logger.exception("Erreur inattendue lors de la création de l'utilisateur")
            form.add_error(None, "Une erreur inattendue s'est produite. Veuillez réessayer.")
            return self.form_invalid(form)

    def validate_data(self, form, password1, password2, phone, accept_terms):
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            role = self.request.POST.get('role')
            logger.info(f"Validation des données - Rôle: {role}, Téléphone: {phone}")
            
            # Vérification du rôle
            valid_roles = ['membre', 'pasteur', 'responsable']
            if role not in valid_roles:
                error_msg = f"Rôle invalide sélectionné: {role}"
                logger.error(error_msg)
                raise ValidationError("Rôle invalide sélectionné")
            
            # Validation du numéro de téléphone
            if not phone:
                error_msg = "Aucun numéro de téléphone fourni"
                logger.error(error_msg)
                raise ValidationError("Veuillez fournir un numéro de téléphone.")
            
            # Vérifier si ce numéro de téléphone existe déjà
            if CustomUser.objects.filter(phone=phone).exists():
                error_msg = f"Numéro de téléphone déjà utilisé: {phone}"
                logger.error(error_msg)
                raise ValidationError("Ce numéro de téléphone est déjà utilisé.")
            
            # Validation des mots de passe
            if password1 != password2:
                error_msg = "Les mots de passe ne correspondent pas"
                logger.error(error_msg)
                raise ValidationError("Les mots de passe ne correspondent pas.")
            
            if len(password1) < 8:
                error_msg = "Le mot de passe est trop court (moins de 8 caractères)"
                logger.error(error_msg)
                raise ValidationError("Le mot de passe doit contenir au moins 8 caractères.")
            
            # Validation des conditions d'utilisation
            if not accept_terms:
                error_msg = "L'utilisateur n'a pas accepté les conditions d'utilisation"
                logger.error(error_msg)
                raise ValidationError("Vous devez accepter les conditions d'utilisation.")
            
            # Validation de l'unicité de l'email
            if 'email' in form.cleaned_data and form.cleaned_data['email']:
                if CustomUser.objects.filter(email=form.cleaned_data['email']).exists():
                    error_msg = f"Email déjà utilisé: {form.cleaned_data['email']}"
                    logger.error(error_msg)
                    raise ValidationError("Cet email est déjà utilisé.")
            else:
                error_msg = "Aucun email fourni dans le formulaire"
                logger.error(error_msg)
                raise ValidationError("L'adresse email est requise.")
                
        except Exception as e:
            logger.exception("Erreur lors de la validation des données utilisateur")
            raise  # Relance l'exception pour qu'elle soit gérée par l'appelant
