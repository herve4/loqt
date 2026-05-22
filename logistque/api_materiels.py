from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.db.models import Q
from .models import Materiel, CategorieMateriel
from django.core.paginator import Paginator

@method_decorator(csrf_exempt, name='dispatch')
class MaterielListAPIView(View):
    def get(self, request):
        try:
            # Validation des paramètres
            try:
                page = int(request.GET.get('page', 1))
                page_size = int(request.GET.get('page_size', 20))
                if page < 1:
                    return JsonResponse({
                        'success': False,
                        'message': 'Le numéro de page doit être supérieur à 0'
                    }, status=400)
                if page_size < 1 or page_size > 100:
                    return JsonResponse({
                        'success': False,
                        'message': 'Le nombre d\'éléments par page doit être entre 1 et 100'
                    }, status=400)
            except ValueError:
                return JsonResponse({
                    'success': False,
                    'message': 'Les paramètres page et page_size doivent être des nombres entiers'
                }, status=400)
            
            search = request.GET.get('searchInput', '')
            categorie = request.GET.get('categorie', 'All')
            sous_categorie = request.GET.get('sous_categorie', 'All')
            is_deleted = request.GET.get('is_deleted', 'false').lower() == 'true'
            
            # Base queryset
            queryset = Materiel.objects.all()
            
            # Filtrage par suppression
            if is_deleted:
                queryset = queryset.filter(is_deleted=True)
            else:
                queryset = queryset.filter(is_deleted=False)
            
            # Filtrage par recherche
            if search:
                queryset = queryset.filter(
                    Q(nom__icontains=search) |
                    Q(description__icontains=search) |
                    Q(slug__icontains=search) |
                    Q(categorie__nom__icontains=search) |
                    Q(sous_categorie__nom__icontains=search)
                )
            
            # Filtrage par catégorie
            if categorie and categorie != 'All':
                queryset = queryset.filter(categorie__nom=categorie)
            
            # Filtrage par sous-catégorie
            if sous_categorie and sous_categorie != 'All':
                queryset = queryset.filter(sous_categorie__nom=sous_categorie)
            
            # Tri
            queryset = queryset.order_by('-created_at')
            
            # Pagination
            paginator = Paginator(queryset, page_size)
            materiels_page = paginator.get_page(page)
            
            # Sérialisation des données
            materiels_data = []
            for materiel in materiels_page:
                materiels_data.append({
                    'id': materiel.id,
                    'nom': materiel.nom,
                    'slug': materiel.slug,
                    'description': materiel.description,
                    'quantite': materiel.quantite,
                    'categorie': {
                        'id': materiel.categorie.id if materiel.categorie else None,
                        'nom': materiel.categorie.nom if materiel.categorie else None
                    },
                    'sous_categorie': {
                        'id': materiel.sous_categorie.id if materiel.sous_categorie else None,
                        'nom': materiel.sous_categorie.nom if materiel.sous_categorie else None
                    },
                    'statut': materiel.statut if hasattr(materiel, 'statut') else 'disponible',
                    'date_ajout': materiel.created_at.strftime('%Y-%m-%d %H:%M:%S') if materiel.created_at else None,
                    'image': materiel.image.url if materiel.image else None,
                    'qr_code': materiel.qr_code.url if materiel.qr_code else None,
                    'code_barre': materiel.code_barre.url if materiel.code_barre else None,
                    'is_deleted': materiel.is_deleted,
                    'eglise': {
                        'id': materiel.eglise.id if materiel.eglise else None,
                        'nom': materiel.eglise.nom if materiel.eglise else None
                    } if materiel.eglise else None,
                    'logistique': {
                        'id': materiel.logistique.id if materiel.logistique else None,
                        'nom': materiel.logistique.user.get_full_name() if materiel.logistique and materiel.logistique.user else None
                    } if materiel.logistique else None
                })
            
            return JsonResponse({
                'success': True,
                'data': materiels_data,
                'pagination': {
                    'current_page': page,
                    'total_pages': paginator.num_pages,
                    'total_items': paginator.count,
                    'page_size': page_size,
                    'has_next': materiels_page.has_next(),
                    'has_previous': materiels_page.has_previous()
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Erreur serveur: {str(e)}'
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class CategoriesListAPIView(View):
    def get(self, request):
        try:
            categories = CategorieMateriel.objects.all().order_by('nom')
            categories_data = []
            
            for cat in categories:
                categories_data.append({
                    'id': cat.id,
                    'nom': cat.nom,
                    'sous_categories': [
                        {
                            'id': sc.id,
                            'nom': sc.nom,
                            'description': getattr(sc, 'description', '')
                        } for sc in cat.souscategoriemateriel_set.all()
                    ]
                })
            
            return JsonResponse({
                'success': True,
                'data': categories_data
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Erreur lors de la récupération des catégories: {str(e)}'
            }, status=500)
