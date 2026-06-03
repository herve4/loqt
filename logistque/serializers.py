from rest_framework import serializers
from logistque.models import (
    Region, Ville, Eglise, Materiel, Evenement, ChronogrammeItem, PoleCompetence,
    MouvementMateriel, FicheDefectuosite, ReunionDimanche,
    RessourceFormation, DemandeFormationSGL, ExpressionBesoin,
    ValidationCircuit,
    Formation, DemandeFormation, SessionFormation,
    CategorieMateriel, SousCategorieMateriel, EvenementImage,
    ChronogrammeTemplate, MaterielImage
)

class CategorieMaterielSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieMateriel
        fields = '__all__'

class SousCategorieMaterielSerializer(serializers.ModelSerializer):
    class Meta:
        model = SousCategorieMateriel
        fields = '__all__'

class RegionSerializer(serializers.ModelSerializer):
    eglise_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Region
        fields = '__all__'

class VilleSerializer(serializers.ModelSerializer):
    region_nom = serializers.CharField(source='region.nom', read_only=True)
    class Meta:
        model = Ville
        fields = '__all__'

class EgliseSerializer(serializers.ModelSerializer):
    ville_nom = serializers.CharField(source='ville.nom', read_only=True)
    region_nom = serializers.CharField(source='region.nom', read_only=True)
    pasteur_nom = serializers.SerializerMethodField()

    def get_pasteur_nom(self, obj):
        if obj.pasteur:
            return f"{obj.pasteur.first_name} {obj.pasteur.last_name}".strip() or obj.pasteur.username
        return None

    class Meta:
        model = Eglise
        fields = '__all__'

class MaterielImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaterielImage
        fields = '__all__'

class MaterielSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    eglise_nom = serializers.CharField(source='eglise.nom', read_only=True)
    mouvements_count = serializers.IntegerField(source='mouvements.count', read_only=True)
    defauts_count = serializers.IntegerField(source='fiches_defectuosite.count', read_only=True)
    images_materiel = MaterielImageSerializer(many=True, read_only=True)
    responsable_nom = serializers.SerializerMethodField()
    responsable_phone = serializers.SerializerMethodField()

    def get_responsable_nom(self, obj):
        if obj.logistique and obj.logistique.responsable:
            u = obj.logistique.responsable
            return f"{u.first_name} {u.last_name}".strip() or u.email or "Non spécifié"
        return "Non spécifié"

    def get_responsable_phone(self, obj):
        if obj.logistique and obj.logistique.responsable:
            return obj.logistique.responsable.phone or "Non spécifié"
        return "Non spécifié"

    class Meta:
        model = Materiel
        fields = '__all__'

class EvenementImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvenementImage
        fields = '__all__'

class EvenementSerializer(serializers.ModelSerializer):
    materiels_count = serializers.IntegerField(source='materiels_associes.count', read_only=True)
    images_illustration = EvenementImageSerializer(many=True, read_only=True)
    class Meta:
        model = Evenement
        fields = '__all__'

class ChronogrammeItemSerializer(serializers.ModelSerializer):
    pole_nom = serializers.CharField(source='pole.nom', read_only=True)
    responsable_nom = serializers.CharField(source='responsable.get_full_name', read_only=True)
    class Meta:
        model = ChronogrammeItem
        fields = '__all__'

class PoleCompetenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoleCompetence
        fields = '__all__'

class MouvementMaterielSerializer(serializers.ModelSerializer):
    materiel_nom = serializers.CharField(source='materiel.nom', read_only=True)
    eglise_origine_nom = serializers.CharField(source='eglise_origine.nom', read_only=True)
    eglise_destination_nom = serializers.CharField(source='eglise_destination.nom', read_only=True)
    evenement_titre = serializers.CharField(source='evenement.titre', read_only=True)
    responsable_nom = serializers.CharField(source='responsable.get_full_name', read_only=True)
    class Meta:
        model = MouvementMateriel
        fields = '__all__'

class FicheDefectuositeSerializer(serializers.ModelSerializer):
    materiel_nom = serializers.CharField(source='materiel.nom', read_only=True)

    def validate(self, data):
        if not data.get('materiel') and not data.get('nom_materiel_libre'):
            raise serializers.ValidationError(
                "Vous devez renseigner soit un matériel, soit le nom d'un matériel non référencé."
            )
        return data

    class Meta:
        model = FicheDefectuosite
        fields = '__all__'
        read_only_fields = ['rapporteur']

class ReunionDimancheSerializer(serializers.ModelSerializer):
    eglise_hote_nom = serializers.CharField(source='eglise_hote.nom', read_only=True)
    participants_count = serializers.IntegerField(source='participants.count', read_only=True)
    class Meta:
        model = ReunionDimanche
        fields = '__all__'

class RessourceFormationSerializer(serializers.ModelSerializer):
    pole_nom = serializers.CharField(source='pole.nom', read_only=True)
    class Meta:
        model = RessourceFormation
        fields = '__all__'

class DemandeFormationSGLSerializer(serializers.ModelSerializer):
    class Meta:
        model = DemandeFormationSGL
        fields = '__all__'

class ExpressionBesoinSerializer(serializers.ModelSerializer):
    eglise_nom = serializers.CharField(source='eglise.nom', read_only=True)
    demandeur_nom = serializers.SerializerMethodField()
    etape_circuit = serializers.CharField(source='circuit.etape_actuelle', read_only=True, default='RLL')
    notes_decision = serializers.CharField(source='circuit.notes_decision', read_only=True, default='')

    def get_demandeur_nom(self, obj):
        u = obj.demandeur
        return f"{u.first_name} {u.last_name}".strip() or u.username

    class Meta:
        model = ExpressionBesoin
        fields = '__all__'

class ValidationCircuitSerializer(serializers.ModelSerializer):
    eglise_nom = serializers.CharField(source='besoin.eglise.nom', read_only=True)
    demandeur_nom = serializers.SerializerMethodField()
    etape_actuelle = serializers.CharField()

    def get_demandeur_nom(self, obj):
        u = obj.besoin.demandeur
        return f"{u.first_name} {u.last_name}".strip() or u.username

    class Meta:
        model = ValidationCircuit
        fields = '__all__'

# Sérialiseurs pour la Phase 6
class FormationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Formation
        fields = '__all__'

class DemandeFormationSerializer(serializers.ModelSerializer):
    eglise_nom = serializers.CharField(source='eglise.nom', read_only=True)
    demandeur_nom = serializers.SerializerMethodField()
    formation_titre = serializers.CharField(source='formation.titre', read_only=True)

    def get_demandeur_nom(self, obj):
        u = obj.demandeur
        return f"{u.first_name} {u.last_name}".strip() or u.username

    class Meta:
        model = DemandeFormation
        fields = '__all__'

class SessionFormationSerializer(serializers.ModelSerializer):
    formation_titre = serializers.CharField(source='formation.titre', read_only=True)
    participants_count = serializers.IntegerField(source='participants_inscrits.count', read_only=True)

    class Meta:
        model = SessionFormation
        fields = '__all__'

class ChronogrammeTemplateSerializer(serializers.ModelSerializer):
    cree_par_nom = serializers.CharField(source='cree_par.get_full_name', read_only=True)

    class Meta:
        model = ChronogrammeTemplate
        fields = '__all__'
        read_only_fields = ['cree_par']
