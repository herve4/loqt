from django.urls import path, include
from django.contrib.staticfiles.urls import staticfiles_urlpatterns

from logistque.villes.views import *
from logistque.views import (DashboardView,EgliseListView,EgliseDetailView,EgliseCreateView,EgliseDeleteView,EgliseUpdateView,
MaterielListView,MaterielDetailView,MaterielCreateView,MaterielUpdateView,MaterielDeleteView,MaterielRestoreView,ajax_delete,
MaterielStatsAPIView,get_sous_categories,export_eglises,DemandePermissionCreateView,CampListView,CampDetailView,CampCreateView,
export_materiels_excel)
from django.conf import settings
from django.conf.urls.static import static
# Importer les URLs des événements avec leur espace de noms
from logistque.events import urls as events_urls

urlpatterns = [
    path('', DashboardView.as_view(), name='dashboard-client'),
    # Église
    path('eglises/', EgliseListView.as_view(), name='eglise-list'),
    path('eglises/<int:pk>/', EgliseDetailView.as_view(), name='eglise-detail'),
    path('eglises/export/<str:format>/', export_eglises, name='export-eglises'),
    path('eglises/ajouter/', EgliseCreateView.as_view(), name='eglise-create'),
    path('eglise/<int:pk>/delete/', EgliseDeleteView.as_view(), name='eglise-delete'),
    path('eglises/<int:pk>/modifier/', EgliseUpdateView.as_view(), name='eglise-update'),

    # Matériel
    path('materiels/', MaterielListView.as_view(), name='materiel-list'),
    path('materiels/demande-permission/', DemandePermissionCreateView.as_view(), name='demande-permission'),
    path('materiel/ajouter/', MaterielCreateView.as_view(), name='materiel-create'),
    path('materiels/<int:pk>&<slug:slug>/', MaterielDetailView.as_view(), name='materiel-detail'),
    path('materiels/<int:pk>/update/', MaterielUpdateView.as_view(), name='materiel-update'),
    path('materiels/<int:pk>/delete/', MaterielDeleteView.as_view(), name='materiel-delete'),
    path('materiels/<int:pk>/restore/', MaterielRestoreView.as_view(), name='materiel-restore'),
    path('materiels/<int:pk>/restore/delete-finally/', ajax_delete, name='materiel-delete-final'),
    path('api/materiel-stats/', MaterielStatsAPIView.as_view(), name='materiel-stats'),
    path('get_sous_categories/', get_sous_categories, name='get_sous_categories'),

    # Camps
    path('camps/', CampListView.as_view(), name='camp-list'),
    path('camps/<int:pk>/', CampDetailView.as_view(), name='camp-detail'),
    path('camps/ajouter/', CampCreateView.as_view(), name='camp-create'),
    path('materiels/export/', export_materiels_excel, name='materiel-export'),
    
    # Événements
    path('evenements/', include('logistque.events.urls')),
    
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)




urlpatterns_ville = [
    path('villes/', VilleListView.as_view(), name='ville-list'),
    path('villes/ajouter/', VilleCreateView.as_view(), name='ville-create'),  # Nouvelle URL pou
    path('ville/<int:pk>/modifier/', VilleUpdateView.as_view(), name='ville-update'),
    path('ville/<int:pk>/supprimer/', VilleDeleteView.as_view(), name='ville-delete'),
]



# Ajout des URLs de l'application 'events'
urlpatterns += [path('', include(events_urls))]

urlpatterns += urlpatterns_ville
urlpatterns += staticfiles_urlpatterns()