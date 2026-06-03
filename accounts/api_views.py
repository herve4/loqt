from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from accounts.models import CustomUser
from accounts.serializers import UserSerializer


class IsSuperAdmin(permissions.BasePermission):
    """Grants full access only to super_admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'super_admin')


class IsSelfOrSuperAdmin(permissions.BasePermission):
    """
    - super_admin: can do anything (list, create, update, delete any user)
    - any authenticated user: can only retrieve/update their own record (safe or PATCH/PUT)
    - managers: can retrieve/update users pending validation within their authority scope
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        # super_admin can do everything
        if request.user.role == 'super_admin':
            return True
        # Others can only read/update themselves
        if obj == request.user:
            return request.method in ('GET', 'PUT', 'PATCH')
        # Managers can retrieve/update pending members within their authority scope
        if obj.validation_status == 'pending':
            return request.user.can_validate(obj) and request.method in ('GET', 'PUT', 'PATCH')
        return False


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return CustomUser.objects.none()

        # Le super_admin voit tout le monde
        if user.role == 'super_admin':
            return CustomUser.objects.all().order_by('first_name')

        # Les gestionnaires nationaux voient tous les approuvés et tous les en attente
        if user.role in ('pasteur_national', 'rln'):
            from django.db.models import Q
            return CustomUser.objects.filter(
                Q(validation_status='approved') | Q(validation_status='pending')
            ).order_by('first_name')

        # Les gestionnaires locaux (pasteur local et RLL) voient tous les approuvés + les en attente de leur église
        if user.role in ('pasteur_local', 'rll') and user.eglise_id:
            from django.db.models import Q
            return CustomUser.objects.filter(
                Q(validation_status='approved') |
                Q(validation_status='pending', eglise_id=user.eglise_id)
            ).order_by('first_name')

        # Les responsables de département (resp_dept, adj_dept) voient tous les approuvés + les en attente de leur pôle/région
        if user.role in ('resp_dept', 'adj_dept') and user.pole_id:
            from django.db.models import Q
            q_pending = Q(validation_status='pending', pole_id=user.pole_id)
            if user.eglise and user.eglise.region_id:
                q_pending &= Q(eglise__region_id=user.eglise.region_id)
            return CustomUser.objects.filter(
                Q(validation_status='approved') | q_pending
            ).order_by('first_name')

        # Les responsables de section (resp_sec, adj_sec) voient tous les approuvés + les en attente de leur section/région
        if user.role in ('resp_sec', 'adj_sec') and user.section:
            from django.db.models import Q
            q_pending = Q(validation_status='pending', section__iexact=user.section.strip())
            if user.eglise and user.eglise.region_id:
                q_pending &= Q(eglise__region_id=user.eglise.region_id)
            return CustomUser.objects.filter(
                Q(validation_status='approved') | q_pending
            ).order_by('first_name')

        # Par défaut, un utilisateur standard ne voit que les approuvés
        return CustomUser.objects.filter(validation_status='approved').order_by('first_name')

    def get_permissions(self):
        # List is accessible to any authenticated user
        if self.action == 'list':
            return [permissions.IsAuthenticated()]
        # Create / Delete → super_admin only
        if self.action in ('create', 'destroy'):
            return [IsSuperAdmin()]
        # Retrieve / Update / Partial-update → self OR super_admin OR validator
        return [IsSelfOrSuperAdmin()]

    def get_serializer(self, *args, **kwargs):
        """
        Non-admin users editing their own profile cannot change
        role, eglise, pole, is_active or validation_status.
        Validators editing pending users can only change validation_status.
        """
        serializer = super().get_serializer(*args, **kwargs)
        user = self.request.user
        if self.action not in ('update', 'partial_update'):
            return serializer

        instance = kwargs.get('instance')
        if instance == user:
            for field in ('role', 'eglise', 'pole', 'is_active', 'validation_status'):
                serializer.fields.pop(field, None)
        else:
            if user.role != 'super_admin':
                allowed_fields = {'validation_status'}
                for field in list(serializer.fields.keys()):
                    if field not in allowed_fields:
                        serializer.fields.pop(field, None)
        return serializer
