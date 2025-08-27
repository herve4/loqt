"""
API endpoints pour la gestion des événements.
"""
from rest_framework import viewsets, status, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.parsers import MultiPartParser, JSONParser
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from logistque.models import Evenement, EvenementMateriel, ReservationMateriel, ChronogrammeItem
from logistque.events.serializers import (
    EvenementSerializer, 
    EvenementDetailSerializer,
    EvenementMaterielSerializer,
    ReservationMaterielSerializer,
    ChronogrammeItemSerializer
)
# Les services de notification ont été supprimés
from .permissions import IsEventOrganizer

User = get_user_model()

class EvenementViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les événements.
    """
    queryset = Evenement.objects.all()
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return EvenementDetailSerializer
        return EvenementSerializer
    
    def get_queryset(self):
        """Filtre les événements en fonction des permissions de l'utilisateur."""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Pour les administrateurs, retourner tous les événements
        if user.is_staff:
            return queryset
        
        if user.is_superuser:  
            # Pour les utilisateurs normaux, retourner les événements où ils sont organisateurs ou participants
            return queryset.filter(
                Q(organisateur=user) | 
                Q(logisticiens_gestion=user) |
                Q(participants=user)
                ).distinct()
    
    def perform_create(self, serializer):
        """Crée un nouvel événement via le service d'événements."""
        with transaction.atomic():
            event = serializer.save(organisateur=self.request.user)
            # Notifier les utilisateurs concernés
            event_service.notify(
                EventType.EVENT_CREATED,
                {
                    "event_id": event.id,
                    "title": event.titre,
                    "start_date": event.date_debut,
                    "organizer": self.request.user.get_full_name()
                },
                user=self.request.user
            )
    
    def perform_update(self, serializer):
        """Met à jour un événement via le service d'événements."""
        old_event = self.get_object()
        with transaction.atomic():
            event = serializer.save()
            # Notifier les utilisateurs concernés
            event_service.notify(
                EventType.EVENT_UPDATED,
                {
                    "event_id": event.id,
                    "title": event.titre,
                    "changes": self._get_changes(old_event, event)
                },
                user=self.request.user
            )
    
    def _get_changes(self, old_event, new_event):
        """Identifie les changements entre deux versions d'un événement."""
        changes = {}
        for field in ['titre', 'date_debut', 'date_fin', 'description']:
            old_value = getattr(old_event, field, None)
            new_value = getattr(new_event, field, None)
            if old_value != new_value:
                changes[field] = {"old": old_value, "new": new_value}
        return changes
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_material(self, request, pk=None):
        """Ajoute un matériel à l'événement."""
        event = self.get_object()
        serializer = EvenementMaterielSerializer(
            data=request.data, 
            context={'request': request, 'event': event}
        )
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    event_material = event_service.add_material_to_event(
                        event_id=event.id,
                        material_id=serializer.validated_data['materiel'].id,
                        quantity=serializer.validated_data['quantite'],
                        user=request.user
                    )
                return Response(
                    EvenementMaterielSerializer(event_material).data,
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                return Response(
                    {"error": str(e)}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_participant(self, request, pk=None):
        """Ajoute un participant à l'événement."""
        event = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {"user_id": ["Ce champ est obligatoire."]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            event.participants.add(user)
            
            # Notifier l'utilisateur ajouté
            notification_service.send_notification(
                recipient=user,
                subject=f"Vous avez été ajouté à l'événement: {event.titre}",
                template_name="emails/event_participant_added.html",
                context={
                    "event": event,
                    "added_by": request.user,
                    "recipient": user
                }
            )
            
            return Response(
                {"status": "Participant ajouté avec succès"},
                status=status.HTTP_200_OK
            )
        except User.DoesNotExist:
            return Response(
                {"user_id": ["Utilisateur introuvable."]},
                status=status.HTTP_404_NOT_FOUND
            )


class EvenementMaterielViewSet(
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet
):
    """
    API endpoint pour gérer les matériels d'un événement.
    """
    serializer_class = EvenementMaterielSerializer
    permission_classes = [IsAuthenticated, IsEventOrganizer]
    
    def get_queryset(self):
        """Filtre les matériels par événement."""
        event_id = self.kwargs.get('event_pk')
        return EvenementMateriel.objects.filter(evenement_id=event_id)
    
    def perform_destroy(self, instance):
        """Supprime un matériel d'un événement."""
        with transaction.atomic():
            event = instance.evenement
            material = instance.materiel
            instance.delete()
            
            # Notifier les utilisateurs concernés
            event_service.notify(
                EventType.MATERIAL_REMOVED,
                {
                    "event_id": event.id,
                    "event_title": event.titre,
                    "material_id": material.id,
                    "material_name": material.nom,
                    "removed_by": self.request.user.get_full_name()
                },
                user=self.request.user
            )


class ChronogrammeItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les éléments du chronogramme d'un événement.
    """
    serializer_class = ChronogrammeItemSerializer
    permission_classes = [IsAuthenticated, IsEventOrganizer]
    
    def get_queryset(self):
        """Filtre les éléments du chronogramme par événement."""
        event_id = self.kwargs.get('event_pk')
        return ChronogrammeItem.objects.filter(evenement_id=event_id)
    
    def perform_create(self, serializer):
        """Crée un nouvel élément de chronogramme."""
        event = get_object_or_404(Evenement, id=self.kwargs.get('event_pk'))
        serializer.save(evenement=event)
    
    def perform_update(self, serializer):
        """Met à jour un élément de chronogramme."""
        event = get_object_or_404(Evenement, id=self.kwargs.get('event_pk'))
        serializer.save(evenement=event)


class ReservationMaterielViewSet(viewsets.ModelViewSet):
    """
    API endpoint pour gérer les réservations de matériel.
    """
    serializer_class = ReservationMaterielSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtre les réservations en fonction des permissions."""
        user = self.request.user
        queryset = ReservationMateriel.objects.all()
        
        # Pour les administrateurs, retourner toutes les réservations
        if user.is_staff:
            return queryset
            
        # Pour les organisateurs, retourner les réservations de leurs événements
        if hasattr(user, 'organized_events'):
            event_ids = user.organized_events.values_list('id', flat=True)
            queryset = queryset.filter(evenement_id__in=event_ids)
            
        # Pour les utilisateurs normaux, retourner leurs propres réservations
        return queryset.filter(demandeur=user)
    
    def perform_create(self, serializer):
        """Crée une nouvelle réservation."""
        with transaction.atomic():
            reservation = serializer.save(demandeur=self.request.user)
            
            # Notifier les organisateurs de l'événement
            event = reservation.evenement
            for organizer in event.organizers.all():
                notification_service.send_notification(
                    recipient=organizer,
                    subject=f"Nouvelle réservation pour {reservation.materiel.nom}",
                    template_name="emails/reservation_created.html",
                    context={
                        "reservation": reservation,
                        "event": event,
                        "recipient": organizer
                    }
                )
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser | IsEventOrganizer])
    def approve(self, request, pk=None):
        """Approuve une réservation."""
        reservation = self.get_object()
        reservation.statut = 'approuve'
        reservation.approuve_par = request.user
        reservation.date_approbation = timezone.now()
        reservation.save()
        
        # Notifier le demandeur
        notification_service.send_notification(
            recipient=reservation.demandeur,
            subject=f"Votre réservation a été approuvée",
            template_name="emails/reservation_approved.html",
            context={
                "reservation": reservation,
                "approved_by": request.user
            }
        )
        
        return Response({"status": "Réservation approuvée avec succès"})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser | IsEventOrganizer])
    def reject(self, request, pk=None):
        """Rejette une réservation."""
        reservation = self.get_object()
        reservation.statut = 'rejete'
        reservation.motif_rejet = request.data.get('motif_rejet', 'Raison non spécifiée')
        reservation.save()
        
        # Notifier le demandeur
        notification_service.send_notification(
            recipient=reservation.demandeur,
            subject=f"Votre réservation a été rejetée",
            template_name="emails/reservation_rejected.html",
            context={
                "reservation": reservation,
                "rejected_by": request.user,
                "rejection_reason": reservation.motif_rejet
            }
        )
        
        return Response({"status": "Réservation rejetée avec succès"})