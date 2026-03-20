"""
URL configuration for loqt project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from logistque.admin import admin_site
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from logistque.views import geocode_city
from logistque.api_auth import LoginAPIView, LogoutAPIView, RegisterAPIView
from logistque.api_dashboard import DashboardStatsAPIView, DashboardRealtimeAPIView
from logistque.api_materiels import MaterielListAPIView, CategoriesListAPIView
from logistque.api_permissions import PermissionRequestAPIView, PermissionStatusAPIView
from logistque.api_materiels_crud import MaterielCreateAPIView, MaterielUpdateAPIView, MaterielDeleteAPIView, MaterielRestoreAPIView
from django.contrib.staticfiles.views import serve as static_serve
from django.views.static import serve as media_serve
from .health import health_check
from logistque.api_password_reset import PasswordResetRequestAPIView, PasswordResetConfirmAPIView
from django.views.generic import RedirectView
from api.routers import urlpatterns as api_urls

urlpatterns = [
    # Redirection de la racine vers l'API
    path('', RedirectView.as_view(url='/api/', permanent=False)),
    # Endpoint de santé pour les vérifications de santé (healthchecks)
    path('health/', health_check, name='health_check'),
    
    # API Endpoints
    path('api/', include(api_urls)),
    path('admin/', admin_site.urls),
    path('', include('logistque.urls')),
    path('api-auth/', include('rest_framework.urls')),
    path("api/geocode/", geocode_city, name="geocode_city"),
    
    # URLs pour servir les fichiers statiques et médias en développement
    path('static/<path:path>', static_serve, {'insecure': True}),
    path('media/<path:path>', media_serve, {'document_root': settings.MEDIA_ROOT}),
    
    # API Endpoints pour l'authentification (React/Frontend)
    path('api/auth/login/', LoginAPIView.as_view(), name='api-login'),
    path('api/auth/logout/', LogoutAPIView.as_view(), name='api-logout'),
    path('api/auth/register/', RegisterAPIView.as_view(), name='api-register'),
    path('api/auth/password-reset/', PasswordResetRequestAPIView.as_view(), name='api-password-reset'),
    path('api/auth/password-reset-confirm/', PasswordResetConfirmAPIView.as_view(), name='api-password-reset-confirm'),
    
    # API Endpoints pour le dashboard (React/Frontend)
    path('api/dashboard/stats/', DashboardStatsAPIView.as_view(), name='api-dashboard-stats'),
    path('api/dashboard/realtime/', DashboardRealtimeAPIView.as_view(), name='api-dashboard-realtime'),
    
    # API Endpoints pour les matériels (React/Frontend)
    path('api/materiels/', MaterielListAPIView.as_view(), name='api-materiels-list'),
    path('api/categories/', CategoriesListAPIView.as_view(), name='api-categories-list'),
    
    # API Endpoints CRUD pour les matériels (React/Frontend)
    path('api/materiels/create/', MaterielCreateAPIView.as_view(), name='api-materiel-create'),
    path('api/materiels/<int:materiel_id>/update/', MaterielUpdateAPIView.as_view(), name='api-materiel-update'),
    path('api/materiels/<int:materiel_id>/delete/', MaterielDeleteAPIView.as_view(), name='api-materiel-delete'),
    path('api/materiels/<int:materiel_id>/restore/', MaterielRestoreAPIView.as_view(), name='api-materiel-restore'),
    
    # API Endpoints pour les permissions (React/Frontend)
    path('api/permissions/request/', PermissionRequestAPIView.as_view(), name='api-permission-request'),
    path('api/permissions/status/', PermissionStatusAPIView.as_view(), name='api-permission-status'),
    # path('reinitialisation/', include('django.contrib.auth.urls'), name='password_reset'),
    
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)



urlpatterns += staticfiles_urlpatterns()
