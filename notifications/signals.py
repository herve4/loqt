"""
Django signals that auto-create Notification records when business events occur.
Add more signal handlers here as the application grows.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import CustomUser


def _notify_admins(title, message, notif_type, link=''):
    """Send a notification to all super_admin users."""
    # Import inside function to avoid circular-import issues at module load time
    from notifications.models import Notification
    admins = CustomUser.objects.filter(role='super_admin', is_active=True)
    Notification.objects.bulk_create([
        Notification(
            recipient=admin,
            type=notif_type,
            title=title,
            message=message,
            link=link,
        )
        for admin in admins
    ])


def notify_user(user, title, message, notif_type='systeme', link=''):
    """Send a notification to a specific user. Call this from views/tasks."""
    from notifications.models import Notification
    Notification.objects.create(
        recipient=user,
        type=notif_type,
        title=title,
        message=message,
        link=link,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Signal: New member registered → notify super admins
# ─────────────────────────────────────────────────────────────────────────────
@receiver(post_save, sender=CustomUser)
def on_member_created(sender, instance, created, **kwargs):
    if created:
        _notify_admins(
            title='Nouveau membre enregistré',
            message=f'{instance.first_name} {instance.last_name} vient d\'être ajouté à la plateforme avec le rôle « {instance.get_role_display() if hasattr(instance, "get_role_display") else instance.role} ».',
            notif_type='membre',
            link='/settings',
        )


# ─────────────────────────────────────────────────────────────────────────────
# Signal: Logistique events — imported lazily to avoid circular imports
# ─────────────────────────────────────────────────────────────────────────────
def connect_logistique_signals():
    """
    Connect logistique-app signals. Called from logistque/apps.py ready()
    or kept here and imported lazily.
    """
    try:
        from logistque.models import MouvementMateriel, Evenement

        @receiver(post_save, sender=MouvementMateriel)
        def on_movement_created(sender, instance, created, **kwargs):
            if created:
                _notify_admins(
                    title='Nouveau mouvement de matériel',
                    message=f'Un flux de matériel a été enregistré : {instance}.',
                    notif_type='mouvement',
                    link='/movements',
                )

        @receiver(post_save, sender=Evenement)
        def on_event_created(sender, instance, created, **kwargs):
            if created:
                _notify_admins(
                    title='Nouvel événement planifié',
                    message=f'L\'événement « {instance.nom if hasattr(instance, "nom") else instance} » vient d\'être créé.',
                    notif_type='evenement',
                    link='/events',
                )
    except Exception:
        # Logistique models may not be ready yet — signals will be wired on next ready()
        pass


connect_logistique_signals()
