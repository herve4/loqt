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
from logistque.auth_users.views import SignUpView
from logistque.views import geocode_city, login_view, logout_view, logout_confirm
from django.contrib.staticfiles.views import serve as static_serve
from django.views.static import serve as media_serve
from .health import health_check
from api.routers import urlpatterns as api_urls

urlpatterns = [
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
    path('accounts/', include('accounts.urls')),
    path('connexion/', login_view, name='login'),
    path('deconnexion/', logout_view, name='deconnexion'),
    path('confirmation-deconnexion/', logout_confirm, name='logout-confirm'),
    path('inscription/', SignUpView.as_view(), name='signup'),
    # path('reinitialisation/', include('django.contrib.auth.urls'), name='password_reset'),
    
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)



urlpatterns += staticfiles_urlpatterns()
