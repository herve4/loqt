from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
import json

User = get_user_model()

@method_decorator(csrf_exempt, name='dispatch')
class PermissionRequestAPIView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            user = request.user
            
            if not user.is_authenticated:
                return JsonResponse({
                    'success': False,
                    'message': 'Utilisateur non authentifié'
                }, status=401)
            
            reason = data.get('reason', '')
            action_type = data.get('action_type', 'create')  # create, update, delete
            materiel_id = data.get('materiel_id', None)
            
            if not reason:
                return JsonResponse({
                    'success': False,
                    'message': 'La raison est requise'
                }, status=400)
            
            # Créer la demande de permission
            from .models import PermissionRequest
            
            permission_request = PermissionRequest.objects.create(
                user=user,
                reason=reason,
                action_type=action_type,
                materiel_id=materiel_id,
                status='pending'
            )
            
            # Envoyer email aux administrateurs
            self.send_notification_email(permission_request)
            
            return JsonResponse({
                'success': True,
                'message': 'Demande de permission envoyée avec succès',
                'request_id': permission_request.id
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Format de données invalide'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Erreur lors de la demande: {str(e)}'
            }, status=500)
    
    def send_notification_email(self, permission_request):
        try:
            subject = f"Nouvelle demande de permission - {permission_request.user.get_full_name()}"
            
            context = {
                'user': permission_request.user,
                'reason': permission_request.reason,
                'action_type': permission_request.action_type,
                'materiel_id': permission_request.materiel_id,
                'request_date': permission_request.created_at,
            }
            
            html_message = render_to_string('emails/permission_request.html', context)
            text_message = render_to_string('emails/permission_request.txt', context)
            
            # Envoyer aux administrateurs
            admin_users = User.objects.filter(is_staff=True)
            admin_emails = [admin.email for admin in admin_users if admin.email]
            
            if admin_emails:
                send_mail(
                    subject=subject,
                    message=text_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=admin_emails,
                    html_message=html_message,
                    fail_silently=False
                )
        except Exception as e:
            print(f"Erreur envoi email: {e}")

@method_decorator(csrf_exempt, name='dispatch')
class PermissionStatusAPIView(View):
    def get(self, request):
        try:
            user = request.user
            
            if not user.is_authenticated:
                return JsonResponse({
                    'success': False,
                    'message': 'Utilisateur non authentifié'
                }, status=401)
            
            # Récupérer le statut des permissions de l'utilisateur
            from .models import PermissionRequest
            
            latest_request = PermissionRequest.objects.filter(
                user=user
            ).order_by('-created_at').first()
            
            if latest_request:
                return JsonResponse({
                    'success': True,
                    'status': latest_request.status,
                    'request_date': latest_request.created_at.isoformat(),
                    'reason': latest_request.reason,
                    'action_type': latest_request.action_type
                })
            else:
                return JsonResponse({
                    'success': True,
                    'status': 'none',
                    'message': 'Aucune demande de permission trouvée'
                })
                
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Erreur: {str(e)}'
            }, status=500)
