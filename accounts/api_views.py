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
        return False


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all().order_by('first_name')
    serializer_class = UserSerializer

    def get_permissions(self):
        # List / Create / Delete → super_admin only
        if self.action in ('list', 'create', 'destroy'):
            return [IsSuperAdmin()]
        # Retrieve / Update / Partial-update → self OR super_admin
        return [IsSelfOrSuperAdmin()]

    def get_serializer(self, *args, **kwargs):
        """
        Non-admin users editing their own profile cannot change
        role, eglise, pole or is_active — strip those fields.
        """
        serializer = super().get_serializer(*args, **kwargs)
        user = self.request.user
        if user.role != 'super_admin' and self.action in ('update', 'partial_update'):
            for field in ('role', 'eglise', 'pole', 'is_active'):
                serializer.fields.pop(field, None)
        return serializer
