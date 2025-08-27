from django.apps import AppConfig


class EventsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'logistque.events'
    verbose_name = 'Gestion des événements et notifications'
    
    def ready(self):
        # Importer les signaux ici pour éviter les importations circulaires
        from . import signals  # noqa
