from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from logistque.models import Region, Ville
from django.shortcuts import get_object_or_404
from django.db.models import Count

class RegionViewSet(viewsets.ViewSet):
    """
    API endpoint pour les opérations sur les régions
    """
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        """
        Récupère les détails d'une région spécifique avec ses villes associées
        """
        try:
            # Récupérer la région avec le nombre de villes associées
            region = get_object_or_404(
                Region.objects.annotate(ville_count=Count('ville')), 
                pk=pk
            )
            
            # Récupérer les villes de cette région avec le nombre d'églises
            villes = Ville.objects.filter(region=region).annotate(
                eglise_count=Count('eglise')
            ).values('id', 'nom', 'eglise_count')
            
            # Préparer la réponse
            data = {
                'id': region.id,
                'nom': region.nom,
                'created_at': region.created_at.isoformat() if region.created_at else None,
                'ville_count': region.ville_count,
                'villes': list(villes)
            }
            
            return Response(data)
            
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
