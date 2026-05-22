from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from logistque.models import Materiel, Evenement
from accounts.models import CustomUser

class Command(BaseCommand):
    help = 'Set up default groups and permissions for LOQT'

    def handle(self, *args, **options):
        # Define groups and their permissions
        groups_config = {
            'Admin': [
                'add_materiel', 'change_materiel', 'delete_materiel', 'view_materiel',
                'add_customuser', 'change_customuser', 'delete_customuser', 'view_customuser',
                'add_event', 'change_event', 'delete_event', 'view_event',
                'add_demandepermission', 'change_demandepermission', 'delete_demandepermission', 'view_demandepermission',
            ],
            'Responsable Logistique': [
                'add_materiel', 'change_materiel', 'delete_materiel', 'view_materiel',
                'view_customuser',
                'view_event',
                'add_demandepermission', 'view_demandepermission',
            ],
            'Pasteur': [
                'view_materiel',
                'view_event',
                'add_demandepermission', 'view_demandepermission',
            ],
            'Membre': [
                'view_materiel',
                'view_event',
            ],
        }

        for group_name, permissions in groups_config.items():
            # Create group if it doesn't exist
            group, created = Group.objects.get_or_create(name=group_name)
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'{action} group: {group_name}')

            # Assign permissions to group
            for perm_codename in permissions:
                # Try to get permission from different models
                perm = None
                for model in [Materiel, CustomUser, Evenement]:
                    try:
                        content_type = ContentType.objects.get_for_model(model)
                        perm = Permission.objects.get(
                            content_type=content_type,
                            codename=perm_codename
                        )
                        break
                    except Permission.DoesNotExist:
                        continue

                if perm:
                    group.permissions.add(perm)
                    self.stdout.write(f'  ✓ {perm_codename}')
                else:
                    self.stdout.write(
                        self.style.WARNING(f'  ✗ Permission not found: {perm_codename}')
                    )

        self.stdout.write(self.style.SUCCESS('✅ Groups and permissions setup complete'))
