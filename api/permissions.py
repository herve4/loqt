from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin users."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class IsLogistician(permissions.BasePermission):
    """Allow access to users in 'Responsable Logistique' group."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='Responsable Logistique').exists()


class IsPastor(permissions.BasePermission):
    """Allow access to users in 'Pasteur' group."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.groups.filter(name='Pasteur').exists()


class IsStaffOrReadOnly(permissions.BasePermission):
    """Allow write access only to staff users, read access to all authenticated users."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return bool(request.user and request.user.is_staff)


class IsLogisticianOrReadOnly(permissions.BasePermission):
    """Allow write access to logisticians, read access to anyone (public)."""
    def has_permission(self, request, view):
        # Allow read access to all (authenticated or not)
        if request.method in permissions.SAFE_METHODS:
            return True
        # Write access restricted to logisticians and staff
        if not request.user or not request.user.is_authenticated:
            return False
        return (
            request.user.is_staff or 
            request.user.groups.filter(name='Responsable Logistique').exists()
        )

    def has_object_permission(self, request, view, obj):
        # Check if user owns the object (for materiel, check if same church/logistics)
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_staff:
            return True
        # For logisticians: can only edit materials in their church
        if hasattr(obj, 'eglise'):
            return hasattr(request.user, 'eglise') and obj.eglise == request.user.eglise
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow write access only to the owner (creator) of an object."""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if not hasattr(obj, 'created_by'):
            return request.user.is_staff
        return obj.created_by == request.user or request.user.is_staff


class HasPermissionRequest(permissions.BasePermission):
    """Allow access based on DemandePermission status."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        # For write operations, check if user has approved permission
        from logistque.models import DemandePermission
        has_approved = DemandePermission.objects.filter(
            user=request.user,
            permission_demande='add_material',
            statut='approuvee'
        ).exists()
        return has_approved or request.user.is_staff
