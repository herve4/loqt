from rest_framework import serializers
from accounts.models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'phone', 'first_name', 'last_name', 'role', 'eglise', 'pole', 'image', 'accept_terms', 'onboarding_completed']
        read_only_fields = ['id']
