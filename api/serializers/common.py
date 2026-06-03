from rest_framework import serializers
from logistque.models import Region, Ville, Eglise
from accounts.models import CustomUser

class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = '__all__'

class VilleSerializer(serializers.ModelSerializer):
    region_details = RegionSerializer(source='region', read_only=True)
    
    class Meta:
        model = Ville
        fields = '__all__'

class EgliseSerializer(serializers.ModelSerializer):
    ville_details = VilleSerializer(source='ville', read_only=True)
    
    class Meta:
        model = Eglise
        fields = '__all__'


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = CustomUser
        fields = ['email', 'phone', 'first_name', 'last_name', 'password', 'password_confirm', 'role', 'eglise', 'pole', 'section', 'accept_terms']
    
    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        return attrs
    
    def create(self, validated_data):
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            phone=validated_data.get('phone'),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'membre'),
            eglise=validated_data.get('eglise'),
            pole=validated_data.get('pole'),
            section=validated_data.get('section'),
            accept_terms=validated_data.get('accept_terms', False),
            validation_status='pending'
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'phone', 'first_name', 'last_name', 'role', 'eglise', 'is_staff']
        read_only_fields = ['id']
