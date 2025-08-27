from django.db import migrations
from django.db import models

def transfer_data(apps, schema_editor):
    # Logique pour transférer les données de l'ancien champ vers le nouveau
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('logistque', 'previous_migration'),
    ]

    operations = [
        migrations.RunPython(transfer_data),
        migrations.RemoveField(
            model_name='evenement',
            name='materiels_utilises',
        ),
        migrations.AddField(
            model_name='evenement',
            name='materiels_utilises',
            field=models.ManyToManyField(to='logistque.Materiel', through='logistque.EvenementMateriel'),
        ),
    ]