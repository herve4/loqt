from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Sum
from datetime import datetime, timedelta
from .models import Materiel, Eglise, Evenement, CampMondial, MembreLogistique, Region, Ville
from django.contrib.auth import get_user_model

User = get_user_model()

class DashboardStatsAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        stats = {
            'eglises_count': Eglise.objects.count(),
            'evenements_count': Evenement.objects.count(),
            'materiels_count': Materiel.objects.count(),
            'membres_count': MembreLogistique.objects.count(),
            'camp_count': CampMondial.objects.count(),
            'nb_regions': Region.objects.count(),
            'nb_villes': Ville.objects.count(),
            'nb_responsables_logistique': User.objects.filter(role__in=['rln', 'rll']).count(),
            'nb_pasteurs': User.objects.filter(role__in=['pasteur_national', 'pasteur_local', 'pasteur']).count() if hasattr(User.objects, 'filter') else 0,
        }
        
        # Statistiques de santé du matériel
        stats['operational_count'] = Materiel.objects.filter(etat='OP').count()
        stats['repair_count'] = Materiel.objects.filter(etat='RE').count()
        stats['broken_count'] = Materiel.objects.filter(etat='PA').count()
        stats['pending_repairs_count'] = stats['repair_count'] + stats['broken_count']
        
        # Calcul du pourcentage de santé
        total = stats['materiels_count']
        stats['health_percentage'] = round((stats['operational_count'] / total * 100), 1) if total > 0 else 100
        
        materiel_stats = Materiel.objects.values('categorie__nom').annotate(
            total=Sum('quantite'),
            count=Count('id')
        ).order_by('categorie__nom')
        
        events_stats = Evenement.objects.values('type_evenement').annotate(
            count=Count('id')
        ).order_by('type_evenement')
        
        today = datetime.now().date()
        upcoming_camps = CampMondial.objects.filter(date_debut__gte=today).order_by('date_debut')[:5]
        
        return Response({
            'stats': stats,
            'materiel_stats': list(materiel_stats),
            'events_stats': list(events_stats),
            'upcoming_camps': [
                {
                    'id': c.id,
                    'titre': c.titre,
                    'date_debut': c.date_debut,
                    'lieu': c.ville.nom
                } for c in upcoming_camps
            ]
        })

class DashboardRealtimeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        
        return Response({
            'recent_events': Evenement.objects.filter(date_debut__gte=week_ago).count(),
            'new_materiels': Materiel.objects.filter(created_at__gte=week_ago).count() if hasattr(Materiel, 'created_at') else 0,
            'low_stock_items': Materiel.objects.filter(quantite__lte=5).count(),
            'today_events': Evenement.objects.filter(date_debut__lte=today, date_fin__gte=today).count(),
            'last_updated': datetime.now().isoformat()
        })
