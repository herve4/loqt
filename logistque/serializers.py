from rest_framework import serializers

from logistque.models import Evenement
class EvenementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evenement
        fields = ['id', 'titre', 'type_evenement', 'organisateur_type', 'organisateur_nom', 'date_debut', 'date_fin', 'description']
        read_only_fields = ['id']
        extra_kwargs = {
            'titre': {'required': True},
            'type_evenement': {'required': True},
            'organisateur_type': {'required': True},
            'organisateur_nom': {'required': True},
            'date_debut': {'required': True},
            'date_fin': {'required': True},
            'description': {'required': False}
        }
