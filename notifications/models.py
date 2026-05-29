from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPES = (
        ('retard',    'Matériel en retard'),
        ('evenement', 'Événement / Réunion'),
        ('mouvement', 'Mouvement de matériel'),
        ('systeme',   'Système'),
        ('membre',    'Membre / Utilisateur'),
    )

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name='Destinataire',
    )
    type = models.CharField(max_length=20, choices=TYPES, default='systeme')
    title = models.CharField(max_length=200)
    message = models.TextField()
    link = models.CharField(max_length=200, blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'

    def __str__(self):
        return f'[{self.type}] {self.title} → {self.recipient}'
