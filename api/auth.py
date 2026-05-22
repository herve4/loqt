from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers.common import UserRegisterSerializer, UserSerializer

class CustomAuthToken(ObtainAuthToken):
    permission_classes = [AllowAny]
    
    def get_user_permissions(self, user):
        """Get user's groups, permissions and permission status."""
        groups = list(user.groups.values_list('name', flat=True))
        permissions = list(user.get_all_permissions())
        
        # Check material permission status
        from logistque.models import DemandePermission
        demande = DemandePermission.objects.filter(
            user=user,
            permission_demande='add_material'
        ).order_by('-date_demande').first()
        
        can_add_material = user.is_staff or (demande and demande.statut == 'approuvee')
        material_permission_status = demande.statut if demande else None
        
        return {
            'groups': groups,
            'permissions': permissions,
            'can_add_material': can_add_material,
            'material_permission_status': material_permission_status
        }
    
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Determine user role or associated entity logic here if needed
        # For example, getting the associated church if the user is a pastor
        eglise = None
        if hasattr(user, 'eglise') and user.eglise:
            from logistque.models import Eglise
            eglise = user.eglise.id if isinstance(user.eglise, Eglise) else user.eglise

        user_permissions = self.get_user_permissions(user)

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.email,  # Using email as username since that's the USERNAME_FIELD
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'eglise': eglise,
            'is_staff': user.is_staff,
            'groups': user_permissions['groups'],
            'permissions': user_permissions['permissions'],
            'can_add_material': user_permissions['can_add_material'],
            'material_permission_status': user_permissions['material_permission_status']
        })


class RegisterViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """Register a new user"""
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, created = Token.objects.get_or_create(user=user)
            
            eglise = None
            if hasattr(user, 'eglise') and user.eglise:
                from logistque.models import Eglise
                eglise = user.eglise.id if isinstance(user.eglise, Eglise) else user.eglise
            
            # Get permissions using the helper method from CustomAuthToken
            auth_token_view = CustomAuthToken()
            user_permissions = auth_token_view.get_user_permissions(user)
            
            return Response({
                'token': token.key,
                'user_id': user.pk,
                'username': user.email,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'eglise': eglise,
                'is_staff': user.is_staff,
                'groups': user_permissions['groups'],
                'permissions': user_permissions['permissions'],
                'can_add_material': user_permissions['can_add_material'],
                'material_permission_status': user_permissions['material_permission_status'],
                'message': 'Inscription réussie'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Get current user profile"""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def profile_update(self, request):
        """Update current user profile"""
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def logout(self, request):
        """Logout current user - delete token"""
        try:
            request.user.auth_token.delete()
            return Response({
                'message': 'Déconnexion réussie'
            }, status=status.HTTP_200_OK)
        except Exception:
            return Response({
                'error': 'Erreur lors de la déconnexion'
            }, status=status.HTTP_400_BAD_REQUEST)


