"""
Signaux pour la gestion des événements.
Ce fichier est actuellement vide mais peut être utilisé pour ajouter des signaux liés aux événements.
"""
# Exemple de structure pour un signal :
# from django.db.models.signals import post_save
# from django.dispatch import receiver
# from .models import Evenement
# 
# @receiver(post_save, sender=Evenement)
# def after_event_save(sender, instance, created, **kwargs):
#     """Exemple de signal après sauvegarde d'un événement"""
#     pass


# # Signal pour la mise à jour des préférences de notification
# @receiver(m2m_changed, sender=User.groups.through)
# def update_user_notification_preferences(sender, instance, action, reverse, model, pk_set, **kwargs):
#     """Met à jour les préférences de notification lorsqu'un utilisateur est ajouté ou retiré d'un groupe"""
#     if action in ['post_add', 'post_remove'] and not SIGNALS_DISABLED:
#         # Mettre à jour les préférences en fonction des groupes
#         if hasattr(instance, 'update_notification_preferences'):
#             instance.update_notification_preferences()


# # Configuration des signaux
# # Note: Les signaux sont automatiquement connectés grâce au décorateur @receiver
