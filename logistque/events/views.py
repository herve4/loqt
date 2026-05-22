from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.db import transaction
from django.views.generic import (
    ListView, DetailView, CreateView, UpdateView, DeleteView, TemplateView
)
from logistque.models import Logistique
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy, reverse
from django.contrib import messages
from datetime import timedelta, datetime
from django.db.models import Q, Count
from django.db.models.functions import TruncMonth
import json
from django.http import JsonResponse
from django.core.serializers.json import DjangoJSONEncoder
from accounts.models import CustomUser
from logistque.models import (
    Evenement, 
    ReservationMateriel, 
    DemandePermission,
    Eglise,
    Materiel,
    ChronogrammeItem
)
from logistque.events.forms import EventForm, ChronogrammeItemForm

@login_required
def dashboard_events(request):
    # --- Données pour les graphiques ---
    current_year = timezone.now().year

    # 1. Événements par mois
    events_by_month = Evenement.objects.filter(date_debut__year=current_year) \
        .annotate(month=TruncMonth('date_debut')) \
        .values('month') \
        .annotate(count=Count('id')) \
        .order_by('month')

    month_labels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    month_data = [0] * 12
    for item in events_by_month:
        month_index = item['month'].month - 1
        month_data[month_index] = item['count']

    # 2. Répartition par type d'événement
    events_by_type = Evenement.objects.values('type_evenement') \
        .annotate(count=Count('id')) \
        .order_by('-count')

    # Utiliser les libellés complets des choix pour plus de clarté
    type_choices_dict = dict(Evenement.TYPE_EVENEMENT)
    type_labels = [type_choices_dict.get(item['type_evenement'], item['type_evenement']) for item in events_by_type]
    type_data = [item['count'] for item in events_by_type]

    # --- Données pour le calendrier FullCalendar ---
    all_events = Evenement.objects.all()
    calendar_events = []
    for event in all_events:
        calendar_events.append({
            'id': event.pk,
            'title': event.titre,
            'start': event.date_debut.isoformat(),
            'end': event.date_fin.isoformat(),
            'url': event.get_absolute_url(),
            'extendedProps': {
                'type': event.type_evenement,
                'description': event.description or '',
                'chronogramme': event.chronogramme or []
            }
        })

    # Événements à venir (7 prochains jours)
    now = timezone.now()
    upcoming_events = Evenement.objects.filter(
        date_debut__gte=now,
        date_debut__lte=now + timedelta(days=7)
    ).order_by('date_debut')[:5]
    
    # Demandes en attente (pour les administrateurs)
    pending_requests = []
    if request.user.is_staff:
        pending_requests = DemandePermission.objects.filter(
            statut='en_attente'
        ).select_related('user')[:3]
    
    # Matériels réservés récemment
    recent_reservations = ReservationMateriel.objects.filter(
        evenement__date_debut__gte=now,
        materiel__logistique__eglise=request.user.eglise
    ).select_related('materiel', 'evenement')[:5]
    
    context = {
        'upcoming_events': upcoming_events,
        'pending_requests': pending_requests,
        'recent_reservations': recent_reservations,
        
        # Données pour les graphiques
        'events_by_month_labels': json.dumps(month_labels),
        'events_by_month_data': json.dumps(month_data),
        'events_by_type_labels': json.dumps(type_labels),
        'events_by_type_data': json.dumps(type_data),
        'calendar_events': json.dumps(calendar_events), # Ajout des données du calendrier
    }
    
    return render(request, 'events/dashboard_events.html', context)


class EventListView(LoginRequiredMixin, ListView):
    model = Evenement
    template_name = 'events/event_list.html'
    context_object_name = 'events'
    paginate_by = 10
    
    def get_queryset(self):
        queryset = Evenement.objects.all().order_by('-date_debut')
        
        # Filtrage par recherche
        query = self.request.GET.get('q')
        if query:
            queryset = queryset.filter(
                Q(titre__icontains=query) |
                Q(description__icontains=query) |
                Q(organisateur_nom__icontains=query)
            )
            
        # Filtrage par type d'événement
        type_evenement = self.request.GET.get('type')
        if type_evenement:
            queryset = queryset.filter(type_evenement=type_evenement)
            
        # Filtrage par statut (à venir, en cours, terminé)
        statut = self.request.GET.get('statut')
        now = timezone.now()
        if statut == 'a_venir':
            queryset = queryset.filter(date_debut__gt=now)
        elif statut == 'en_cours':
            queryset = queryset.filter(date_debut__lte=now, date_fin__gte=now)
        elif statut == 'termine':
            queryset = queryset.filter(date_fin__lt=now)
            
        return queryset
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Liste des événements'
        context['search_query'] = self.request.GET.get('q', '')
        context['selected_type'] = self.request.GET.get('type', '')
        context['selected_status'] = self.request.GET.get('status', '')
        
        # Ajouter les choix pour les filtres
        context['event_types'] = Evenement.TYPE_CHOICES
        context['status_choices'] = [
            ('a_venir', 'À venir'),
            ('en_cours', 'En cours'),
            ('termine', 'Terminés'),
        ]
        
        return context


class EventDetailView(LoginRequiredMixin, DetailView):
    model = Evenement
    template_name = 'events/event_detail.html'
    context_object_name = 'event'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        event = self.object
        context['title'] = event.titre
        context['now'] = timezone.now()
        
        # Récupérer les réservations de matériel pour cet événement
        reservations = event.reservations_evenement.all().select_related('materiel')
        context['reservations'] = reservations
        
        # Vérifier si l'utilisateur est l'organisateur ou a les droits
        is_organizer = (event.organisateur_type == 'eglise' and 
                       hasattr(self.request.user, 'eglise') and 
                       self.request.user.eglise == event.eglise)
        context['can_edit'] = is_organizer or self.request.user.is_staff
        
        # Statut de l'événement
        context['event_status'] = event.get_status()
        
        # Participants (si le modèle est lié)
        if hasattr(event, 'participants'):
            context['participants'] = event.participants.all()
        else:
            context['participants'] = []
            
        # Les exports sont maintenant gérés côté client via JavaScript
        
        # Charger le chronogramme si disponible
        if hasattr(event, 'chronogramme_evenement'):
            context['chronogram_items'] = event.chronogramme_evenement.all().order_by('heure_debut')
        
        return context


class EventCreateView(LoginRequiredMixin, CreateView):
    model = Evenement
    form_class = EventForm
    template_name = 'events/event_form.html'

    def get_initial(self):
        initial = super().get_initial()
        start_date = self.request.GET.get('start')
        end_date = self.request.GET.get('end')
        
        # Si les dates viennent du calendrier, on les formate correctement
        if start_date:
            try:
                # Essayer de parser la date au format ISO 8601 (format standard des dates JS)
                from datetime import datetime
                
                # Supprimer les millisecondes si elles existent
                if '.' in start_date:
                    start_date = start_date.split('.')[0] + start_date[-6:]  # Conserver le fuseau horaire
                
                # Gérer différents formats de date (avec ou sans fuseau horaire)
                if 'T' in start_date:
                    try:
                        # Format avec fuseau horaire: 2025-07-31T09:00:00+00:00
                        if '+' in start_date or '-' in start_date[-6:]:
                            start_dt = datetime.strptime(start_date, '%Y-%m-%dT%H:%M:%S%z')
                        # Format sans fuseau horaire
                        else:
                            start_dt = datetime.strptime(start_date, '%Y-%m-%dT%H:%M:%S')
                            # Ajouter le fuseau horaire par défaut
                            from django.utils import timezone as django_timezone
                            start_dt = django_timezone.make_aware(start_dt)
                    except ValueError:
                        # Essayer avec un format sans secondes si nécessaire
                        try:
                            start_dt = datetime.strptime(start_date, '%Y-%m-%dT%H:%M%z')
                        except ValueError:
                            # Format simple sans secondes ni fuseau
                            start_dt = datetime.strptime(start_date, '%Y-%m-%dT%H:%M')
                            from django.utils import timezone as django_timezone
                            start_dt = django_timezone.make_aware(start_dt)
                else:
                    # Si seulement la date est fournie, ajouter une heure par défaut (9h)
                    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
                    start_dt = start_dt.replace(hour=9, minute=0)
                    from django.utils import timezone as django_timezone
                    start_dt = django_timezone.make_aware(start_dt)
                
                # Formater pour l'affichage dans le formulaire
                initial['date_debut'] = start_dt.strftime('%Y-%m-%dT%H:%M')
                
            except (ValueError, TypeError) as e:
                print(f"Erreur de format de date de début: {e}")
                initial['date_debut'] = start_date or ''
                
        if end_date:
            try:
                from datetime import datetime
                
                # Supprimer les millisecondes si elles existent
                if '.' in end_date:
                    end_date = end_date.split('.')[0] + end_date[-6:]  # Conserver le fuseau horaire
                
                # Gérer différents formats de date (avec ou sans fuseau horaire)
                if 'T' in end_date:
                    try:
                        # Format avec fuseau horaire: 2025-08-04T17:00:00+00:00
                        if '+' in end_date or '-' in end_date[-6:]:
                            end_dt = datetime.strptime(end_date, '%Y-%m-%dT%H:%M:%S%z')
                        # Format sans fuseau horaire
                        else:
                            end_dt = datetime.strptime(end_date, '%Y-%m-%dT%H:%M:%S')
                            # Ajouter le fuseau horaire par défaut
                            from django.utils import timezone as django_timezone
                            end_dt = django_timezone.make_aware(end_dt)
                    except ValueError:
                        # Essayer avec un format sans secondes si nécessaire
                        try:
                            end_dt = datetime.strptime(end_date, '%Y-%m-%dT%H:%M%z')
                        except ValueError:
                            # Format simple sans secondes ni fuseau
                            end_dt = datetime.strptime(end_date, '%Y-%m-%dT%H:%M')
                            from django.utils import timezone as django_timezone
                            end_dt = django_timezone.make_aware(end_dt)
                else:
                    # Si seulement la date est fournie, ajouter une heure par défaut (17h)
                    end_dt = datetime.strptime(end_date, '%Y-%m-%d')
                    end_dt = end_dt.replace(hour=17, minute=0)
                    from django.utils import timezone as django_timezone
                    end_dt = django_timezone.make_aware(end_dt)
                
                # Formater pour l'affichage dans le formulaire
                initial['date_fin'] = end_dt.strftime('%Y-%m-%dT%H:%M')
                
            except (ValueError, TypeError) as e:
                print(f"Erreur de format de date de fin: {e}")
                initial['date_fin'] = end_date or ''
                
        return initial
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Créer un nouvel événement'
        
        # Récupérer les logisticiens disponibles
        context['logisticiens'] = CustomUser.objects.filter(
            groups__name='Logisticiens'
        ).select_related('eglise').order_by('first_name', 'last_name')
        
        # Récupérer les matériels disponibles
        context['materiels_disponibles'] = Materiel.objects.filter(
            eglise=self.request.user.eglise,
            quantite__gt=0
        ).select_related('categorie')
        
        # Ajouter le formulaire de chronogramme au contexte
        if self.request.POST:
            context['chronogram_forms'] = self.form_class.chronogram_forms(
                self.request.POST,
                instance=self.object if hasattr(self, 'object') else None,
                prefix='chronogram'
            )
        else:
            context['chronogram_forms'] = self.form_class.chronogram_forms(
                instance=self.object if hasattr(self, 'object') else None,
                prefix='chronogram'
            )
        
        return context
    
    def form_valid(self, form):
        form.instance.organisateur_nom = self.request.user
        
        if hasattr(self.request.user, 'eglise'):
            form.instance.eglise = self.request.user.eglise
        
        # Récupérer les dates formatées si elles sont présentes
        formatted_start = self.request.POST.get('formatted_date_debut')
        formatted_end = self.request.POST.get('formatted_date_fin')
        
        # Sauvegarder d'abord l'événement sans commettre la transaction
        self.object = form.save(commit=False)
        
        # Mettre à jour les champs formatés si disponibles
        if formatted_start:
            self.object.formatted_date_debut = formatted_start
        if formatted_end:
            self.object.formatted_date_fin = formatted_end
        
        # Valider les formulaires de chronogramme
        chronogram_forms = form.chronogram_forms(
            self.request.POST,
            instance=self.object,
            prefix='chronogram'
        )
        
        # Vérifier si tous les formulaires sont valides
        if not all([form.is_valid() for form in chronogram_forms]):
            return self.form_invalid(form)
        
        # Sauvegarder l'événement
        self.object.save()
        
        # Mettre à jour les logisticiens assignés
        logisticien_ids = self.request.POST.getlist('logisticiens')
        if logisticien_ids:
            # Vérifier que les IDs sont valides avant de les assigner
            valid_ids = CustomUser.objects.filter(
                id__in=logisticien_ids,
                groups__name='Logisticiens'
            ).values_list('id', flat=True)
            
            if valid_ids:
                self.object.logisticiens_gestion.set(valid_ids)
        else:
            # Si aucun logisticien n'est sélectionné, vider la relation
            self.object.logisticiens_gestion.clear()
        
        # Sauvegarder les formulaires de chronogramme
        for chrono_form in chronogram_forms:
            if chrono_form.cleaned_data and not chrono_form.cleaned_data.get('DELETE', False):
                chrono_item = chrono_form.save(commit=False)
                chrono_item.evenement = self.object
                
                # Mettre à jour les champs de date formatée pour le chronogramme
                if hasattr(chrono_form, 'cleaned_data') and 'formatted_date' in chrono_form.cleaned_data:
                    chrono_item.formatted_date = chrono_form.cleaned_data['formatted_date']
                
                chrono_item.save()
        
        # Gérer les matériels sélectionnés
        materiels_data = {}
        for key, value in self.request.POST.items():
            if key.startswith('materiels['):
                parts = key.split('[')[1].split(']')
                mat_id = parts[0]
                field = parts[1].strip('[').strip(']')
                
                if mat_id not in materiels_data:
                    materiels_data[mat_id] = {}
                materiels_data[mat_id][field] = value
        
        for mat_id, data in materiels_data.items():
            if mat_id:  # S'assurer que l'ID n'est pas vide
                try:
                    materiel = Materiel.objects.get(id=mat_id)
                    EvenementMateriel.objects.create(
                        evenement=self.object,
                        materiel=materiel,
                        quantite=data.get('quantite', 1),
                        ajoute_par=self.request.user
                    )
                except (Materiel.DoesNotExist, ValueError):
                    continue
        
        messages.success(self.request, "L'événement a été créé avec succès.")
        return super().form_valid(form)
    
    def get_success_url(self):
        return reverse('events:event_detail', kwargs={'pk': self.object.pk})

class EventUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Evenement
    form_class = EventForm
    template_name = 'events/event_form.html'
    
    def get_form_kwargs(self):
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs
    
    def test_func(self):
        event = self.get_object()
        return self.request.user == event.organisateur_nom or self.request.user.is_staff
    
    def handle_no_permission(self):
        messages.error(self.request, "Vous n'êtes pas autorisé à modifier cet événement.")
        return redirect('events:event_list')
    
    def form_valid(self, form):
        # Récupérer les dates formatées si elles sont présentes
        formatted_start = self.request.POST.get('formatted_date_debut')
        formatted_end = self.request.POST.get('formatted_date_fin')
        
        # Sauvegarder d'abord l'événement sans commettre la transaction
        self.object = form.save(commit=False)
        
        # Mettre à jour les champs formatés si disponibles
        if formatted_start:
            self.object.formatted_date_debut = formatted_start
        if formatted_end:
            self.object.formatted_date_fin = formatted_end
        
        # Valider les formulaires de chronogramme
        chronogram_forms = form.chronogram_forms(
            self.request.POST,
            instance=self.object,
            prefix='chronogram'
        )
        
        # Vérifier si tous les formulaires sont valides
        if not all([form.is_valid() for form in chronogram_forms]):
            return self.form_invalid(form)
        
        # Sauvegarder l'événement
        self.object.save()
        
        # Mettre à jour les logisticiens assignés
        logisticien_ids = self.request.POST.getlist('logisticiens')
        if logisticien_ids:
            # Vérifier que les IDs sont valides avant de les assigner
            valid_ids = CustomUser.objects.filter(
                id__in=logisticien_ids,
                groups__name='Logisticiens'
            ).values_list('id', flat=True)
            
            if valid_ids:
                self.object.logisticiens_gestion.set(valid_ids)
        else:
            # Si aucun logisticien n'est sélectionné, vider la relation
            self.object.logisticiens_gestion.clear()
        
        # Supprimer les anciens éléments de chronogramme
        self.object.chronogrammeitem_set.all().delete()
        
        # Sauvegarder les nouveaux formulaires de chronogramme
        for chrono_form in chronogram_forms:
            if chrono_form.cleaned_data and not chrono_form.cleaned_data.get('DELETE', False):
                chrono_item = chrono_form.save(commit=False)
                chrono_item.evenement = self.object
                
                # Mettre à jour les champs de date formatée pour le chronogramme
                if hasattr(chrono_form, 'cleaned_data') and 'formatted_date' in chrono_form.cleaned_data:
                    chrono_item.formatted_date = chrono_form.cleaned_data['formatted_date']
                
                chrono_item.save()
        
        # Gérer les matériels sélectionnés
        materiels_data = {}
        for key, value in self.request.POST.items():
            if key.startswith('materiels['):
                parts = key.split('[')[1].split(']')
                mat_id = parts[0]
                field = parts[1].strip('[').strip(']')
                
                if mat_id not in materiels_data:
                    materiels_data[mat_id] = {}
                materiels_data[mat_id][field] = value
        
        # Supprimer les anciennes réservations de matériel
        self.object.evenementmateriel_set.all().delete()
        
        # Créer les nouvelles réservations de matériel
        for mat_id, data in materiels_data.items():
            if mat_id:  # S'assurer que l'ID n'est pas vide
                try:
                    materiel = Materiel.objects.get(id=mat_id)
                    EvenementMateriel.objects.create(
                        evenement=self.object,
                        materiel=materiel,
                        quantite=data.get('quantite', 1),
                        ajoute_par=self.request.user
                    )
                except (Materiel.DoesNotExist, ValueError, KeyError):
                    continue
        
        messages.success(self.request, "L'événement a été mis à jour avec succès.")
        return super().form_valid(form)
    
    def get_success_url(self):
        return reverse('events:event_detail', kwargs={'pk': self.object.pk})
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = f"Modifier {self.object.titre}"
        
        # Récupérer les logisticiens disponibles
        context['logisticiens'] = CustomUser.objects.filter(
            groups__name='Logisticiens'
        ).select_related('eglise').order_by('first_name', 'last_name')
        
        # Définir les logisticiens sélectionnés
        if self.object:
            context['selected_logisticiens'] = list(self.object.logisticiens_gestion.values_list('id', flat=True))
        
        # Récupérer les matériels disponibles
        context['materiels_disponibles'] = Materiel.objects.filter(
            eglise=self.request.user.eglise,
            quantite__gt=0
        ).select_related('categorie')
        
        # Récupérer les matériels déjà sélectionnés pour cet événement
        context['materiels_selectionnes'] = self.object.evenementmateriel_set.select_related('materiel').all()
        
        # Ajouter le formulaire de chronogramme au contexte
        if self.request.POST:
            context['chronogram_forms'] = self.form_class.chronogram_forms(
                self.request.POST,
                instance=self.object,
                prefix='chronogram'
            )
        else:
            context['chronogram_forms'] = self.form_class.chronogram_forms(
                instance=self.object,
                prefix='chronogram'
            )
        return context


class EventDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    model = Evenement
    template_name = 'events/event_confirm_delete.html'
    success_url = reverse_lazy('events:event_list')
    
    def test_func(self):
        event = self.get_object()
        return self.request.user == event.organisateur_nom or self.request.user.is_staff
    
    def handle_no_permission(self):
        messages.error(self.request, "Vous n'êtes pas autorisé à supprimer cet événement.")
        return redirect('events:event_list')
    
    def delete(self, request, *args, **kwargs):
        messages.success(request, "L'événement a été supprimé avec succès.")
        return super().delete(request, *args, **kwargs)


class EventCalendarView(LoginRequiredMixin, TemplateView):
    """
    Vue avancée pour le calendrier des événements avec :
    - Affichage responsive
    - Gestion des permissions
    - Drag & drop
    - Export multiple formats
    - Filtres avancés
    """
    template_name = 'events/event_calendar.html'
    def get(self, request, *args, **kwargs):
        # Vérifier si c'est une requête de filtrage AJAX
        if request.GET.get('filter') == 'true' and request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return self.handle_ajax_request(request)
        return super().get(request, *args, **kwargs)

    def handle_ajax_request(self, request):
        try:
            # Récupérer les paramètres de filtrage
            filters = {
                'type': request.GET.get('type'),
                'eglise': request.GET.get('eglise'),
                'start_date': request.GET.get('start_date'),
                'end_date': request.GET.get('end_date')
            }

            # Appliquer les filtres
            events = self.apply_filters(filters)
            events_data = self.get_events_json(events)
            print(f"Envoi de {len(events_data)} événements")  # À mettre dans handle_ajax_request
            
            return JsonResponse({'events': events_data})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

    def apply_filters(self, filters):
        """Applique les filtres aux événements"""
        events = self.get_filtered_events()
        
        if filters['type']:
            events = events.filter(type_evenement=filters['type'])
        if filters['eglise']:
            events = events.filter(eglise_id=filters['eglise'])
        if filters['start_date']:
            start_date = timezone.make_aware(datetime.strptime(filters['start_date'], '%Y-%m-%d'))
            events = events.filter(date_debut__gte=start_date)
        if filters['end_date']:
            end_date = timezone.make_aware(datetime.strptime(filters['end_date'], '%Y-%m-%d'))
            events = events.filter(date_fin__lte=end_date)
            
        return events
    
    def get_context_data(self, **kwargs):
        """Prépare le contexte pour les requêtes normales"""
        context = super().get_context_data(**kwargs)
    
        # Récupération normale des événements
        events = self.get_filtered_events()
        events_data = self.get_events_json(events)
        context['events_json'] = json.dumps(events_data, cls=DjangoJSONEncoder)
        
        # Configuration du calendrier
        context.update({
            'event_types': Evenement.TYPE_EVENEMENT,
            'eglises': self.get_filtered_eglises(),
            'calendar_options': json.dumps(self.get_calendar_options(), cls=DjangoJSONEncoder),
            'export_formats': ['pdf', 'excel', 'csv'],
            'timezone': timezone.get_current_timezone_name(),
        })
        
        return context
    
    def parse_date(date_str):
        """Convertit une chaîne de date en datetime avec fuseau horaire"""
        if not date_str:
            return None
        try:
            return timezone.make_aware(datetime.strptime(date_str, '%Y-%m-%d'))
        except ValueError:
            raise ValueError("Format de date invalide. Utilisez YYYY-MM-DD")
        
    def get_filtered_events_by_params(self, params):
        """Filtre les événements selon les paramètres donnés"""
        events = self.get_filtered_events()
    
        if params.get('type'):
            events = events.filter(type_evenement=params['type'])
        if params.get('eglise'):
            events = events.filter(eglise_id=params['eglise'])
    
        try:
            if params.get('start_date'):
                start_date = self.parse_date(params['start_date'])
                events = events.filter(date_debut__gte=start_date)
            if params.get('end_date'):
                end_date = self.parse_date(params['end_date'])
                events = events.filter(date_fin__lte=end_date)
        except ValueError:
            raise ValueError("Format de date invalide")
    
        return events
        
    def get_filtered_events(self):
        """Filtre les événements selon les permissions de l'utilisateur"""
        user = self.request.user
        
        # Superutilisateur voit tout
        if user.is_superuser:
            return Evenement.objects.all().select_related('eglise')
            
        # Staff peut voir les événements des églises dont il est responsable logistique
        elif user.is_staff:
            # Vérifier si l'utilisateur est responsable logistique d'une église
            try:
                logistique = Logistique.objects.get(responsable=user)
                return Evenement.objects.filter(eglise=logistique.eglise).select_related('eglise')
            except Logistique.DoesNotExist:
                # Si l'utilisateur n'est pas responsable logistique, il ne voit que ses propres événements
                return Evenement.objects.filter(logisticiens_gestion=user).select_related('eglise')
                
        # Utilisateur normal ne voit que les événements de son église
        if hasattr(user, 'eglise') and user.eglise:
            return Evenement.objects.filter(eglise=user.eglise).select_related('eglise')
            
        # Par défaut, retourner une queryset vide
        return Evenement.objects.none()
    
    def get_filtered_eglises(self):
        """Filtre les églises selon les permissions de l'utilisateur"""
        user = self.request.user
        
        # Superutilisateur voit tout
        if user.is_superuser:
            return Eglise.objects.all()
            
        # Staff peut voir les églises dont il est responsable logistique
        if user.is_staff:
            try:
                logistique = Logistique.objects.get(responsable=user)
                return Eglise.objects.filter(id=logistique.eglise.id)
            except Logistique.DoesNotExist:
                # Si l'utilisateur n'est pas responsable logistique, il ne voit que son église
                if hasattr(user, 'eglise') and user.eglise:
                    return Eglise.objects.filter(id=user.eglise.id)
                return Eglise.objects.none()
                
        # Utilisateur normal ne voit que son église
        if hasattr(user, 'eglise') and user.eglise:
            return Eglise.objects.filter(id=user.eglise.id)
            
        # Par défaut, retourner une queryset vide
        return Eglise.objects.none()
    
    def get_calendar_options(self):
        """Retourne la configuration du calendrier FullCalendar"""
        return {
            'initialView': 'dayGridMonth',
            'locale': 'fr',
            'timeZone': timezone.get_current_timezone_name(),
            'firstDay': 1,  # Lundi comme premier jour
            'headerToolbar': {
                'left': 'prev,next today',
                'center': 'title',
                'right': 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            },
            'editable': self.request.user.has_perm('logistique.change_evenement'),
            'selectable': self.request.user.has_perm('logistique.add_evenement'),
            'selectMirror': True,
            'dayMaxEvents': True,
            'eventDisplay': 'block',
            'eventTimeFormat': { 'hour': '2-digit', 'minute': '2-digit', 'hour12': False },
            'eventDidMount': 'function(info) { setupEventTooltip(info); }',
            'eventClick': 'function(info) { handleEventClick(info); }',
            'eventDrop': 'function(info) { handleEventDrop(info); }',
            'eventResize': 'function(info) { handleEventResize(info); }',
            'select': 'function(info) { handleDateSelect(info); }',
        }
    
    def get_events_json(self, events):
        """Formate les événements pour FullCalendar"""
        return [
            {
                'id': event.id,
                'title': event.titre,
                'start': event.date_debut.isoformat(),
                'end': event.date_fin.isoformat() if event.date_fin else None,
                'url': reverse('events:event_detail', args=[event.pk]),
                'color': self.get_event_color(event.type_evenement),
                'textColor': '#ffffff',
                'extendedProps': {
                    'type': event.type_evenement,
                    'eglise': event.eglise.nom if event.eglise else None,
                    'organisateur': str(event.organisateur_nom),
                    'description': event.description,
                    'status': event.statut,
                },
                'editable': self.request.user.has_perm('logistique.change_evenement'),
            }
            for event in events
        ]
    
    def get_event_color(self, event_type):
        """Retourne une couleur selon le type d'événement"""
        colors = {
            'reunion': '#4e73df',
            'culte': '#1cc88a',
            'conference': '#f6c23e',
            'formation': '#36b9cc',
            'autre': '#858796'
        }
        return colors.get(event_type.lower(), '#e74a3b')
    
    def post(self, request, *args, **kwargs):
        """Gère les actions AJAX"""
        if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'error': 'Requête invalide'}, status=400)
            
        action = request.POST.get('action')
        
        handlers = {
            'update_event_date': self.handle_event_date_update,
            'create_event': self.handle_event_creation,
            'export_events': self.handle_event_export,
        }
        
        handler = handlers.get(action)
        if not handler:
            return JsonResponse({'error': 'Action non reconnue'}, status=400)
            
        return handler(request)
    
    def handle_filter_request(self):
        """Gère les requêtes de filtrage AJAX"""
        event_type = self.request.GET.get('type')
        eglise_id = self.request.GET.get('eglise')
        start_date_str = self.request.GET.get('start_date')
        end_date_str = self.request.GET.get('end_date')
        
        # Filtrer les événements de base selon les permissions
        events = self.get_filtered_events()
        
        # Appliquer les filtres supplémentaires
        if event_type:
            events = events.filter(type_evenement=event_type)
        if eglise_id:
            events = events.filter(eglise_id=eglise_id)
        
        # Gestion des dates avec fuseau horaire
        try:
            if start_date_str:
                start_date = timezone.make_aware(datetime.strptime(start_date_str, '%Y-%m-%d'))
                events = events.filter(date_debut__gte=start_date)
            if end_date_str:
                end_date = timezone.make_aware(datetime.strptime(end_date_str, '%Y-%m-%d'))
                events = events.filter(date_fin__lte=end_date)
        except ValueError:
            return JsonResponse({'error': 'Format de date invalide'}, status=400)
        
        # Sérialiser les événements filtrés
        events_data = self.get_events_json(events)
        
        # Pour une requête AJAX, retourner directement la réponse JSON
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'events': events_data})
        
        # Pour une requête normale, intégrer dans le contexte
        context = self.get_context_data()
        context['events_json'] = json.dumps(events_data, cls=DjangoJSONEncoder)
        return context
    
    def handle_event_date_update(self, request):
        """Gère le déplacement d'événement (drag & drop)"""
        event_id = request.POST.get('event_id')
        start = request.POST.get('start')
        end = request.POST.get('end')
        
        try:
            event = Evenement.objects.get(pk=event_id)
            if not self.check_event_permission(request.user, event):
                return JsonResponse({'error': 'Permission refusée'}, status=403)
                
            event.date_debut = timezone.make_aware(datetime.fromisoformat(start))
            if end:
                event.date_fin = timezone.make_aware(datetime.fromisoformat(end))
            event.save()
            
            # create_notification(
            #     user=request.user,
            #     title=f"Événement déplacé",
            #     message=f"L'événement {event.titre} a été déplacé",
            #     event=event,
            #     notification_type='event_updated'
            # )
            
            return JsonResponse({'success': True})
            
        except Evenement.DoesNotExist:
            return JsonResponse({'error': 'Événement non trouvé'}, status=404)
    
    def handle_event_creation(self, request):
        """Crée un nouvel événement"""
        if not request.user.has_perm('logistique.add_evenement'):
            return JsonResponse({'error': 'Permission refusée'}, status=403)
            
        form = EventForm(request.POST)
        if form.is_valid():
            event = form.save(commit=False)
            event.organisateur_nom = request.user
            event.eglise = request.user.eglise
            event.save()
            
            # create_notification(
            #     user=request.user,
            #     title="Nouvel événement créé",
            #     message=f"L'événement {event.titre} a été créé",
            #     event=event,
            #     notification_type='event_created'
            # )
            
            return JsonResponse({
                'success': True,
                'event': self.get_events_json([event])[0]
            })
        return JsonResponse({'error': 'Données invalides', 'errors': form.errors}, status=400)
    

    
    def check_event_permission(self, user, event):
        """Vérifie les permissions sur un événement"""
        if user.is_superuser:
            return True
        if user.is_staff:
            return event.eglise in user.managed_eglises.all()
        return event.eglise == user.eglise


# Vues pour la gestion du matériel des événements
class EventMaterialCreateView(LoginRequiredMixin, CreateView):
    model = ReservationMateriel
    fields = ['materiel', 'quantite', 'date_debut', 'date_fin']
    template_name = 'events/event_material_form.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['event'] = get_object_or_404(Evenement, pk=self.kwargs['event_pk'])
        return context
    
    def form_valid(self, form):
        event = get_object_or_404(Evenement, pk=self.kwargs['event_pk'])
        form.instance.evenement = event
        form.instance.demandeur = self.request.user
        
        # Vérifier la disponibilité du matériel
        materiel = form.cleaned_data['materiel']
        quantite = form.cleaned_data['quantite']
        date_debut = form.cleaned_data['date_debut']
        date_fin = form.cleaned_data['date_fin']
        
        # Vérifier si le matériel est disponible
        if not materiel.est_disponible(quantite, date_debut, date_fin):
            form.add_error(None, "Désolé, la quantité demandée n'est pas disponible pour la période sélectionnée.")
            return self.form_invalid(form)
        
        response = super().form_valid(form)
        messages.success(self.request, "Le matériel a été réservé avec succès pour cet événement.")
        return response
    
    def get_success_url(self):
        return reverse('event_detail', kwargs={'pk': self.kwargs['pk']})


class ChronogramItemCreateView(LoginRequiredMixin, CreateView):
    """
    Vue pour ajouter un nouvel élément au chronogramme d'un événement
    """
    model = ChronogrammeItem
    form_class = ChronogrammeItemForm
    template_name = 'events/chronogram_item_form.html'

    def get_initial(self):
        """
        Initialise le formulaire avec l'événement correspondant
        """
        initial = super().get_initial()
        event_id = self.kwargs.get('event_pk')
        if event_id:
            initial['evenement'] = get_object_or_404(Evenement, pk=event_id)
        return initial

    def get_form_kwargs(self):
        """
        Passe l'utilisateur connecté au formulaire
        """
        kwargs = super().get_form_kwargs()
        kwargs['user'] = self.request.user
        return kwargs

    def form_valid(self, form):
        """
        S'assure que l'élément est bien lié à l'événement
        """
        event_id = self.kwargs.get('event_pk')
        event = get_object_or_404(Evenement, pk=event_id)
        form.instance.evenement = event
        
        # Vérification des conflits d'horaire
        start_time = form.cleaned_data.get('heure_debut')
        end_time = form.cleaned_data.get('heure_fin')
        
        if start_time >= end_time:
            form.add_error('heure_fin', "L'heure de fin doit être postérieure à l'heure de début.")
            return self.form_invalid(form)
            
        # Vérifier les conflits avec d'autres éléments du chronogramme
        conflicting_items = event.chronogramme_evenement.filter(
            Q(heure_debut__lt=end_time, heure_fin__gt=start_time)
        )
        
        if conflicting_items.exists():
            form.add_error(None, "Cet horaire entre en conflit avec une activité existante.")
            return self.form_invalid(form)
            
        response = super().form_valid(form)
        messages.success(self.request, "L'activité a été ajoutée au chronogramme avec succès.")
        return response

    def get_success_url(self):
        return reverse_lazy('events:event_detail', kwargs={'pk': self.kwargs.get('event_id')})
        
    def get_context_data(self, **kwargs):
        """
        Ajoute l'événement au contexte pour l'affichage
        """
        context = super().get_context_data(**kwargs)
        event_id = self.kwargs.get('event_id')
        if event_id:
            context['event'] = get_object_or_404(Evenement, id=event_id)
        return context


class EventMaterialUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    """Vue pour mettre à jour une réservation de matériel"""
    model = ReservationMateriel
    fields = ['quantite', 'notes', 'date_debut', 'date_fin']
    template_name = 'events/event_material_form.html'
    
    def test_func(self):
        """Vérifie que l'utilisateur est l'organisateur de l'événement ou un administrateur"""
        reservation = self.get_object()
        return self.request.user == reservation.evenement.organisateur_nom or self.request.user.is_staff
    
    def get_success_url(self):
        return reverse('events:event_detail', kwargs={'pk': self.object.evenement.id})
    
    def form_valid(self, form):
        messages.success(self.request, 'La réservation de matériel a été mise à jour avec succès.')
        return super().form_valid(form)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['event'] = self.object.evenement
        context['is_update'] = True
        return context


class EventMaterialDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    """Vue pour supprimer une réservation de matériel"""
    model = ReservationMateriel
    template_name = 'events/event_material_confirm_delete.html'
    
    def test_func(self):
        """Vérifie que l'utilisateur est l'organisateur de l'événement ou un administrateur"""
        reservation = self.get_object()
        return self.request.user == reservation.evenement.organisateur_nom or self.request.user.is_staff
    
    def get_success_url(self):
        event_id = self.object.evenement.id
        return reverse('events:event_detail', kwargs={'pk': event_id})
    
    def delete(self, request, *args, **kwargs):
        response = super().delete(request, *args, **kwargs)
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': True})
        messages.success(request, 'La réservation de matériel a été supprimée avec succès.')
        return response


class EventParticipantCreateView(LoginRequiredMixin, UserPassesTestMixin, CreateView):
    """Vue pour ajouter un participant à un événement"""
    model = CustomUser
    fields = []  # Le formulaire sera géré en AJAX
    template_name = 'events/event_participant_form.html'
    
    def test_func(self):
        """Vérifie que l'utilisateur est l'organisateur de l'événement ou un administrateur"""
        event = get_object_or_404(Evenement, pk=self.kwargs.get('event_pk'))
        return self.request.user == event.organisateur_nom or self.request.user.is_staff
    
    def form_valid(self, form):
        event = get_object_or_404(Evenement, pk=self.kwargs.get('event_pk'))
        user_id = self.request.POST.get('user_id')
        
        try:
            user = User.objects.get(pk=user_id)
            if user in event.participants.all():
                messages.warning(self.request, f"{user.get_full_name()} est déjà participant à cet événement.")
            else:
                event.participants.add(user)
                messages.success(self.request, f"{user.get_full_name()} a été ajouté aux participants avec succès.")
                
                # Envoyer une notification à l'utilisateur ajouté
                Notification.objects.create(
                    user=user,
                    title=f"Ajout à l'événement : {event.titre}",
                    message=f"Vous avez été ajouté comme participant à l'événement '{event.titre}'.",
                    content_type=ContentType.objects.get_for_model(Evenement),
                    object_id=event.id,
                    notification_type='event_participant_added'
                )
                
        except User.DoesNotExist:
            messages.error(self.request, "L'utilisateur spécifié n'existe pas.")
        
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': 'Participant ajouté avec succès.'
            })
            
        return redirect('events:event_detail', pk=event.id)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['event'] = get_object_or_404(Evenement, pk=self.kwargs.get('event_pk'))
        return context


class EventParticipantDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    """Vue pour supprimer un participant d'un événement"""
    model = CustomUser
    template_name = 'events/event_participant_confirm_delete.html'
    
    def test_func(self):
        """Vérifie que l'utilisateur est l'organisateur de l'événement ou un administrateur"""
        event = get_object_or_404(Evenement, pk=self.kwargs.get('event_pk'))
        return self.request.user == event.organisateur_nom or self.request.user.is_staff
    
    def get_object(self, queryset=None):
        return get_object_or_404(User, pk=self.kwargs.get('participant_pk'))
    
    def delete(self, request, *args, **kwargs):
        event = get_object_or_404(Evenement, pk=self.kwargs.get('event_pk'))
        user = self.get_object()
        
        if user in event.participants.all():
            event.participants.remove(user)
            messages.success(request, f"{user.get_full_name()} a été retiré des participants avec succès.")
            
            # Envoyer une notification à l'utilisateur retiré
            Notification.objects.create(
                user=user,
                title=f"Retrait de l'événement : {event.titre}",
                message=f"Vous avez été retiré des participants de l'événement '{event.titre}'.",
                content_type=ContentType.objects.get_for_model(Evenement),
                object_id=event.id,
                notification_type='event_participant_removed'
            )
            
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': 'Participant retiré avec succès.'
            })
            
        return redirect('events:event_detail', pk=event.id)


@login_required
def invite_participants(request, event_id):
    """
    Vue pour inviter des participants à un événement
    """
    event = get_object_or_404(Evenement, pk=event_id)
    
    # Vérification des permissions
    if not (request.user.is_staff or request.user == event.organisateur):
        messages.error(request, "Vous n'avez pas la permission d'inviter des participants à cet événement.")
        return redirect('events:event_detail', pk=event_id)
    
    if request.method == 'POST':
        participant_emails = request.POST.get('emails', '').split(',')
        invited_count = 0
        
        for email in participant_emails:
            email = email.strip()
            if not email:
                continue
            
            try:
                user = CustomUser.objects.get(email=email)
                if user not in event.participants.all():
                    event.participants.add(user)
                    # TODO: Envoyer une notification ou un email d'invitation
                    invited_count += 1
            except CustomUser.DoesNotExist:
                # Si l'utilisateur n'existe pas, on pourrait lui envoyer une invitation par email
                # TODO: Implémenter l'envoi d'invitation par email
                pass
        
        if invited_count > 0:
            messages.success(request, f"{invited_count} participants ont été invités avec succès.")
        else:
            messages.info(request, "Aucun nouveau participant n'a été ajouté.")
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': f"{invited_count} participants invités avec succès."
            })
        
        return redirect('events:event_detail', pk=event_id)
    
    # Récupérer les utilisateurs disponibles (ceux qui ne sont pas déjà participants)
    available_users = CustomUser.objects.exclude(id__in=event.participants.all())
    
    context = {
        'event': event,
        'available_users': available_users
    }
    
    return render(request, 'events/invite_participants_modal.html', context)


class ChronogramItemUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    """
    Vue pour modifier un élément existant du chronogramme
    """
    model = ChronogrammeItem
    form_class = ChronogrammeItemForm
    template_name = 'events/chronogram_item_form.html'
    
    def test_func(self):
        """Vérifie que l'utilisateur est l'organisateur de l'événement ou un administrateur"""
        chrono_item = self.get_object()
        return (self.request.user.is_staff or 
                self.request.user == chrono_item.evenement.organisateur)
    
    def get_success_url(self):
        messages.success(self.request, "L'élément du chronogramme a été mis à jour avec succès.")
        return reverse('events:event_detail', kwargs={'pk': self.object.evenement.pk})
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = f"Modifier l'activité - {self.object.titre}"
        context['event'] = self.object.evenement
        return context


class ChronogramItemDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    """
    Vue pour supprimer un élément du chronogramme
    """
    model = ChronogrammeItem
    template_name = 'events/chronogram_item_confirm_delete.html'
    
    def test_func(self):
        """Vérifie que l'utilisateur est l'organisateur de l'événement ou un administrateur"""
        chrono_item = self.get_object()
        return (self.request.user.is_staff or 
                self.request.user == chrono_item.evenement.organisateur)
    
    def get_success_url(self):
        event_pk = self.object.evenement.pk
        messages.success(self.request, "L'élément du chronogramme a été supprimé avec succès.")
        return reverse('events:event_detail', kwargs={'pk': event_pk})
    
    def delete(self, request, *args, **kwargs):
        """Surcharge pour gérer les requêtes AJAX"""
        self.object = self.get_object()
        success_url = self.get_success_url()
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            self.object.delete()
            return JsonResponse({'success': True, 'redirect_url': success_url})
            
        return super().delete(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['event'] = self.get_object().evenement
        return context


def reorder_chronogram_items(request, event_pk):
    """
    Vue pour gérer le réordonnancement des éléments du chronogramme via drag & drop.
    Accepte uniquement les requêtes AJAX POST avec les données JSON :
    {
        "item_id": id_de_l_element,
        "new_index": nouvel_index
    }
    """
    if not request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return JsonResponse({'success': False, 'error': 'Requête invalide'}, status=400)
    
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Méthode non autorisée'}, status=405)
    
    try:
        data = json.loads(request.body)
        item_id = data.get('item_id')
        new_index = int(data.get('new_index'))
        
        if not item_id or new_index is None:
            return JsonResponse({'success': False, 'error': 'Paramètres manquants'}, status=400)
        
        # Récupérer l'élément à déplacer
        item = get_object_or_404(ChronogrammeItem, id=item_id, evenement_id=event_pk)
        
        # Vérifier que l'utilisateur a le droit de modifier cet événement
        if item.evenement.organisateur != request.user and not request.user.is_staff:
            return JsonResponse({'success': False, 'error': 'Permission refusée'}, status=403)
        
        # Récupérer tous les éléments du chronogramme triés par ordre
        items = list(ChronogrammeItem.objects.filter(evenement_id=event_pk).order_by('ordre'))
        
        # Retirer l'élément de sa position actuelle
        items.remove(item)
        
        # Insérer l'élément à sa nouvelle position
        items.insert(new_index, item)
        
        # Mettre à jour l'ordre de tous les éléments
        with transaction.atomic():
            for index, item in enumerate(items):
                ChronogrammeItem.objects.filter(id=item.id).update(ordre=index)
        
        return JsonResponse({'success': True})
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Données JSON invalides'}, status=400)
    except (ValueError, TypeError):
        return JsonResponse({'success': False, 'error': 'Paramètres invalides'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)
