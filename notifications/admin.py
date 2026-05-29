from django.contrib import admin
from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ('recipient', 'type', 'title', 'is_read', 'created_at')
    list_filter   = ('type', 'is_read', 'created_at')
    search_fields = ('recipient__email', 'recipient__first_name', 'title', 'message')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
    list_per_page = 50

    actions = ['mark_as_read', 'mark_as_unread']

    @admin.action(description='Marquer comme lues')
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)

    @admin.action(description='Marquer comme non lues')
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
