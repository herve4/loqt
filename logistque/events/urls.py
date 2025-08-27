"""
URLs pour la gestion des événements et des notifications.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .api import EvenementViewSet
from .calendar_api import update_event_date
# Définition du nom de l'application pour les namespaces
app_name = 'events'

# Création du routeur pour l'API des événements
router = DefaultRouter()
router.register(r'events', EvenementViewSet, basename='event')

# URLs pour les événements
urlpatterns = [

    # Tableau de bord des événements
    path('', views.dashboard_events, name='events'),
    

    # Calendrier des événements
    path('calendar/', views.EventCalendarView.as_view(), name='event_calendar'),
    
    # Création d'un événement
    path('create/', views.EventCreateView.as_view(), name='event_create'),
    
    # Détail d'un événement
    path('<int:pk>/', views.EventDetailView.as_view(), name='event_detail'),
    
    # Mise à jour d'un événement
    path('<int:pk>/update/', views.EventUpdateView.as_view(), name='event_update'),
    
    # Suppression d'un événement
    path('<int:pk>/delete/', views.EventDeleteView.as_view(), name='event_delete'),
    
    # Liste des événements
    path('list/', views.EventListView.as_view(), name='event_list'),
    
    # Participants aux événements
    path('<int:event_pk>/participants/ajouter/', views.EventParticipantCreateView.as_view(), name='add_participant'),
    path('<int:event_id>/participants/<int:participant_pk>/supprimer/', views.EventParticipantDeleteView.as_view(), name='remove_participant'),
    path('<int:event_id>/inviter/', views.invite_participants, name='invite_participants'),
    
    # Matériel des événements
    path('<int:event_pk>/materiel/ajouter/', views.EventMaterialCreateView.as_view(), name='add_materiel'),
    path('materiel/<int:pk>/modifier/', views.EventMaterialUpdateView.as_view(), name='update_materiel'),
    path('materiel/<int:pk>/supprimer/', views.EventMaterialDeleteView.as_view(), name='remove_materiel'),
    
    # Réordonnancement des éléments du chronogramme
    path('<int:event_pk>/chronogram/items/reorder/', views.reorder_chronogram_items, name='reorder_chronogram_items'),
    
    # Éléments du chronogramme
    path('<int:event_pk>/chronogramme/ajouter/', views.ChronogramItemCreateView.as_view(), name='add_chronogramme_item'),
    path('chronogramme/<int:pk>/modifier/', views.ChronogramItemUpdateView.as_view(), name='edit_chronogram_item'),
    path('chronogramme/<int:pk>/supprimer/', views.ChronogramItemDeleteView.as_view(), name='delete_chronogram_item'),
    
    # Chronogramme des événements
    path('<int:event_pk>/chrono/ajouter/', views.ChronogramItemCreateView.as_view(), name='add_chronogramme_item'),

    # URLs de l'API (pour le drag-and-drop, etc.)
    path('api/events/<int:pk>/update_date/', update_event_date, name='api_event_update_date'),
    path('api/', include(router.urls)),
]



