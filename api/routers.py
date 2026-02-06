from rest_framework.routers import DefaultRouter, Route, DynamicRoute
from django.urls import path, include
from .viewsets.region import RegionViewSet

class CustomRouter(DefaultRouter):
    """
    Routeur personnalisé pour gérer correctement les actions personnalisées
    """
    routes = [
        # Route pour list, create, etc.
        Route(
            url=r'^{prefix}{trailing_slash}$',
            mapping={
                'get': 'list',
                'post': 'create',
                'put': 'update',
                'patch': 'partial_update',
                'delete': 'destroy'
            },
            name='{basename}-list',
            detail=False,
            initkwargs={'suffix': 'List'}
        ),
        # Route pour les actions personnalisées qui ne sont pas des détails
        DynamicRoute(
            url=r'^{prefix}/{url_path}{trailing_slash}$',
            name='{basename}-{url_name}',
            detail=False,
            initkwargs={}
        ),
        # Route pour les détails
        Route(
            url=r'^{prefix}/{lookup}{trailing_slash}$',
            mapping={
                'get': 'retrieve',
                'put': 'update',
                'patch': 'partial_update',
                'delete': 'destroy'
            },
            name='{basename}-detail',
            detail=True,
            initkwargs={}
        ),
        # Route pour les actions personnalisées sur un objet spécifique
        DynamicRoute(
            url=r'^{prefix}/{lookup}/{url_path}{trailing_slash}$',
            name='{basename}-{url_name}',
            detail=True,
            initkwargs={}
        ),
    ]

# Utiliser notre routeur personnalisé
router = CustomRouter()
router.register(r'regions', RegionViewSet, basename='region')

# Ajouter manuellement la route d'export si nécessaire
urlpatterns = [
    path('', include(router.urls)),
    # Ajouter explicitement la route d'export
    path('regions/export/', RegionViewSet.as_view({'get': 'export'}), name='region-export'),
]