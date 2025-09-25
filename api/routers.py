from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .viewsets.region import RegionViewSet

router = DefaultRouter()
router.register(r'regions', RegionViewSet, basename='region')

urlpatterns = [
    path('', include(router.urls)),
]