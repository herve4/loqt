from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from accounts.models import CustomUser
from logistque.admin import admin_site
from django.contrib.auth.models import Group, Permission


@admin.register(CustomUser, site=admin_site)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('role','first_name', 'last_name','email', 'phone','user_image_preview','is_staff')
    list_filter = ('is_staff', 'is_superuser', 'is_active','role',)
    fieldsets = (
        (None, {'fields': ('email','phone', 'eglise','password')}),
        (_('Informations personnelles'), {'fields': ('first_name', 'last_name','image','role')}),
        (_('Dates importantes'), {'fields': ('last_login',)}),
        (_('Permissions'), {'fields': ('groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('first_name', 'last_name','email', 'phone','role','eglise','image', 'password1', 'password2'),
            'description': 'Veuillez remplir les champs suivants pour créer un nouveau utilisateur.',
            
        }),
    )
    search_fields = ('email', 'phone')
    ordering = ('-id',)
    list_per_page = 10  # Set the number of items per page
    
    actions = ['activate_users', 'deactivate_users', 'reset_passwords']
    

    def activate_users(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, "Selected users have been activated.")

    def deactivate_users(self, request, queryset):
        queryset.update(is_active=False)
        self.message_user(request, "Selected users have been deactivated.")

    def reset_passwords(self, request, queryset):
        for user in queryset:
            user.set_password('new_default_password')  # Set a default password or generate a random one
            user.save()
        self.message_user(request, "Passwords have been reset for the selected users.")
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
    
@admin.register(Group, site=admin_site)
class GroupsAdmin(admin.ModelAdmin):
    model = Group
    list_display = ('name',)
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
    
    

    
@admin.register(Permission, site=admin_site)
class PermissionsAdmin(admin.ModelAdmin):
    model = Permission
    list_display = ('name',)
    
    def has_module_permission(self, request):
        return True
    
    def has_view_permission(self, request, obj=None):
        return True
    
    def has_add_permission(self, request):
        return True
    
    def has_change_permission(self, request, obj=None):
        return True
    
    def has_delete_permission(self, request, obj=None):
        return True
    
    



    
    
    
