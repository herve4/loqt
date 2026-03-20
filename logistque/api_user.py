from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from accounts.serializers import UserSerializer

class CurrentUserAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response({
            'user': serializer.data
        })
