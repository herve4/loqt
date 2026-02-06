from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from logistque.models import Region, Ville
from django.shortcuts import get_object_or_404
from django.db.models import Count
from django.http import JsonResponse
from django.db import models
import logging

logger = logging.getLogger(__name__)

class RegionViewSet(viewsets.ViewSet):
    """
    API endpoint pour les opérations sur les régions
    """
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Exporte la liste des régions
        """
        try:
            logger.info("Début de l'export des régions")
            
            # Récupérer toutes les régions triées par ID
            regions = Region.objects.all().order_by('id')
            
            # Préparer les données pour l'export
            data = []
            for region in regions:
                data.append({
                    'id': region.id,
                    'nom': region.nom,
                    'date_creation': region.created_at.strftime('%Y-%m-%d %H:%M:%S') if region.created_at else None,
                })
            
            logger.info(f"Export de {len(data)} régions réussi")
            return Response({
                'success': True,
                'data': data,
                'headers': ['ID', 'Nom', 'Date de création']
            })
            
        except Exception as e:
            logger.error(f"Erreur lors de l'export des régions: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Une erreur est survenue lors de l\'export des données'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def list(self, request):
        """
        Liste toutes les régions avec des statistiques de base
        """
        try:
            regions = Region.objects.annotate(
                ville_count=Count('ville', distinct=True),
                eglise_count=Count('ville__eglise', distinct=True)
            ).order_by('nom')
            
            data = [{
                'id': region.id,
                'nom': region.nom,
                'ville_count': region.ville_count,
                'eglise_count': region.eglise_count,
                'created_at': region.created_at.isoformat() if region.created_at else None,
            } for region in regions]
            
            return Response({
                'success': True,
                'count': len(data),
                'results': data
            })
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération de la liste des régions: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Une erreur est survenue lors de la récupération des régions'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
