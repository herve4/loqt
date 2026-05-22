"""
Permissions personnalisées pour l'API des événements.
"""
from rest_framework import permissions



class IsEventOrganizer(permissions.BasePermission):
    """
    Permission qui vérifie si l'utilisateur est l'organisateur de l'événement
    ou un organisateur de l'église propriétaire de l'événement.
    """
    def has_permission(self, request, view):
        # Les administrateurs ont tous les droits
        if request.user and request.user.is_staff:
            return True
            
        # Pour les actions qui nécessitent un événement spécifique
        if hasattr(view, 'get_queryset') and view.action in ['update', 'partial_update', 'destroy']:
            queryset = view.get_queryset()
            obj = queryset.first()  # Pour les vues détaillées, le queryset contient un seul objet
            if obj:
                return self._is_organizer(request.user, obj)
        
        # Pour les actions de liste ou de création
        return True
    
    def has_object_permission(self, request, view, obj):
        return self._is_organizer(request.user, obj)
    
    def _is_organizer(self, user, obj):
        """Vérifie si l'utilisateur est organisateur de l'événement ou de l'église."""
        if not user.is_authenticated:
            return False
            
        # Vérifier si l'utilisateur est l'organisateur de l'événement
        if hasattr(obj, 'organisateur') and obj.organisateur == user:
            return True
            
        # Vérifier si l'utilisateur est un organisateur de l'église propriétaire
        if hasattr(obj, 'eglise') and obj.eglise and hasattr(obj.eglise, 'organisateurs'):
            return obj.eglise.organisateurs.filter(id=user.id).exists()
            
        # Pour les objets liés à un événement (comme EvenementMateriel ou ChronogrammeItem)
        if hasattr(obj, 'evenement'):
            return self._is_organizer(user, obj.evenement)
            
        return False


# class IsEventParticipant(permissions.BasePermission):
#     """
#     Permission qui vérifie si l'utilisateur est un participant de l'événement.
#     """
#     def has_permission(self, request, view):
#         # Les administrateurs et organisateurs ont tous les droits
#         if request.user and (request.user.is_staff or request.user.is_organizer):
#             return True
            
#         # Pour les actions qui nécessitent un événement spécifique
#         if hasattr(view, 'get_queryset') and view.action in ['retrieve', 'update', 'partial_update']:
#             queryset = view.get_queryset()
#             obj = queryset.first()
#             if obj:
#                 return self._is_participant(request.user, obj)
                
#         return True
    
#     def has_object_permission(self, request, view, obj):
#         # Les administrateurs et organisateurs ont tous les droits
#         if request.user and (request.user.is_staff or request.user.is_organizer):
#             return True
            
#         return self._is_participant(request.user, obj)
    
#     def _is_participant(self, user, obj):
#         """Vérifie si l'utilisateur est un participant de l'événement."""
#         if not user.is_authenticated:
#             return False
            
#         # Pour les objets liés à un événement
#         if hasattr(obj, 'evenement'):
#             event = obj.evenement
#         elif hasattr(obj, 'evenement_id'):
#             event = get_object_or_404(Evenement, id=obj.evenement_id)
#         else:
#             return False
            
#         # Vérifier si l'utilisateur est participant
#         return event.participants.filter(id=user.id).exists() or \
#                event.logisticiens_gestion.filter(id=user.id).exists()


# class IsReservationOwnerOrOrganizer(permissions.BasePermission):
#     """
#     Permission qui vérifie si l'utilisateur est le propriétaire de la réservation
#     ou un organisateur de l'événement.
#     """
#     def has_permission(self, request, view):
#         # Les administrateurs ont tous les droits
#         if request.user and request.user.is_staff:
#             return True
            
#         # Pour les actions qui nécessitent une réservation spécifique
#         if hasattr(view, 'get_queryset') and view.action in ['retrieve', 'update', 'partial_update', 'destroy']:
#             queryset = view.get_queryset()
#             obj = queryset.first()
#             if obj:
#                 return self._has_access(request.user, obj)
                
#         return True
    
#     def has_object_permission(self, request, view, obj):
#         return self._has_access(request.user, obj)
    
#     def _has_access(self, user, obj):
#         """Vérifie si l'utilisateur a accès à la réservation."""
#         if not user.is_authenticated:
#             return False
            
#         # L'utilisateur est le propriétaire de la réservation
#         if hasattr(obj, 'demandeur') and obj.demandeur == user:
#             return True
            
#         # L'utilisateur est un organisateur de l'événement
#         if hasattr(obj, 'evenement'):
#             event = obj.evenement
#             return event.organisateur == user or event.logisticiens_gestion.filter(id=user.id).exists()
            
#         return False


# class CanManageChronogramme(permissions.BasePermission):
#     """
#     Permission qui vérifie si l'utilisateur peut gérer le chronogramme d'un événement.
#     """
#     def has_permission(self, request, view):
#         # Les administrateurs ont tous les droits
#         if request.user and request.user.is_staff:
#             return True
            
#         # Pour les actions qui nécessitent un événement spécifique
#         if 'event_pk' in view.kwargs:
#             event = get_object_or_404(Evenement, id=view.kwargs['event_pk'])
#             return self._can_manage_chronogramme(request.user, event)
            
#         return True
    
#     def has_object_permission(self, request, view, obj):
#         # Pour les objets ChronogrammeItem
#         if hasattr(obj, 'evenement'):
#             return self._can_manage_chronogramme(request.user, obj.evenement)
            
#         # Pour les objets Evenement
#         if isinstance(obj, Evenement):
#             return self._can_manage_chronogramme(request.user, obj)
            
#         return False
    
#     def _can_manage_chronogramme(self, user, event):
#         """Vérifie si l'utilisateur peut gérer le chronogramme de l'événement."""
#         if not user.is_authenticated:
#             return False
            
#         # L'utilisateur est l'organisateur ou un gestionnaire de l'événement
#         return event.organisateur == user or event.logisticiens_gestion.filter(id=user.id).exists()
