from rest_framework import viewsets
from logistque.models import Region, Ville, Eglise
from api.serializers.common import RegionSerializer, VilleSerializer, EgliseSerializer

class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Region.objects.all()
    serializer_class = RegionSerializer

class VilleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ville.objects.all()
    serializer_class = VilleSerializer

class EgliseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Eglise.objects.all()
    serializer_class = EgliseSerializer
