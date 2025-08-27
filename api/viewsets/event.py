from rest_framework import viewsets
from apps.core.models.event import Evenement
from api.serializers.event import EventSerializer

class EventViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EventSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filtrage personnalisé ici
        return queryset