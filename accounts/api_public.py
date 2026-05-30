from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return

User = get_user_model()

class PublicMemberVerifyAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication, SessionAuthentication]

    def get(self, request, user_id):
        try:
            user = User.objects.select_related('eglise', 'pole').get(pk=user_id)
            # Dictionnaire d'affichage humanisé pour les rôles
            role_display = dict(user.roles).get(user.role, user.role)
            
            data = {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name(),
                'role': user.role,
                'role_display': role_display,
                'eglise_nom': user.eglise.nom if user.eglise else 'Non spécifiée',
                'eglise_ville': user.eglise.ville.nom if user.eglise and user.eglise.ville else '',
                'departement': user.pole.nom if user.pole else 'Non spécifié',
                'section': user.section or 'Non spécifiée',
                'image': user.image.url if user.image else None,
                'is_active': user.is_active
            }
            return Response(data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'message': 'Membre introuvable'}, status=status.HTTP_404_NOT_FOUND)
