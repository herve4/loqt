from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate, login, logout, get_user_model
from accounts.serializers import UserSerializer
from rest_framework.authentication import SessionAuthentication
import random
from django.core.mail import send_mail
from django.conf import settings
from accounts.models import EmailVerification
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return

User = get_user_model()

class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication, SessionAuthentication]
    
    def post(self, request):
        identifiant = request.data.get('user')
        password = request.data.get('password')
        remember = request.data.get('remember_me', False)
        
        if not identifiant or not password:
            return Response({'message': 'Identifiant et mot de passe requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=identifiant)
        except User.DoesNotExist:
            try:
                user = User.objects.get(phone=identifiant)
            except User.DoesNotExist:
                user = None

        if user:
            user = authenticate(request, username=user, password=password)
            if user:
                login(request, user)
                if not remember:
                    request.session.set_expiry(0)
                return Response({
                    'message': 'Connexion réussie',
                    'user': UserSerializer(user, context={'request': request}).data
                })
        
        return Response({'message': 'Identifiants incorrects'}, status=status.HTTP_401_UNAUTHORIZED)

class SendVerificationCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication, SessionAuthentication]
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'message': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        verification, created = EmailVerification.objects.update_or_create(
            email=email,
            defaults={'code': code, 'is_verified': False}
        )
        
        try:
            send_mail(
                'Votre code de sécurité SGL-CI',
                f'Votre code de vérification est : {code}',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            return Response({'message': 'Code envoyé avec succès'})
        except Exception as e:
            return Response({'message': f"Erreur lors de l'envoi : {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyCodeView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication, SessionAuthentication]
    
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        if not email or not code:
            return Response({'message': 'Email et code requis'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            verification = EmailVerification.objects.get(email=email, code=code)
            verification.is_verified = True
            verification.save()
            return Response({'message': 'Email vérifié avec succès'})
        except EmailVerification.DoesNotExist:
            return Response({'message': 'Code incorrect ou expiré'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication, SessionAuthentication]
    
    def post(self, request):
        logout(request)
        return Response({'message': 'Déconnexion réussie'})

class RegisterAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication, SessionAuthentication]
    
    def post(self, request):
        email = request.data.get('email')
        try:
            verification = EmailVerification.objects.get(email=email, is_verified=True)
        except EmailVerification.DoesNotExist:
            return Response({'message': "Veuillez d'abord vérifier votre adresse email."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user_data = serializer.validated_data
            password = request.data.get('password')
            user = User.objects.create_user(
                email=user_data.get('email'),
                phone=user_data.get('phone'),
                password=password,
                first_name=user_data.get('first_name', ''),
                last_name=user_data.get('last_name', ''),
                eglise=user_data.get('eglise'),
                pole=user_data.get('pole'),
                accept_terms=user_data.get('accept_terms', False),
                role=request.data.get('role', 'technicien')
            )
            verification.delete()
            login(request, user)
            return Response({
                'message': 'Inscription réussie',
                'user': UserSerializer(user, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication, SessionAuthentication]
    
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'message': 'Jeton Google requis'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
            # Verify Google ID Token
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
            
            # Check issuer
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                return Response({'message': 'Émetteur du jeton invalide'}, status=status.HTTP_400_BAD_REQUEST)
                
            email = idinfo.get('email')
            first_name = idinfo.get('given_name', '')
            last_name = idinfo.get('family_name', '')
            
            if not email:
                return Response({'message': 'Adresse e-mail Google introuvable'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Get or create CustomUser
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': 'technicien',
                    'onboarding_completed': False,
                    'accept_terms': True,
                }
            )
            
            # Set random password for new user
            if created:
                user.set_password(User.objects.make_random_password())
                user.save()
                
            # Perform session login
            login(request, user)
            
            return Response({
                'message': 'Connexion Google réussie',
                'user': UserSerializer(user, context={'request': request}).data
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response({'message': f'Jeton Google invalide : {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'message': f"Erreur lors de l'authentification Google : {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
