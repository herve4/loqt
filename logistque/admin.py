# admin.py

from functools import wraps
from django.contrib import admin
from django.contrib.admin import AdminSite
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from django.contrib import messages
from django.http import HttpResponseRedirect, HttpResponseForbidden, JsonResponse
from django.urls import reverse
from django.utils.html import format_html
from django.contrib.admin.templatetags.admin_urls import add_preserved_filters
from django.contrib.admin.utils import unquote
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.exceptions import PermissionDenied
from django.views.decorators.http import require_POST
from django.shortcuts import get_object_or_404, render
from django.contrib.admin.views.decorators import staff_member_required
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.debug import sensitive_post_parameters
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_http_methods
from django.contrib.admin.options import IS_POPUP_VAR, TO_FIELD_VAR
from django.contrib.admin.views.main import ChangeList
from django.core.exceptions import ValidationError
from django.db import models
from django import forms
from django.http import Http404
from django.utils.safestring import mark_safe
from django.template.response import TemplateResponse
from django.utils import timezone
from django.conf import settings
from django.contrib.admin.helpers import AdminErrorList
from django.contrib import admin
from django.contrib.admin.models import LogEntry
from django.contrib.admin import ModelAdmin, TabularInline, StackedInline
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from django.core.exceptions import ValidationError
from django.db import models
from django import forms
from django.template.response import TemplateResponse
from django.urls import path, reverse, reverse_lazy
from django.utils.html import format_html, format_html_join
from django.utils.text import capfirst
from django.views.generic import View
from django.views.generic.detail import DetailView
from django.views.generic.edit import CreateView, DeleteView, FormView, UpdateView
from django.views.generic.list import ListView
from django.views.decorators.clickjacking import xframe_options_sameorigin

from import_export import resources
from import_export.admin import ImportExportActionModelAdmin, ImportExportModelAdmin
from import_export.formats import base_formats

from logistque.models import *
from logistque.forms import *

def handle_permission_denied(view_func):
    """
    Decorator pour gérer les erreurs de permission et afficher un message flottant
    """
    @wraps(view_func)
    def wrapper(self, request, *args, **kwargs):
        try:
            return view_func(self, request, *args, **kwargs)
        except PermissionDenied:
            messages.error(
                request,
                _("Vous n'avez pas la permission d'accéder à cette page. "
                  "Veuillez contacter un administrateur si vous pensez qu'il s'agit d'une erreur.")
            )
            return HttpResponseRedirect(reverse('admin:index'))
    return wrapper

# Ressources pour l'import/export
class RegionResource(resources.ModelResource):
    class Meta:
        model = Region
        fields = ('id', 'nom', 'date_creation', 'date_modification')
        export_order = fields

class VilleResource(resources.ModelResource):
    class Meta:
        model = Ville
        fields = ('id', 'nom', 'region__nom', 'date_creation', 'date_modification')
        export_order = fields

class EgliseResource(resources.ModelResource):
    class Meta:
        model = Eglise
        fields = ('id', 'nom', 'ville__nom', 'pasteur', 'contact', 'email', 'adresse', 'date_creation', 'date_modification')
        export_order = fields

class CategorieMaterielResource(resources.ModelResource):
    class Meta:
        model = CategorieMateriel
        fields = ('id', 'nom', 'description', 'date_creation', 'date_modification')
        export_order = fields

class SousCategorieMaterielResource(resources.ModelResource):
    class Meta:
        model = SousCategorieMateriel
        fields = ('id', 'nom', 'categorie__nom', 'description', 'date_creation', 'date_modification')
        export_order = fields

class MaterielResource(resources.ModelResource):
    class Meta:
        model = Materiel
        fields = ('id', 'nom', 'categorie__nom', 'sous_categorie__nom', 'description', 'quantite', 'etat', 'date_creation', 'date_modification')
        export_order = fields

class EvenementResource(resources.ModelResource):
    class Meta:
        model = Evenement
        fields = ('id', 'titre', 'type_evenement', 'description', 'date_debut', 'date_fin', 'lieu', 'eglise__nom', 'statut', 'date_creation', 'date_modification')
        export_order = fields

def make_active(modeladmin, request, queryset):
    queryset.update(actif=True)
make_active.short_description = "Marquer comme actif"

def make_inactive(modeladmin, request, queryset):
    queryset.update(actif=False)
make_inactive.short_description = "Marquer comme inactif"

# Import des modèles de notification depuis l'application events
# Note: Les modèles de notification sont enregistrés dans logistque/events/admin.py

# Dictionnaire des icônes pour chaque modèle
MODEL_ICONS = {
    # Modèles principaux
    'user': 'fas fa-user',
    'group': 'fas fa-users',
    'permission': 'fas fa-shield-alt',
    'logentry': 'fas fa-history',
    
    # Gestion des utilisateurs
    'utilisateur': 'fas fa-user',
    'formationlogisticien': 'fas fa-graduation-cap',
    'membrelogistique': 'fas fa-user-tie',
    
    # Gestion des lieux
    'region': 'fas fa-map-marked-alt',
    'ville': 'fas fa-city',
    'eglise': 'fas fa-church',
    'lieu': 'fas fa-map-marker-alt',
    
    # Gestion du matériel
    'categoriemateriel': 'fas fa-tags',
    'souscategoriemateriel': 'fas fa-tag',
    'materiel': 'fas fa-boxes',
    'materielimage': 'fas fa-image',
    
    # Événements et planning
    'evenement': 'fas fa-calendar-alt',
    'evenementmateriel': 'fas fa-clipboard-list',
    'chronogrammeitem': 'fas fa-list-ol',
    'photosevenement': 'fas fa-images',
    
    # Camps
    'campmondial': 'fas fa-campground',
    'campmateriel': 'fas fa-tools',
    
    # Demandes et permissions
    'demandepermission': 'fas fa-clipboard-check',
    'logistique': 'fas fa-truck',
}

MODEL_COLORS = [
    '#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#26C6DA', '#EC407A', '#FF7043'
]

class CustomAdminSite(AdminSite):
    site_header = "Tableau de Bord Logistique"
    site_title = "Logistique CI"
    index_title = "Bienvenue sur le Tableau de Bord Logistique"

    def each_context(self, request):
        context = super().each_context(request)
        if request.user.is_superuser:
            nouvelles_demandes = DemandePermission.objects.filter(statut='en_attente').count()
            context['nouvelles_demandes'] = nouvelles_demandes
        return context
    
    def each_context(self, request):
        context = super().each_context(request)
        context['title'] = self.index_title  # titre par défaut
        return context
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if not request.user.is_superuser:
            qs = qs.filter(user=request.user)
        return qs
        
    


    def index(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = "Tableau de bord"
        return super().index(request, extra_context=extra_context)
    
    def get_urls(self):
        
        urls = super().get_urls()
        custom_urls = [
            path('', self.admin_view(self.dashboard_view), name='dashboard'),
        ]
        return custom_urls + urls
    
    # Désactivez les vérifications de permission si nécessaire
    def has_module_permission(self, request):
        return True
        
    def has_view_permission(self, request, obj=None):
        return True
        
    def has_change_permission(self, request, obj=None):
        return True
    
    def dispatch(self, request, *args, **kwargs):
        if hasattr(request.user, "formation_logisticien") and not request.user.formation_logisticien.est_forme:
            messages.warning(request, "Vous devez suivre la formation pour accéder à cette fonctionnalité.")
            return redirect('formation-demande')
        
        if not request.user.is_authenticated:
            messages.error(request, "Connectez-vous pour acceder au Tableau de bord.")
            return redirect('login')
        if not request.user.is_staff:
            messages.error(request, "Vous n'avez pas les permissions nécessaires pour accéder à cette page.")
            return HttpResponseForbidden()
        if not request.user.is_superuser and not request.user.is_staff:
            messages.error(request, "Vous n'avez pas les permissions nécessaires pour accéder à cette page.")
            return HttpResponseForbidden()
        return super().dispatch(request, *args, **kwargs)


    def get_app_list(self, request, app_label=None):
        """
        Override de la méthode pour personnaliser l'ordre des applications et des modèles
        dans la barre latérale de l'administration, et ajouter des icônes.
        """
        # Récupérer la liste des applications de base
        app_list = super().get_app_list(request, app_label)
        
        # Définir l'ordre souhaité des applications
        app_ordering = {
            'auth': 1,           # Authentification et autorisation
            'logistque': 2,      # Application principale
            'sites': 3,          # Sites
            'admin': 4,          # Administration
        }
        
        # Définir l'ordre des modèles pour chaque application
        model_ordering = {
            'auth': [
                'user',
                'group',
                'permission',
            ],
            'logistque': [
                'eglise',
                'region',
                'ville',
                'logistique',
                'membrelogistique',
                'categoriemateriel',
                'souscategoriemateriel',
                'materiel',
                'materielimage',
                'evenement',
                'evenementmateriel',
                'chronogrammeitem',
                'campmondial',
                'campmateriel',
                'formationlogisticien',
                'demandepermission',
                'photosevenement',
            ],
        }
        
        # Trier les applications selon l'ordre défini
        def get_app_order(app):
            return app_ordering.get(app['app_label'].lower(), 999)
        
        app_list.sort(key=get_app_order)
        
        # Trier les modèles dans chaque application selon l'ordre défini
        for app in app_list:
            if app['app_label'].lower() in model_ordering:
                model_order = {}
                for i, model_name in enumerate(model_ordering[app['app_label'].lower()]):
                    model_order[model_name.lower()] = i
                
                def get_model_order(model):
                    return model_order.get(model['object_name'].lower(), 999)
                
                app['models'].sort(key=get_model_order)
                
                # Ajouter les icônes aux modèles
                for model in app['models']:
                    model_name = model['object_name'].lower()
                    model['icon'] = MODEL_ICONS.get(model_name, 'fas fa-cube')
                    
                    # Ajouter une couleur de fond aléatoire basée sur le nom du modèle
                    import hashlib
                    color_index = int(hashlib.md5(model_name.encode()).hexdigest(), 16) % len(MODEL_COLORS)
                    model['color'] = MODEL_COLORS[color_index]
        
        return app_list

    def dashboard_view(self, request):
        from django.db import connection, OperationalError, ProgrammingError
        from django.contrib import messages
        from django.urls import reverse
        from django.contrib.admin.models import LogEntry
        from django.apps import apps
        
        app_models = []
        color_index = 0
        
        # Récupération des logs avec gestion d'erreur
        try:
            logs = LogEntry.objects.select_related('user').order_by('-action_time')[:10]
        except (OperationalError, ProgrammingError) as e:
            logs = []
            messages.warning(request, f"Impossible de charger les logs: {str(e)}")
        except Exception as e:
            logs = []
            messages.error(request, f"Erreur inattendue lors du chargement des logs: {str(e)}")

        # Récupération des modèles avec gestion d'erreur pour chaque modèle
        all_models = apps.get_models()
        print(f"\n=== MODÈLES DISPONIBLES ({len(all_models)}) ===")
        
        from collections import defaultdict
        
        lists_app_names = defaultdict(list)
        
        for model in all_models:
            model_name = model.__name__
            app_label = model._meta.app_label
            model_name_lower = model._meta.model_name
            
            # Ignorer les modèles système
            if app_label in ['sessions', 'contenttypes', 'sites']:
                print(f"- Ignoré (système): {app_label}.{model_name}")
                continue
                
            # Vérifier les permissions (commenté temporairement pour le débogage)
            model_permission = f"{app_label}.view_{model_name_lower}"
            has_perm = request.user.has_perm(model_permission)
            if not has_perm:
                continue
            

            name = getattr(model._meta, 'verbose_name_plural', model._meta.verbose_name).title()
            icon = MODEL_ICONS.get(model._meta.model_name, 'fas fa-database')
            
    
            
            # Gestion des erreurs pour le comptage
            try:
                count = model.objects.count()
            except (OperationalError, ProgrammingError) as e:
                print(f"Erreur de base de données pour {model.__name__}: {str(e)}")
                continue
            except Exception as e:
                print(f"Erreur inattendue pour {model.__name__}: {str(e)}")
                continue
            
            color = MODEL_COLORS[color_index % len(MODEL_COLORS)]
            color_index += 1

            try:
                admin_url = reverse('admin:%s_%s_changelist' % (app_label, model_name_lower))
                model_data = {
                    'name': name,
                    'count': count,
                    'icon': icon,
                    'color': color,
                    'admin_url': admin_url,
                    'app_label': model._meta.app_label,
                    'model_name': model._meta.model_name
                }
                print(f"Ajout du modèle au tableau de bord: {model_data}")
                app_models.append(model_data)
                lists_app_names[model._meta.app_label].append(model_data)
            except Exception as e:
                print(f"Impossible de générer l'URL d'admin pour {model.__name__}: {str(e)}")
                continue

        # Données de formation avec gestion d'erreur
        nb_formes = 0
        nb_non_formes = 0
        
        try:
            nb_formes = FormationLogisticien.objects.filter(est_forme=True).count()
            nb_non_formes = FormationLogisticien.objects.filter(est_forme=False).count()
        except (OperationalError, ProgrammingError) as e:
            messages.warning(request, "Impossible de charger les données de formation. Vérifiez que la table existe.")
        except Exception as e:
            messages.error(request, f"Erreur lors du chargement des données de formation: {str(e)}")

        cards = [
            {"label": "Logisticiens Formés", "count": nb_formes, "unit": "", "icon": "✅", "color": "#36b9cc"},
            {"label": "Logisticiens Non Formés", "count": nb_non_formes, "unit": "", "icon": "❌", "color": "#f6c23e"},
        ]

        chart_data = {
            "labels": ["Formés", "Non Formés"],
            "values": [nb_formes, nb_non_formes],
            "colors": ["#36b9cc", "#f6c23e"],
        }
        
        MODEL_LABELS_FR = {
            "matériels": "Quantité de matériels enregistrés",
            "logisticiens": "Logisticiens formés et non formés",
            "églises": "Nombre total d’églises actives",
            "utilisateurs": "Utilisateurs enregistrés",
            "default": "Éléments enregistrés par module"
        }


        

        # 🔍 Logisticiens à former
        logisticiens = FormationLogisticien.objects.filter(est_forme=False)[:5]

        # 🕒 Activités récentes fictives (à remplacer éventuellement par des logs réels)
        recent = [
            "Ajout d’un nouveau matériel 📦",
            "Modification du profil utilisateur 👤",
            "Export de la liste des matériels 📥",
        ]



        app_lists = [
            {
                'name': app_label,
                'models': models,
                'icon': icon,
            }
            for app_label, models in lists_app_names.items()
        ]
        
        # Préparer le contexte avec la clé 'models' attendue par le template
        context = {
            'title': '📊 Tableau de bord des données de la Logistique',
            'models': app_models,  # La clé 'models' est attendue par le template
            'cards': cards,
            'chart_data': chart_data,
            'recent_logs': [{
                'timestamp': log.action_time,
                'user': log.user,
                'action': log.get_change_message(),
                'content_type': str(log.content_type),
                'object_repr': log.object_repr,
                'action_flag': log.action_flag
            } for log in logs] if logs else [],
            'recent': recent,
            'logisticiens': logisticiens,
            'label_map': MODEL_LABELS_FR,
            'debug': True,
            'app_models': app_models,
            'app_lists': app_lists,
        }
        
        print("\nContexte transmis au template:")
        for key, value in context.items():
            if key != 'app_lists':  # Éviter d'afficher les apps disponibles qui sont volumineuses
                print(f"- {key}: {value}" if not isinstance(value, (list, dict)) else f"- {key}: {type(value)} ({len(value)} éléments)")
        
        # Ajouter les variables de débogage
        context['debug_info'] = {
            'user': str(request.user),
            'is_superuser': request.user.is_superuser,
            'is_staff': request.user.is_staff,
            'user_permissions': list(request.user.get_all_permissions()),
            'app_models_count': len(app_models)
        }
        
        return TemplateResponse(request, 'dashbord.html', context)


admin_site = CustomAdminSite(name='customadmin')

# Enregistrement du modèle LogEntry avec le site admin personnalisé
@admin.register(LogEntry, site=admin_site)
class LogEntryAdmin(ModelAdmin):
    list_display = ('object_repr', 'action_flag', 'user', 'change_message', 'action_time')
    list_filter = ('action_flag', 'content_type')
    search_fields = ('object_repr', 'change_message', 'user__username')
    date_hierarchy = 'action_time'
    readonly_fields = ('action_time', 'user', 'content_type', 'object_id', 'object_repr', 'action_flag', 'change_message')

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser




@admin.register(ChronogrammeItem, site=admin_site)
class ChronogrammeItemAdmin(admin.ModelAdmin):
    list_display = ('evenement', 'heure_debut', 'heure_fin', 'titre', 'responsable')
    list_filter = ('evenement',)
    search_fields = ('evenement__titre', 'titre', 'responsable')
    ordering = ('evenement', 'heure_debut')
    # Suppression complète de date_hierarchy car pas de champ DateField/DateTimeField approprié

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('evenement')



@admin.register(DemandePermission, site=admin_site)    
class DemandeLogistiqueAdmin(admin.ModelAdmin):
    list_display = ('colored_user_email', 'permission_demande', 'statut_badge', 'date_demande')
    list_filter = ('statut', 'permission_demande')
    search_fields = ('user__email', 'permission_demande', 'raison')
    actions = ('approuver_demandes', 'refuser_demandes', 'mettre_en_attente', 'annuler_demandes')

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['stats'] = {
            'en_attente': self.model.objects.filter(statut='en_attente').count(),
            'approuvee': self.model.objects.filter(statut='approuvee').count(),
            'refusee': self.model.objects.filter(statut='refusee').count(),
            'nouvelle_demande': self.model.objects.filter(statut='en_attente').count(),
        }
        print(extra_context)
        return super().changelist_view(request, extra_context=extra_context)
    
    def statut_badge(self, obj):
        color = {
            'approuvee': "#107450",
            'refusee': "#b6362a",
            'en_attente': '#856404',
        }.get(obj.statut, '#6c757d')
        
        background_color = {
            'approuvee': "#aaf1be",
            'refusee': "#fcc6c0",
            'en_attente': '#ffeeba',
        }.get(obj.statut, '#f8f9fa')

        icon = {
            'approuvee': '✅',
            'refusee': '❌',
            'en_attente': '⏳',
        }.get(obj.statut, 'ℹ️')

        label = {
            'approuvee': 'Approuvée',
            'refusee': 'Refusée',
            'en_attente': 'En attente',
        }.get(obj.statut, obj.statut)

        return format_html(
            '<span style="background-color:{}; border-radius: 4px; padding: 4px 8px; color:{}; font-weight:600;">{}</span>',
            background_color,
            color,
            f"{icon} {label}"
            
        )

    statut_badge.short_description = "Statut"
    
    
    def nouvelle_demande(self, request, queryset):
        for demande in queryset:
            demande.statut = 'en_attente'
            demande.save()
        self.message_user(request, 'Demandes en attente.')

    nouvelle_demande.short_description = "Nouvelle demande"
    
    def colored_user_email(self, obj):
        color = {
            'en_attente': "#FFC003",   # jaune
            'approuvee': "#02FFA2",    # vert
            'refusee': "#ff1500",      # rouge
        }.get(obj.statut, '#6c757d')
        
        style_sheet = {
            'en_attente':{
                'background-color': "#ffeeba",   # jaune
                'color': "#856404",
                'body.dark-mode .field-colored_user_email': "#FFC003",
            },
            'approuvee':{
                'background-color': "#aaf1be",    # vert
                'color': "#107450",
                'body.dark-mode .field-colored_user_email': "#02FFA2",
            },
            'refusee':{
                'background-color': "#fcc6c0",      # rouge
                'color': "#b6362a",
                'body.dark-mode .field-colored_user_email': "#ff1500",
            }
            
        }.get(obj.statut, {})
        
        return format_html(
            '<span style="background-color:{}; border-radius: 4px; padding: 4px 8px; color:{}; font-weight:600; body.dark-mode .field-colored_user_email:{}">{}</span>',
            style_sheet['background-color'],
            style_sheet['color'],
            style_sheet['body.dark-mode .field-colored_user_email'],
            obj.user.email
        )
    colored_user_email.short_description = "Email utilisateur"

    def get_row_css_class(self, obj):
        return f"permission-{obj.statut}"
    
    # class Media:
    #     css = {
    #         "all": ("admin/css/custom_admin.css",)
    #     }




    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Annotate statuts for use in CSS classes
        return qs

    def render_change_form(self, request, context, *args, **kwargs):
        return super().render_change_form(request, context, *args, **kwargs)

    def get_changelist(self, request, **kwargs):
        from django.contrib.admin.views.main import ChangeList

        class CustomChangeList(ChangeList):
            def get_results(self, request):
                super().get_results(request)
                for result in self.result_list:
                    result.row_class = f"permission-{result.statut}"

        return CustomChangeList

    def approuver_demandes(self, request, queryset):
        for demande in queryset:
            demande.statut = 'approuvee'
            demande.save()
        self.message_user(request, 'Demandes approuvées.')

    def refuser_demandes(self, request, queryset):
        for demande in queryset:
            demande.statut = 'refusee'
            demande.save()
        self.message_user(request, 'Demandes refusées.')
        
    def mettre_en_attente(self, request, queryset):
        for demande in queryset:
            demande.statut = 'en_attente'
            demande.save()
        self.message_user(request, 'Demandes en attente.')
    
    def annuler_demandes(self, request, queryset):
        for demande in queryset:
            demande.delete()
        self.message_user(request, 'Demandes annulées.')
    
    approuver_demandes.short_description = "Approuver les demandes"
    refuser_demandes.short_description = "Refuser les demandes"
    mettre_en_attente.short_description = "Mettre les demandes en attente"
    annuler_demandes.short_description = "Annuler les demandes"

# Région
@admin.register(Region, site=admin_site)
class RegionAdmin(admin.ModelAdmin):
    resource_class = RegionResource
    list_display = ('nom', 'id')
    search_fields = ('nom',)
    actions = [make_active, make_inactive]
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True

# Ville
@admin.register(Ville, site=admin_site)
class VilleAdmin(admin.ModelAdmin):
    resource_class = VilleResource
    list_display = ('nom', 'region', 'id')
    list_filter = ('region',)
    search_fields = ('nom', 'region__nom')
    list_select_related = ('region',)
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True

# Membre Logistique Inline
class MembreLogistiqueInline(admin.TabularInline):
    model = MembreLogistique
    extra = 1

# Logistique
@admin.register(Logistique, site=admin_site)
class LogistiqueAdmin(admin.ModelAdmin):
    list_display = ('responsable_image_preview', 'eglise_link', 'responsable_role', 'responsable_last_name', 'responsable_first_name')
    list_filter = ('eglise__ville__region__nom', 'eglise__ville')
    search_fields = ('eglise__nom', 'responsable__first_name', 'responsable__last_name')
    inlines = [MembreLogistiqueInline]
    
    def eglise_link(self, obj):
        if obj.eglise:
            return mark_safe(f'<a href="{reverse("admin:logistque_eglise_change", args=[obj.eglise.id])}">{obj.eglise.nom}</a>')
        return "Aucune église"
    eglise_link.short_description = "Église"
    eglise_link.admin_order_field = 'eglise__nom'
    
    def responsable_first_name(self, obj):
        return obj.responsable.first_name if obj.responsable else ''

    def responsable_last_name(self, obj):
        return obj.responsable.last_name if obj.responsable else ''
    def responsable_role(self, obj):
        return obj.responsable.role if obj.responsable else ''
    
    def responsable_image_preview(self, obj):
        if not obj.responsable.image:
            return "Aucune image"
        return mark_safe(f'<img src="{obj.responsable.image.url}" width="50" height="50" />')
    
    responsable_image_preview.short_description = "Image"

    responsable_role.short_description = "Rôle"

    responsable_first_name.short_description = "Prénom"
    responsable_last_name.short_description = "Nom"
    eglise_link.short_description = "Eglise"
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True


# Eglise
@admin.register(Eglise, site=admin_site)
class EgliseAdmin(admin.ModelAdmin):
    resource_class = EgliseResource
    list_display = ('nom', 'ville', 'get_pasteur_email', 'phone', 'id')
    list_filter = ('ville__region', 'ville')
    search_fields = ('nom', 'ville__nom', 'pasteur__email', 'pasteur__first_name', 'pasteur__last_name', 'phone')
    list_select_related = ('ville', 'ville__region', 'pasteur')
    list_per_page = 20
    
    def get_pasteur_email(self, obj):
        return obj.pasteur.email if obj.pasteur else 'Aucun pasteur'
    get_pasteur_email.short_description = 'Email du pasteur'
    get_pasteur_email.admin_order_field = 'pasteur__email'
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
    
    # #@handle_permission_denied
    # def changelist_view(self, request, extra_context=None):
    #     return super().changelist_view(request, extra_context)
    
    # #@handle_permission_denied
    # def add_view(self, request, form_url='', extra_context=None):
    #     return super().add_view(request, form_url, extra_context)
    
    # #@handle_permission_denied
    # def change_view(self, request, object_id, form_url='', extra_context=None):
    #     return super().change_view(request, object_id, form_url, extra_context)
    
    # #@handle_permission_denied
    # def delete_view(self, request, object_id, extra_context=None):
    #     return super().delete_view(request, object_id, extra_context)

# Catégorie Matériel
@admin.register(CategorieMateriel, site=admin_site)
class CategorieMaterielAdmin(admin.ModelAdmin):
    resource_class = CategorieMaterielResource
    list_display = ('nom', 'id')
    search_fields = ('nom', 'description')
    list_per_page = 20
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
    
    #@handle_permission_denied
    # def changelist_view(self, request, extra_context=None):
    #     return super().changelist_view(request, extra_context)
    
    # #@handle_permission_denied
    # def add_view(self, request, form_url='', extra_context=None):
    #     return super().add_view(request, form_url, extra_context)
    
    # #@handle_permission_denied
    # def change_view(self, request, object_id, form_url='', extra_context=None):
    #     return super().change_view(request, object_id, form_url, extra_context)
    
    # #@handle_permission_denied
    # def delete_view(self, request, object_id, extra_context=None):
    #     return super().delete_view(request, object_id, extra_context)
    
# Sous-Catégorie Matériel
@admin.register(SousCategorieMateriel, site=admin_site)
class SousCategorieMaterielAdmin(admin.ModelAdmin):
    resource_class = SousCategorieMaterielResource
    list_display = ('nom', 'categorie', 'id')
    list_filter = ('categorie',)
    search_fields = ('nom', 'categorie__nom', 'description')
    list_select_related = ('categorie',)
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True

@admin.register(MaterielImage, site=admin_site)   
class MaterielImageAdmin(admin.ModelAdmin):
    list_display = ('materiel', 'image')
    search_fields = ('materiel__nom',)
    autocomplete_fields = ['materiel']
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True

class MaterielImageInline(admin.TabularInline):
    model = MaterielImage
    extra = 1

from django.utils.safestring import mark_safe
# Matériel
@admin.register(Materiel, site=admin_site)
class MaterielAdmin(ImportExportActionModelAdmin, admin.ModelAdmin):
    resource_class = MaterielResource
    list_display = ('nom', 'categorie', 'sous_categorie', 'quantite', 'id')
    list_filter = ('categorie', 'sous_categorie', 'logistique__eglise__ville__region')
    search_fields = ('nom', 'categorie__nom', 'sous_categorie__nom', 'description')
    list_select_related = ('categorie', 'sous_categorie', 'logistique', 'logistique__eglise')
    readonly_fields = ('code_barre_previews', 'qr_code_previews')
    inlines = [MaterielImageInline]
    list_per_page = 20
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
    
    def get_import_formats(self):
        formats = (
            base_formats.XLSX,
            base_formats.CSV,
        )
        return [f for f in formats if f().can_export()]
    
    def get_export_formats(self):
        formats = (
            base_formats.XLSX,
            base_formats.CSV,
            base_formats.JSON,
        )
        return [f for f in formats if f().can_export()]
    # autocomplete_fields = ['logistique']
    
    # def image_materiel_preview(self, obj):
    #     return mark_safe(f'<img src="{obj.images_materiel[0].url}" width="100" height="100" />')
    # image_materiel_preview.short_description = "Image produit"
    # Autres méthodes et configurations existantes
 
@admin.register(CampMateriel, site=admin_site)  
class MaterielCampUtilise(admin.ModelAdmin):
    list_display = ('camp', 'materiel', 'quantite_utilisee', 'date_utilisation')
    
@admin.register(Evenement, site=admin_site)
class EvenementAdmin(ImportExportActionModelAdmin, admin.ModelAdmin):
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
    
    # @handle_permission_denied
    # def changelist_view(self, request, extra_context=None):
    #     return super().changelist_view(request, extra_context)
    
    # @handle_permission_denied
    # def add_view(self, request, form_url='', extra_context=None):
    #     return super().add_view(request, form_url, extra_context)
    
    # @handle_permission_denied
    # def change_view(self, request, object_id, form_url='', extra_context=None):
    #     return super().change_view(request, object_id, form_url, extra_context)
    
    # @handle_permission_denied
    # def delete_view(self, request, object_id, extra_context=None):
    #     return super().delete_view(request, object_id, extra_context)
    resource_class = EvenementResource
    list_display = ('titre', 'type_evenement', 'date_debut', 'date_fin', 'eglise', 'statut', 'id')
    list_filter = ('type_evenement', 'statut', 'date_debut', 'eglise__ville__region', 'eglise')
    search_fields = ('titre', 'description', 'eglise__nom', 'eglise__ville__nom')
    date_hierarchy = 'date_debut'
    list_select_related = ('eglise', 'eglise__ville', 'eglise__ville__region')
    filter_horizontal = ('logisticiens_gestion',)
    raw_id_fields = ('materiels_utilises',)
    list_per_page = 20
    
    def get_import_formats(self):
        formats = (
            base_formats.XLSX,
            base_formats.CSV,
        )
        return [f for f in formats if f().can_export()]
    
    def get_export_formats(self):
        formats = (
            base_formats.XLSX,
            base_formats.CSV,
            base_formats.JSON,
        )
        return [f for f in formats if f().can_export()]
    
    def get_created_at(self, obj):
        return obj.created_at if hasattr(obj, 'created_at') else 'Non disponible'
    get_created_at.short_description = 'Date de création'
    
    def get_updated_at(self, obj):
        return obj.updated_at if hasattr(obj, 'updated_at') else 'Non disponible'
    get_updated_at.short_description = 'Dernière mise à jour'
    
    fieldsets = (
        ('Informations générales', {
            'fields': ('titre', 'type_evenement', 'description', 'image', 'statut')
        }),
        ('Dates et lieu', {
            'fields': ('date_debut', 'date_fin', 'eglise', 'lieu')
        }),
        ('Organisation', {
            'fields': ('organisateur_type', 'organisateur_nom', 'logisticiens_gestion')
        }),
        # Suppression de la section Matériels car elle cause une erreur avec le ManyToManyField
        ('Métadonnées', {
            'classes': ('collapse',),
            'fields': ('get_created_at', 'get_updated_at')
        }),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        qs = qs.select_related('eglise').prefetch_related('logisticiens_gestion', 'materiels_utilises')
        return qs

# Enregistrement des modèles nécessaires pour les relations
# Ces modèles sont enregistrés séparément pour éviter les conflits

# Classe intermédiaire pour l'autocomplétion
class MaterielBaseAdmin(admin.ModelAdmin):
    list_display = ('nom', 'categorie')
    search_fields = ('nom',)
    list_filter = ('categorie',)

# Enregistrement du modèle Materiel avec le site admin personnalisé
#admin_site.register(Materiel, MaterielBaseAdmin)

@admin.register(EvenementMateriel, site=admin_site)
class EvenementMaterielAdmin(admin.ModelAdmin):
    list_display = ('evenement', 'materiel', 'quantite')
    list_filter = ('evenement', 'materiel')
    search_fields = ('evenement__titre', 'materiel__nom')
    autocomplete_fields = ['evenement', 'materiel']
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True

@admin.register(ChronogrammeItem)
class ChronogrammeItemAdmin(admin.ModelAdmin):
    list_display = ('evenement', 'titre', 'heure_debut', 'heure_fin', 'responsable')
    list_filter = ('evenement',)
    search_fields = ('titre', 'description', 'responsable')
    #date_hierarchy = 'heure_debut'
    ordering = ('evenement', 'heure_debut')
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True

@admin.register(MembreLogistique, site=admin_site)
class MembreLogistiqueAdmin(admin.ModelAdmin):
    list_display = ('get_utilisateur_email', 'logistique', 'get_role', 'is_actif')
    list_filter = ('logistique',)  # Retrait de la condition qui pouvait retourner None
    search_fields = ('utilisateur__email', 'utilisateur__first_name', 'utilisateur__last_name', 'role')
    
    def get_role(self, obj):
        return obj.role
    get_role.short_description = 'Rôle'
    
    def get_utilisateur_email(self, obj):
        return obj.utilisateur.email if obj.utilisateur else 'Aucun utilisateur'
    get_utilisateur_email.short_description = 'Email utilisateur'
    get_utilisateur_email.admin_order_field = 'utilisateur__email'
    
    def is_actif(self, obj):
        return obj.actif
    is_actif.boolean = True
    is_actif.short_description = 'Actif'
    is_actif.admin_order_field = 'actif'
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
@admin.register(FormationLogisticien, site=admin_site)
class FormationLogisticienAdmin(admin.ModelAdmin):
    list_display = ("user", "eglise", "est_forme", "date_form")
    list_filter = ("est_forme", "eglise")
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
        
 

