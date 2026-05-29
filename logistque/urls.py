from django.urls import path, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from logistque.villes.views import *
from logistque.views import (MaterielStatsAPIView,get_sous_categories,PackingListPDFView)
from django.conf import settings
from django.conf.urls.static import static
# Importer les URLs des événements avec leur espace de noms

from rest_framework.routers import DefaultRouter
from logistque.api_views import (
    EgliseViewSet, MaterielViewSet, EvenementViewSet,
    ChronogrammeItemViewSet, PoleCompetenceViewSet,
    MouvementMaterielViewSet, FicheDefectuositeViewSet,
    ReunionDimancheViewSet, RessourceFormationViewSet,
    DemandeFormationSGLViewSet, ExpressionBesoinViewSet,
    ValidationCircuitViewSet, user_list,
    FormationViewSet, DemandeFormationViewSet, SessionFormationViewSet,
    RegionViewSet, VilleViewSet, CategorieViewSet, SousCategorieViewSet,
    EvenementImageViewSet, ChronogrammeTemplateViewSet, MaterielImageViewSet
)
from logistque.api_auth import LoginAPIView, LogoutAPIView, RegisterAPIView, SendVerificationCodeView, VerifyCodeView, GoogleLoginAPIView
from logistque.api_user import CurrentUserAPIView

router = DefaultRouter()
router.register(r'regions', RegionViewSet)
router.register(r'villes', VilleViewSet)
router.register(r'eglises', EgliseViewSet)
router.register(r'categories', CategorieViewSet)
router.register(r'sous-categories', SousCategorieViewSet)
router.register(r'materiels', MaterielViewSet)
router.register(r'materiel-images', MaterielImageViewSet)
router.register(r'evenements', EvenementViewSet)
router.register(r'evenement-images', EvenementImageViewSet)
router.register(r'chronogramme-items', ChronogrammeItemViewSet)
router.register(r'poles', PoleCompetenceViewSet)
router.register(r'mouvements', MouvementMaterielViewSet)
router.register(r'defectuosites', FicheDefectuositeViewSet)
router.register(r'reunions', ReunionDimancheViewSet)
router.register(r'ressources', RessourceFormationViewSet)
router.register(r'demandes-formation', DemandeFormationSGLViewSet)
router.register(r'besoins', ExpressionBesoinViewSet)
router.register(r'validations', ValidationCircuitViewSet)
router.register(r'formations', FormationViewSet)
router.register(r'demandes-f', DemandeFormationViewSet)
router.register(r'sessions-f', SessionFormationViewSet)
router.register(r'chronogramme-templates', ChronogrammeTemplateViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/users/', user_list, name='user-list'),
    path('api/auth/login/', LoginAPIView.as_view(), name='api-login'),
    path('api/auth/logout/', LogoutAPIView.as_view(), name='api-logout'),
    path('api/auth/register/', RegisterAPIView.as_view(), name='api-register'),
    path('api/auth/google/', GoogleLoginAPIView.as_view(), name='api-google-login'),
    path('api/auth/send-code/', SendVerificationCodeView.as_view(), name='api-send-code'),
    path('api/auth/verify-code/', VerifyCodeView.as_view(), name='api-verify-code'),
    path('api/auth/me/', CurrentUserAPIView.as_view(), name='api-me'),
    path('api/materiel-stats/', MaterielStatsAPIView.as_view(), name='materiel-stats'),
    path('get_sous_categories/', get_sous_categories, name='get_sous_categories'),
    path('evenements/', include('logistque.events.urls')),
    path('evenements/colisage/<int:event_id>/pdf/', PackingListPDFView.as_view(), name='packing-list-pdf'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

urlpatterns += staticfiles_urlpatterns()