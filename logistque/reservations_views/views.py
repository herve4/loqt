import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.views.generic import TemplateView
from django.shortcuts import get_object_or_404, render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required, permission_required
from django.utils.decorators import method_decorator
from django.template.loader import render_to_string
from django.views.decorators.http import require_GET, require_POST, require_http_methods
from django.utils import timezone
from django.db.models import Func, Value, JSONField
from django.db.models.functions import JSONObject as JSONAgg
from django.forms.models import model_to_dict
from django.urls import reverse
from requests import Response
from logistque.models import *
from logistque.serializers import EvenementSerializer
from django.contrib import messages
from django.shortcuts import redirect


from datetime import datetime

def parse_datetime_with_tz(dt_str):
    if not dt_str:
        return None
    # Gère les formats 'YYYY-MM-DDTHH:MM' ou 'YYYY-MM-DD HH:MM'
    try:
        if 'T' in dt_str:
            naive = datetime.strptime(dt_str, '%Y-%m-%dT%H:%M')
        else:
            naive = datetime.strptime(dt_str, '%Y-%m-%d %H:%M')
        return timezone.make_aware(naive)
    except Exception:
        return None

class EvenementCalendarView(TemplateView):
    template_name = 'events/events.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['types_evenement'] = Evenement.TYPE_EVENEMENT
        context['types_organisateur'] = Evenement.TYPE_ORGANISATEUR
        context['eglises'] = Eglise.objects.all()
        events = Evenement.objects.all().values(
            'id', 'titre', 'type_evenement', 
            'date_debut', 'date_fin', 'eglise__nom',
            'organisateur_type', 'organisateur_nom',
            'description'
        )
        # Conversion des dates en string
        events_list = []
        for e in events:
            e = dict(e)
            if isinstance(e['date_debut'], datetime):
                e['date_debut'] = e['date_debut'].strftime('%d/%m/%Y %H:%M') if e['date_debut'] else ''
            if isinstance(e['date_fin'], datetime):
                e['date_fin'] = e['date_fin'].strftime('%d/%m/%Y %H:%M') if e['date_fin'] else ''
            events_list.append(e)
        context['events'] = events_list
        context['events_json'] = json.dumps(events_list)
        return context

def events_json_calendar(request):
    try:
        events = []
        
        # Récupérer tous les événements avec leurs relations
        evenements = Evenement.objects.select_related('eglise').prefetch_related(
            'chronogramme_evenement'
        ).all()
        
        for e in evenements:
            # Gestion du chronogramme
            chrono_items = e.chronogramme_evenement.all().order_by('heure_debut')
            chrono_resume = ""
            chrono_full = []
            
            for item in chrono_items:
                heure_debut = item.heure_debut.strftime('%H:%M') if item.heure_debut else ""
                heure_fin = item.heure_fin.strftime('%H:%M') if item.heure_fin else ""
                titre = item.titre or ""
                chrono_full.append(f"{heure_debut} - {heure_fin} : {titre}")
            
            if chrono_items.exists():
                first = chrono_items[0]
                heure_debut = first.heure_debut.strftime('%H:%M') if first.heure_debut else ""
                chrono_resume = f"{heure_debut} - {first.titre or ''}"
            
            # Construction de l'objet événement
            event_data = {
                "id": str(e.id),  # Convertir en chaîne pour éviter les problèmes de sérialisation
                "title": e.titre or "",
                "start": e.date_debut.isoformat() if e.date_debut else None,
                "end": e.date_fin.isoformat() if e.date_fin else None,
                "chrono_resume": chrono_resume,
                "chrono_full": "\n".join(chrono_full),
                "allDay": False,
                "extendedProps": {
                    "type": e.type_evenement or "",
                    "organisateur_type": e.organisateur_type or "",
                    "organisateur_nom": e.organisateur_nom or (e.eglise.nom if e.eglise else ""),
                    "description": e.description or ""
                }
            }
            
            # N'ajouter l'événement que si la date de début est valide
            if e.date_debut:
                events.append(event_data)
        
        # Retourner la réponse JSON
        return JsonResponse(events, safe=False, json_dumps_params={'ensure_ascii': False})
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Erreur dans events_json_calendar: {str(e)}", exc_info=True)
        return JsonResponse(
            {"error": "Une erreur est survenue lors du chargement des événements"},
            status=500
        )
    
@require_GET
def event_calendar_api(req):
    events = Evenement.objects.all().values(
        'id', 'titre', 'type_evenement', 
        'date_debut', 'date_fin', 'eglise__nom',
        'organisateur_type', 'organisateur_nom',
        'description'
    )
    return JsonResponse(list(events), safe=False)

class EvenementAPI(APIView):
    def get(self, request):
        events = Evenement.objects.all().prefetch_related('reservations', 'programme')
        serializer = EvenementSerializer(events, many=True)
        return Response(serializer.data)
        
    @method_decorator(login_required)
    def post(self, request):
        """Crée un nouvel événement ou duplique un événement existant"""
        if request.data.get('duplicate_from'):
            # Logique de duplication d'événement
            try:
                original_event = Evenement.objects.get(pk=request.data['duplicate_from'])
                
                # Créer une copie de l'événement
                new_event = Evenement.objects.create(
                    titre=f"{original_event.titre} (Copie)",
                    type_evenement=original_event.type_evenement,
                    date_debut=request.data.get('date_debut') or original_event.date_debut,
                    date_fin=request.data.get('date_fin') or original_event.date_fin,
                    description=original_event.description,
                    organisateur_type=original_event.organisateur_type,
                    organisateur_nom=original_event.organisateur_nom,
                    eglise=original_event.eglise,
                    created_by=request.user
                )
                
                # Dupliquer le programme (chronogramme)
                for item in original_event.programme.all():
                    ChronogrammeItem.objects.create(
                        evenement=new_event,
                        titre=item.titre,
                        description=item.description,
                        heure_debut=item.heure_debut,
                        heure_fin=item.heure_fin,
                        responsable=item.responsable
                    )
                
                # Dupliquer les réservations de matériel
                for reservation in original_event.reservations.all():
                    ReservationMateriel.objects.create(
                        evenement=new_event,
                        materiel=reservation.materiel,
                        quantite=reservation.quantite,
                        provenance=reservation.provenance,
                        statut='demande',  # Réinitialiser le statut pour la copie
                        created_by=request.user
                    )
                
                serializer = EvenementSerializer(new_event)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
                
            except Evenement.DoesNotExist:
                return Response(
                    {'error': 'Événement à dupliquer non trouvé'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Logique de création d'un nouvel événement standard
            serializer = EvenementSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EvenementDetailAPI(APIView):
    def get(self, request, pk):
        try:
            event = Evenement.objects.get(pk=pk)
            programme = ChronogrammeItem.objects.filter(evenement=event).order_by('heure_debut')
            
            data = {
                'evenement': {
                    'id': event.id,
                    'titre': event.titre,
                    'type': event.get_type_evenement_display(),
                    'organisateur': f"{event.get_organisateur_type_display()} - {event.organisateur_nom}",
                    'dates': f"{event.date_debut.strftime('%d/%m/%Y %H:%M')} - {event.date_fin.strftime('%d/%m/%Y %H:%M')}",
                    'description': event.description
                },
                'programme': [{
                    'heure': f"{item.heure_debut.strftime('%H:%M')} - {item.heure_fin.strftime('%H:%M')}",
                    'titre': item.titre,
                    'responsable': item.responsable
                } for item in programme],
                'materiels': [{
                    'nom': res.materiel.nom,
                    'quantite': res.quantite,
                    'statut': res.get_statut_display(),
                    'provenance': res.provenance_nom
                } for res in event.reservations.all()]
            }
            return Response(data)
        except Evenement.DoesNotExist:
            return Response({'error': 'Événement non trouvé'}, status=status.HTTP_404_NOT_FOUND)

class CreateReservationAPI(APIView):
    def post(self, request):
        try:
            data = json.loads(request.body)
            event = Evenement.objects.get(pk=data['event_id'])
            
            for materiel in data['materiels']:
                ReservationMateriel.objects.create(
                    evenement=event,
                    materiel_id=materiel['id'],
                    quantite=materiel['quantite'],
                    provenance_id=materiel.get('provenance_id')
                )
            
            return Response({'status': 'success'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        


@login_required
@permission_required('logistique.change_reservationmateriel', raise_exception=True)
def validate_reservation(request, pk, status):
    reservation = get_object_or_404(ReservationMateriel, pk=pk)
    
    if status not in ['valide', 'refuse']:
        return JsonResponse({'success': False, 'error': 'Statut invalide'}, status=400)
    
    if reservation.statut != 'demande':
        return JsonResponse({'success': False, 'error': 'Réservation déjà traitée'}, status=400)
    
    reservation.statut = status
    reservation.date_validation = timezone.now()
    reservation.validateur = request.user
    reservation.save()
    
    # Mise à jour du stock si validation
    if status == 'valide' and reservation.provenance:
        materiel = reservation.materiel
        materiel.quantite -= reservation.quantite
        materiel.save()
    
    return JsonResponse({
        'success': True,
        'new_status': reservation.get_statut_display(),
        'status_class': 'success' if status == 'valide' else 'danger'
    })
    

from django.shortcuts import render
from django.contrib.auth.decorators import login_required

@login_required
def event_create_form(request):
    """
    Affiche le formulaire de création d'événement
    """
    try:
        start = request.GET.get('start')
        end = request.GET.get('end')
        
        context = {
            'eglises': Eglise.objects.all(),
            'types_evenement': Evenement.TYPE_EVENEMENT,
            'start': start,
            'end': end,
            'materiels': Materiel.objects.filter(is_deleted=False),
            'logisticiens': User.objects.filter(groups__name='Logisticiens', is_active=True),
            'title': 'Créer un nouvel événement',
        }
        
        return render(request, 'events/event_form.html', context)
        
    except Exception as e:
        # En cas d'erreur, rediriger vers la page du calendrier avec un message d'erreur
        messages.error(request, f"Une erreur est survenue : {str(e)}")
        return redirect('events')

@require_GET
def reservation_form(request, event_id):
    try:
        event = get_object_or_404(Evenement, pk=event_id)
        materiels = Materiel.objects.filter(quantite__gt=0).annotate(
            disponibilite=JSONAgg(
                Func(
                    Value('id'), 'eglise__id',
                    Value('nom'), 'eglise__nom',
                    Value('quantite'), 'quantite',
                    function='json_build_object',
                    output_field=JSONField()
                )
            )
        )
        
        html = render_to_string('events/partiel/_reservation_form.html', {
            'event': event,
            'materiels': materiels
        }, request=request)
        
        return JsonResponse({'html': html})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

from django.db.models import Prefetch

def reservation_details(request, pk):
    try:
        reservation = get_object_or_404(
            ReservationMateriel.objects.select_related(
                'evenement', 'materiel', 'provenance'
            ).prefetch_related(
                Prefetch('materiel__images', queryset=MaterielImage.objects.all())
            ), 
            pk=pk
        )
        
        html = render_to_string('events/partiel/_reservation_details.html', {
            'reservation': reservation
        }, request=request)
        
        return JsonResponse({'html': html})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

@require_POST
def create_event(request):
    try:
        data = request.POST
        # Validation des dates
        date_debut = parse_datetime_with_tz(data.get('date_debut'))
        date_fin = parse_datetime_with_tz(data.get('date_fin'))
        
        if date_debut >= date_fin:
            return JsonResponse({'success': False, 'error': 'La date de fin doit être après la date de début'}, status=400)

        # Création de l'événement
        event = Evenement.objects.create(
            titre=data.get('titre'),
            type_evenement=data.get('type_evenement'),
            organisateur_type=data.get('organisateur_type'),
            organisateur_nom=data.get('organisateur_nom'),
            eglise_id=data.get('eglise') if data.get('organisateur_type') == 'eglise' else None,
            date_debut=date_debut,
            date_fin=date_fin,
            description=data.get('description', ''),
            created_by=request.user
        )

        # Gestion des matériels (utilisation du ManyToManyField materiels_utilises)
        handle_materiels(request, event)
        
        # Gestion des logisticiens (utilisation du ManyToManyField logisticiens_gestion)
        handle_logisticiens(request, event)
        
        # Création du chronogramme
        create_chronogramme(request, event)

        return JsonResponse({
            'success': True,
            'event': prepare_event_response(event),
            'redirect': reverse('events')
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

def handle_materiels(request, event):
    materiel_ids = request.POST.getlist('materiels')
    quantites = {}
    
    # Récupération des quantités pour chaque matériel
    for mat_id in materiel_ids:
        try:
            quantite = int(request.POST.get(f'quantite_{mat_id}', 1))
            quantites[mat_id] = quantite
        except ValueError:
            continue
    
    # Ajout des matériels à l'événement avec leur quantité via le champ through
    for mat_id, quantite in quantites.items():
        materiel = Materiel.objects.get(id=mat_id)
        event.materiels_utilises.add(materiel, through_defaults={'quantite': quantite})

def handle_logisticiens(request, event):
    logisticien_ids = request.POST.getlist('logisticiens')
    event.logisticiens_gestion.add(*logisticien_ids)

def create_chronogramme(request, event):
    chrono_items = []
    programme_titres = request.POST.getlist('programme-titre')
    
    for i in range(len(programme_titres)):
        chrono_items.append(ChronogrammeItem(
            evenement=event,
            heure_debut=request.POST.getlist('programme-heure_debut')[i],
            heure_fin=request.POST.getlist('programme-heure_fin')[i],
            titre=programme_titres[i],
            description=request.POST.getlist('programme-description')[i],
            responsable=request.POST.getlist('programme-responsable')[i]
        ))
    
    ChronogrammeItem.objects.bulk_create(chrono_items)

def prepare_event_response(event):
    event_dict = model_to_dict(event, exclude=['image'])
    # Conversion des champs datetime
    for field in ['date_debut', 'date_fin']:
        if getattr(event, field):
            event_dict[field] = getattr(event, field).isoformat()
    
    # Ajout des informations supplémentaires
    event_dict.update({
        'materiels': list(event.materiels_utilises.values('id', 'nom', 'quantite')),
        'logisticiens': list(event.logisticiens_gestion.values('id', 'username', 'first_name', 'last_name')),
        'image_url': event.image.url if event.image else None
    })
    
    return event_dict


def event_detail(request, pk):
    event = get_object_or_404(Evenement.objects.prefetch_related(
        'programme',
        Prefetch('reservations', queryset=ReservationMateriel.objects.select_related('materiel', 'provenance'))
    ), pk=pk)
    
    # Formatage des données pour FullCalendar
    event_data = {
        'id': event.id,
        'title': event.titre,
        'start': event.date_debut.isoformat(),
        'end': event.date_fin.isoformat(),
        'className': f'event-{event.type_evenement}',
        'extendedProps': {
            'type': event.get_type_evenement_display(),
            'organisateur': event.organisateur_nom,
            'description': event.description
        }
    }
    
    context = {
        'event': event,
        'event_json': json.dumps(event_data),
        'reservations': event.reservations_materiel.all(),
        'programme': event.chronogramme_evenement.all().order_by('heure_debut')
    }
    
    return render(request, 'events/partiel/event_details.html', context)


def evenement_detail_api(request, event_id):
    # Optimisation des requêtes avec select_related et prefetch_related
    event = get_object_or_404(
        Evenement.objects.select_related('eglise')
                        .prefetch_related(
                            'materiels_utilises',
                            Prefetch('chronogramme_evenement', 
                                    queryset=ChronogrammeItem.objects.order_by('heure_debut'))
                        .prefetch_related('logisticiens_gestion'),
        pk=event_id
    ))
    
    # Préparation des données des matériels (via le ManyToManyField)
    materiels_list = [
        {
            "nom": mat.nom,
            "quantite": mat.evenementmateriel_set.get(evenement=event).quantite,
            "disponible": mat.quantite  # Si vous voulez inclure la quantité totale disponible
        }
        for mat in event.materiels_utilises.all()
    ]
    
    # Préparation du programme
    programme_list = [
        {
            "heure_debut": item.heure_debut.strftime("%H:%M") if item.heure_debut else "",
            "heure_fin": item.heure_fin.strftime("%H:%M") if item.heure_fin else "",
            "titre": item.titre,
            "responsable": item.responsable,
            "description": item.description,
        }
        for item in event.chronogramme_evenement.all()
    ]
    
    # Gestion de l'organisateur
    if event.organisateur_type == "eglise" and event.eglise:
        organisateur = event.eglise.nom
    else:
        organisateur = event.organisateur_nom or ""
    
    # Formatage des dates
    dates = ""
    if event.date_debut and event.date_fin:
        dates = (
            f"{event.date_debut.strftime('%d/%m/%Y %H:%M')} - "
            f"{event.date_fin.strftime('%d/%m/%Y %H:%M')}"
        )
    
    # Libellé du type d'événement
    type_label = dict(Evenement.TYPE_EVENEMENT).get(event.type_evenement, event.type_evenement)
    
    # Liste des logisticiens
    logisticiens_list = [
        {
            "id": log.id,
            "nom": log.get_full_name() or log.username,
            "email": log.email
        }
        for log in event.logisticiens_gestion.all()
    ]
    
    return JsonResponse({
        "titre": event.titre,
        "type_evenement": event.type_evenement,
        "type": type_label,
        "dates": dates,
        "organisateur": organisateur,
        "description": event.description,
        "programme": programme_list,
        "materiels": materiels_list,
        "logisticiens": logisticiens_list,
        "image_url": event.image.url if event.image else None
    })
    

@require_http_methods(["GET", "POST"])
def event_edit(request, pk):
    event = get_object_or_404(Evenement, pk=pk)
    if request.method == "POST":
        data = request.POST
        event.titre = data.get('titre')
        event.type_evenement = data.get('type_evenement')
        event.organisateur_type = data.get('organisateur_type')
        event.organisateur_nom = data.get('organisateur_nom')
        event.eglise_id = data.get('eglise') if data.get('organisateur_type') == 'eglise' else None
        event.date_debut = parse_datetime_with_tz(data.get('date_debut'))
        event.date_fin = parse_datetime_with_tz(data.get('date_fin'))
        event.description = data.get('description', '')
        event.save()
        # Chronogramme : on supprime et on recrée (simple et sûr)
        ChronogrammeItem.objects.filter(evenement=event).delete()
        chrono_items = []
        for i in range(len(request.POST.getlist('programme-titre'))):
            chrono_items.append(ChronogrammeItem(
                evenement=event,
                heure_debut=request.POST.getlist('programme-heure_debut')[i],
                heure_fin=request.POST.getlist('programme-heure_fin')[i],
                titre=request.POST.getlist('programme-titre')[i],
                description=request.POST.getlist('programme-description')[i],
                responsable=request.POST.getlist('programme-responsable')[i]
            ))
        ChronogrammeItem.objects.bulk_create(chrono_items)
        return JsonResponse({'success': True})
    else:
        eglises = Eglise.objects.all()
        chrono = ChronogrammeItem.objects.filter(evenement=event).order_by('heure_debut')
        return render(request, 'events/partiel/event_edit_form.html', {
            'event': event,
            'eglises': eglises,
            'types_evenement': Evenement.TYPE_EVENEMENT,
            'chrono': chrono,
        })