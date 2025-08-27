"""
Sérialiseurs pour l'API des événements.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone

from logistque.models import (
    Evenement, 
    EvenementMateriel, 
    ReservationMateriel, 
    ChronogrammeItem
)
from logistque.models import Materiel

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les utilisateurs."""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name']
        read_only_fields = fields
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"


class MaterielSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les matériels."""
    class Meta:
        model = Materiel
        fields = ['id', 'nom', 'categorie', 'quantite', 'description']
        read_only_fields = fields


class EvenementMaterielSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les matériels d'un événement."""
    materiel = MaterielSerializer(read_only=True)
    materiel_id = serializers.PrimaryKeyRelatedField(
        queryset=Materiel.objects.all(),
        source='materiel',
        write_only=True
    )
    
    class Meta:
        model = EvenementMateriel
        fields = ['id', 'materiel', 'materiel_id', 'quantite', 'date_ajout', 'ajoute_par']
        read_only_fields = ['date_ajout', 'ajoute_par']
    
    def validate_quantite(self, value):
        """Valide que la quantité est positive."""
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à zéro.")
        return value
    
    def validate(self, data):
        """Valide que la quantité ne dépasse pas la quantité disponible."""
        materiel = data.get('materiel')
        quantite = data.get('quantite')
        
        if materiel and quantite and quantite > materiel.quantite:
            raise serializers.ValidationError({
                'quantite': f'Quantité non disponible. Il ne reste que {materiel.quantite} unités.'
            })
            
        return data


class ChronogrammeItemSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les éléments du chronogramme d'un événement."""
    class Meta:
        model = ChronogrammeItem
        fields = [
            'id', 'titre', 'description', 'heure_debut', 'heure_fin', 
            'responsable', 'materiels_needed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def validate(self, data):
        """Valide que l'heure de fin est postérieure à l'heure de début."""
        if 'heure_debut' in data and 'heure_fin' in data:
            if data['heure_debut'] >= data['heure_fin']:
                raise serializers.ValidationError({
                    'heure_fin': "L'heure de fin doit être postérieure à l'heure de début."
                })
        return data


class ReservationMaterielSerializer(serializers.ModelSerializer):
    """Sérialiseur pour les réservations de matériel."""
    materiel = MaterielSerializer(read_only=True)
    materiel_id = serializers.PrimaryKeyRelatedField(
        queryset=Materiel.objects.all(),
        source='materiel',
        write_only=True
    )
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    demandeur = UserSerializer(read_only=True)
    
    class Meta:
        model = ReservationMateriel
        fields = [
            'id', 'materiel', 'materiel_id', 'quantite', 'date_debut', 'date_fin',
            'statut', 'statut_display', 'motif', 'date_creation', 'date_modification',
            'demandeur', 'approuve_par', 'date_approbation', 'motif_rejet'
        ]
        read_only_fields = [
            'statut', 'date_creation', 'date_modification', 'demandeur', 
            'approuve_par', 'date_approbation', 'motif_rejet'
        ]
    
    def validate_quantite(self, value):
        """Valide que la quantité est positive."""
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être supérieure à zéro.")
        return value
    
    def validate_date_fin(self, value):
        """Valide que la date de fin est dans le futur."""
        if value < timezone.now().date():
            raise serializers.ValidationError("La date de fin doit être dans le futur.")
        return value
    
    def validate(self, data):
        """Valide les contraintes de dates et de disponibilité."""
        date_debut = data.get('date_debut')
        date_fin = data.get('date_fin')
        materiel = data.get('materiel')
        quantite = data.get('quantite')
        
        # Vérifier que la date de fin est postérieure à la date de début
        if date_debut and date_fin and date_debut >= date_fin:
            raise serializers.ValidationError({
                'date_fin': "La date de fin doit être postérieure à la date de début."
            })
        
        # Vérifier la disponibilité du matériel
        if materiel and quantite and date_debut and date_fin:
            # Vérifier que la quantité demandée est disponible
            if quantite > materiel.quantite:
                raise serializers.ValidationError({
                    'quantite': f'Quantité non disponible. Il ne reste que {materiel.quantite} unités.'
                })
            
            # Vérifier les conflits de réservation
            overlapping_reservations = ReservationMateriel.objects.filter(
                materiel=materiel,
                date_debut__lte=date_fin,
                date_fin__gte=date_debut,
                statut__in=['en_attente', 'approuve']
            )
            
            # Exclure la réservation actuelle en cas de mise à jour
            if self.instance:
                overlapping_reservations = overlapping_reservations.exclude(pk=self.instance.pk)
            
            # Calculer la quantité déjà réservée pendant cette période
            reserved_quantity = sum(r.quantite for r in overlapping_reservations)
            available_quantity = materiel.quantite - reserved_quantity
            
            if quantite > available_quantity:
                raise serializers.ValidationError({
                    'quantite': f'Seulement {available_quantity} unités disponibles pour cette période.'
                })
        
        return data


class EvenementSerializer(serializers.ModelSerializer):
    """Sérialiseur de base pour les événements."""
    organisateur = UserSerializer(read_only=True)
    logisticiens_gestion = UserSerializer(many=True, read_only=True)
    logisticiens_gestion_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='logisticiens_gestion',
        many=True,
        write_only=True,
        required=False
    )
    statut = serializers.CharField(source='get_statut_display', read_only=True)
    materiels = EvenementMaterielSerializer(many=True, read_only=True)
    
    class Meta:
        model = Evenement
        fields = [
            'id', 'titre', 'description', 'date_debut', 'date_fin', 'type_evenement',
            'organisateur', 'statut', 'image',
            'logisticiens_gestion', 'logisticiens_gestion_ids', 'materiels'
        ]
        read_only_fields = ['organisateur', 'statut']
    
    def validate_date_fin(self, value):
        """Valide que la date de fin est postérieure à la date de début."""
        date_debut = self.initial_data.get('date_debut')
        if date_debut and value < date_debut:
            raise serializers.ValidationError("La date de fin doit être postérieure à la date de début.")
        return value
    
    def create(self, validated_data):
        """Crée un nouvel événement avec les logisticiens assignés."""
        logisticiens = validated_data.pop('logisticiens_gestion', [])
        event = Evenement.objects.create(**validated_data)
        event.logisticiens_gestion.set(logisticiens)
        return event
    
    def update(self, instance, validated_data):
        """Met à jour un événement avec les logisticiens assignés."""
        logisticiens = validated_data.pop('logisticiens_gestion', None)
        
        # Mettre à jour les champs de l'événement
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Mettre à jour les logisticiens si fournis
        if logisticiens is not None:
            instance.logisticiens_gestion.set(logisticiens)
        
        instance.save()
        return instance


class EvenementDetailSerializer(EvenementSerializer):
    """Sérialiseur détaillé pour un événement, incluant les relations."""
    participants = UserSerializer(many=True, read_only=True)
    chronogramme = ChronogrammeItemSerializer(many=True, read_only=True)
    reservations = ReservationMaterielSerializer(many=True, read_only=True)
    
    class Meta(EvenementSerializer.Meta):
        fields = EvenementSerializer.Meta.fields + [
            'participants', 'chronogramme', 'reservations'
        ]
