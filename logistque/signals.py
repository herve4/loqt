# Dans votre configuration ou signals.py


# def create_groups(sender, **kwargs):
#     # Groupe Pasteur
#     pasteur_group, _ = Group.objects.get_or_create(name='Pasteurs')
#     pasteur_perms = Permission.objects.filter(
#         codename__in=['add_membre', 'change_membre', 'view_membre']
#     )
#     pasteur_group.permissions.set(pasteur_perms)
    
#     # Groupe Responsable
#     responsable_group, _ = Group.objects.get_or_create(name='Responsables')
#     all_perms = Permission.objects.all()
#     responsable_group.permissions.set(all_perms)

# post_migrate.connect(create_groups)


# @receiver(post_save, sender=MaterielReserve)
# def update_stock(sender, instance, **kwargs):
#     """Mise à jour de la quantité de stock en fonction du statut de la réservation"""
#     if instance.statut == 'reserve':
#         instance.materiel.quantite -= instance.quantite_reservee
#         instance.materiel.save()