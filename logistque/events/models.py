# """
# Modèles pour la gestion des événements et des notifications.
# """
# from django.db import models
# from django.contrib.auth import get_user_model
# from django.utils import timezone
# from django.utils.translation import gettext_lazy as _
# from django.conf import settings
# from typing import List, Tuple

# User = get_user_model()

# # Constante pour les types de notification utilisés dans les préférences
# NOTIFICATION_TYPES: List[Tuple[str, str]] = [
#     ('event_created', _('Événement créé')),
#     ('event_updated', _('Événement mis à jour')),
#     ('event_reminder', _('Rappel d\'événement')),
#     ('material_added', _('Matériel ajouté')),
#     ('material_removed', _('Matériel retiré')),
#     ('reservation_created', _('Réservation créée')),
#     ('reservation_updated', _('Réservation mise à jour')),
#     ('reservation_cancelled', _('Réservation annulée')),
#     ('system', _('Système')),
#     ('other', _('Autre')),
# ]

# # Les modèles de notification ont été supprimés car ils ne sont plus utilisés
# # et causaient des erreurs d'importation circulaires
