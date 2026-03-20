from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from django.db.models import Q
from .models import Materiel, CategorieMateriel, SousCategorieMateriel
import json
from django.core.files.uploadedfile import InMemoryUploadedFile
import os
from django.conf import settings

User = get_user_model()

@method_decorator(csrf_exempt, name='dispatch')
class MaterielCreateAPIView(View):
    def post(self, request):
        try:
            user = request.user
            
            if not user.is_authenticated:
                return JsonResponse({
                    'success': False,
                    'message': 'Utilisateur non authentifié'
                }, status=401)
            
            # Vérifier les permissions
            if not user.has_perm('logistque.add_materiel'):
                return JsonResponse({
                    'success': False,
                    'message': 'Permission refusée. Vous n\'avez pas les droits pour créer du matériel.',
                    'requires_permission': True
                }, status=403)
            
            data = json.loads(request.body)
            
            # Validation des champs requis
            required_fields = ['nom', 'quantite', 'categorie']
            for field in required_fields:
                if not data.get(field):
                    return JsonResponse({
                        'success': False,
                        'message': f'Le champ {field} est requis'
                    }, status=400)
            
            # Création du matériel
            materiel = Materiel.objects.create(
                nom=data['nom'],
                quantite=int(data['quantite']),
                description=data.get('description', ''),
                categorie_id=data['categorie'],
                sous_categorie_id=data.get('sous_categorie'),
                eglise_id=data.get('eglise'),
                logistique_id=data.get('logistique')
            )
            
            # Gérer l'image si fournie
            if 'image' in request.FILES:
                image = request.FILES['image']
                materiel.image.save(image.name, image)
            
            return JsonResponse({
                'success': True,
                'message': 'Matériel créé avec succès',
                'data': {
                    'id': materiel.id,
                    'nom': materiel.nom,
                    'quantite': materiel.quantite,
                    'created_at': materiel.created_at.isoformat()
                }
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Format de données invalide'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Erreur serveur: {str(e)}'
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class MaterielUpdateAPIView(View):
    def put(self, request, materiel_id):
        try:
            user = request.user
            
            if not user.is_authenticated:
                return JsonResponse({
                    'success': False,
                    'message': 'Utilisateur non authentifié'
                }, status=401)
            
            # Vérifier les permissions
            if not user.has_perm('logistque.change_materiel'):
                return JsonResponse({
                    'success': False,
                    'message': 'Permission refusée. Vous n\'avez pas les droits pour modifier du matériel.',
                    'requires_permission': True
                }, status=403)
            
            materiel = Materiel.objects.get(id=materiel_id)
            data = json.loads(request.body)
            
            # Mise à jour des champs
            if 'nom' in data:
                materiel.nom = data['nom']
            if 'quantite' in data:
                materiel.quantite = int(data['quantite'])
            if 'description' in data:
                materiel.description = data['description']
            if 'categorie' in data:
                materiel.categorie_id = data['categorie']
            if 'sous_categorie' in data:
                materiel.sous_categorie_id = data['sous_categorie']
            if 'eglise' in data:
                materiel.eglise_id = data['eglise']
            if 'logistique' in data:
                materiel.logistique_id = data['logistique']
            
            materiel.save()
            
            # Gérer l'image si fournie
            if 'image' in request.FILES:
                image = request.FILES['image']
                materiel.image.save(image.name, image)
            
            return JsonResponse({
                'success': True,
                'message': 'Matériel mis à jour avec succès',
                'data': {
                    'id': materiel.id,
                    'nom': materiel.nom,
                    'quantite': materiel.quantite,
                    'updated_at': materiel.updated_at.isoformat() if hasattr(materiel, 'updated_at') else materiel.created_at.isoformat()
                }
            })
            
        except Materiel.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Matériel non trouvé'
            }, status=404)
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Format de données invalide'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Erreur serveur: {str(e)}'
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class MaterielDeleteAPIView(View):
    def delete(self, request, materiel_id):
        try:
            user = request.user
            
            if not user.is_authenticated:
                return JsonResponse({
                    'success': False,
                    'message': 'Utilisateur non authentifié'
                }, status=401)
            
            # Vérifier les permissions
            if not user.has_perm('logistque.delete_materiel'):
                return JsonResponse({
                    'success': False,
                    'message': 'Permission refusée. Vous n\'avez pas les droits pour supprimer du matériel.',
                    'requires_permission': True
                }, status=403)
            
            materiel = Materiel.objects.get(id=materiel_id)
            
            # Marquer comme supprimé (soft delete)
            materiel.is_deleted = True
            materiel.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Matériel supprimé avec succès',
                'data': {
                    'id': materiel.id,
                    'nom': materiel.nom,
                    'deleted_at': materiel.updated_at.isoformat() if hasattr(materiel, 'updated_at') else materiel.created_at.isoformat()
                }
            })
            
        except Materiel.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Matériel non trouvé'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Erreur serveur: {str(e)}'
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class MaterielRestoreAPIView(View):
    def post(self, request, materiel_id):
        try:
            user = request.user
            
            if not user.is_authenticated:
                return JsonResponse({
                    'success': False,
                    'message': 'Utilisateur non authentifié'
                }, status=401)
            
            # Vérifier les permissions
            if not user.has_perm('logistque.change_materiel'):
                return JsonResponse({
                    'success': False,
                    'message': 'Permission refusée. Vous n\'avez pas les droits pour restaurer du matériel.',
                    'requires_permission': True
                }, status=403)
            
            materiel = Materiel.objects.get(id=materiel_id, is_deleted=True)
            
            # Restaurer le matériel
            materiel.is_deleted = False
            materiel.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Matériel restauré avec succès',
                'data': {
                    'id': materiel.id,
                    'nom': materiel.nom,
                    'restored_at': materiel.updated_at.isoformat() if hasattr(materiel, 'updated_at') else materiel.created_at.isoformat()
                }
            })
            
        except Materiel.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Matériel non trouvé ou déjà restauré'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Erreur serveur: {str(e)}'
            }, status=500)
