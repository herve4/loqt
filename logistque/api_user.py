from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from accounts.serializers import UserSerializer
from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return

class CurrentUserAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication, SessionAuthentication]
    
    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response({
            'user': serializer.data
        })

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({
                'user': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
