from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

class PasswordResetRequestAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'message': 'L\'adresse email est requise.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Pour des raisons de sécurité, on ne dit pas si l'email existe ou non
            return Response({'message': 'Si cet email correspond à un compte, un lien de réinitialisation a été envoyé.'})

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"

        subject = "Réinitialisation de votre mot de passe - SGL-CI"
        message = f"Bonjour {user.first_name},\n\nVous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur le lien ci-dessous pour choisir un nouveau mot de passe :\n\n{reset_url}\n\nSi vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.\n\nCordialement,\nL'équipe SGL-CI"
        
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            return Response({'message': 'Si cet email correspond à un compte, un lien de réinitialisation a été envoyé.'})
        except Exception:
            return Response({'message': 'Erreur lors de l\'envoi de l\'email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetConfirmAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('password')

        if not all([uidb64, token, new_password]):
            return Response({'message': 'Tous les champs sont requis.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Votre mot de passe a été réinitialisé avec succès.'})
        else:
            return Response({'message': 'Le lien de réinitialisation est invalide ou a expiré.'}, status=status.HTTP_400_BAD_REQUEST)
