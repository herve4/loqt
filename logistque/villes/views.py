import logging
from django.views.generic import ListView, View
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from logistque.models import Eglise
from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views.decorators.http import require_http_methods
from django.db import transaction
import pandas as pd
import tempfile
import os
from logistque.models import Ville, Region
from logistque.villes.exports.export_utils import *

# Configuration du logger
logger = logging.getLogger(__name__)

class VilleListView(LoginRequiredMixin, ListView):
    model = Ville
    template_name = 'villes/ville_lists.html'
    context_object_name = 'villes'
    paginate_by = 10

    def get_queryset(self):
        queryset = super().get_queryset().select_related('region').order_by('-id')
        self.region_id = self.request.GET.get('region')
        
        if self.region_id:
            queryset = queryset.filter(region_id=self.region_id).order_by('-id')
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['regions'] = Region.objects.all().order_by('-id')
        context['selected_region'] = self.region_id
        return context

    def render_to_response(self, context, **response_kwargs):
        export_format = self.request.GET.get('export')
        if export_format:
            villes = self.get_queryset()
            if export_format == 'pdf':
                response = HttpResponse(content_type='application/pdf')
                response['Content-Disposition'] = 'attachment; filename="villes.pdf"'
                buffer = export_villes_to_pdf(villes)
                response.write(buffer.getvalue())
                return response
            elif export_format == 'excel':
                response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                response['Content-Disposition'] = 'attachment; filename="villes.xlsx"'
                buffer = export_villes_to_excel(villes)
                response.write(buffer.getvalue())
                return response
            elif export_format == 'word':
                response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
                response['Content-Disposition'] = 'attachment; filename="villes.docx"'
                buffer = export_villes_to_word(villes)
                response.write(buffer.getvalue())
                return response
        return super().render_to_response(context, **response_kwargs)

class RegionListView(LoginRequiredMixin, ListView):
    model = Region
    template_name = 'villes/region_list.html'
    context_object_name = 'regions'
    paginate_by = 10
    ordering = ['-id']  # Tri par défaut
    partial_template_name = 'villes/partials/region_table.html'  # Template pour les requêtes HTMX

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Récupération des paramètres de recherche et de tri
        self.search_query = self.request.GET.get('q')
        self.sort_field = self.request.GET.get('sort', 'id')
        self.sort_order = self.request.GET.get('order', 'desc')
        
        # Filtrage par nom
        if self.search_query:
            queryset = queryset.filter(nom__icontains=self.search_query)
        
        # Tri
        if self.sort_field:
            if self.sort_order == 'desc' and not self.sort_field.startswith('-'):
                sort_field = f'-{self.sort_field}'
            else:
                sort_field = self.sort_field
            queryset = queryset.order_by(sort_field)
            
        return queryset
        
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        from django.db.models import Count, Avg, Q, F
        from datetime import datetime, timedelta
        
        # Récupération des paramètres de l'URL
        context['search_query'] = self.search_query or ''
        context['sort_field'] = self.sort_field
        
        # Statistiques globales
        total_regions = Region.objects.count()
        context['total_regions'] = total_regions
        
        # Calcul des statistiques avancées
        regions = Region.objects.annotate(ville_count=Count('ville'))
        
        # Nombre total de villes et moyenne par région
        total_villes = sum(region.ville_count for region in regions)
        avg_villes_per_region = regions.aggregate(avg=Avg('ville_count'))['avg'] or 0
        
        # Nombre total d'églises et moyenne par ville
        total_eglises = Eglise.objects.count()
        villes_avec_eglises = Ville.objects.annotate(
            eglise_count=Count('ville_eglise', distinct=True)
        )
        avg_eglises_per_ville = villes_avec_eglises.aggregate(avg=Avg('eglise_count'))['avg'] or 0
        
        # Nouvelles régions du mois dernier
        last_month = datetime.now() - timedelta(days=30)
        last_month_regions = Region.objects.filter(created_at__gte=last_month).count()
        
        # Calcul de l'évolution
        previous_month = last_month - timedelta(days=30)
        previous_month_regions = Region.objects.filter(
            created_at__gte=previous_month,
            created_at__lt=last_month
        ).count()
        
        if previous_month_regions > 0:
            region_growth = round(((last_month_regions - previous_month_regions) / previous_month_regions) * 100, 1)
        else:
            region_growth = 0
        
        # Ajout des statistiques au contexte
        context.update({
            'total_villes': total_villes,
            'avg_villes_per_region': round(avg_villes_per_region, 1),
            'total_eglises': total_eglises,
            'avg_eglises_per_ville': round(avg_eglises_per_ville, 1),
            'last_month_regions': last_month_regions,
            'region_growth': region_growth,
            'active_regions': regions.filter(ville_count__gt=0).count()
        })
        context['sort_order'] = self.sort_order
        context['total_regions'] = self.get_queryset().count()
        
        # Pour les requêtes HTMX, on change le template pour n'avoir que le contenu du tableau
        if self.request.htmx:
            self.template_name = self.partial_template_name
            
        return context
        
    def get(self, request, *args, **kwargs):
        # Vérifie si c'est une requête HTMX
        if request.htmx:
            self.object_list = self.get_queryset()
            context = self.get_context_data()
            return self.render_to_response(context)
        return super().get(request, *args, **kwargs)
        
    def render_to_response(self, context, **response_kwargs):
        # Gestion de l'exportation
        export_format = self.request.GET.get('export')
        if export_format:
            regions = self.get_queryset()
            
            # Préparer les données pour l'export
            data = []
            for region in regions:
                data.append({
                    'ID': region.id,
                    'Nom': region.nom,
                    'Date de création': region.created_at.strftime('%d/%m/%Y %H:%M') if region.created_at else '',
                    'Nombre de villes': region.ville_set.count()
                })
            
            if export_format == 'excel':
                import pandas as pd
                from io import BytesIO
                
                # Créer un DataFrame pandas
                df = pd.DataFrame(data)
                
                # Créer un fichier Excel en mémoire
                output = BytesIO()
                with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
                    df.to_excel(writer, index=False, sheet_name='Régions')
                    
                    # Formater les colonnes
                    worksheet = writer.sheets['Régions']
                    for i, col in enumerate(df.columns):
                        # Ajuster la largeur de la colonne
                        max_length = max(df[col].astype(str).apply(len).max(), len(col)) + 2
                        worksheet.set_column(i, i, max_length)
                
                # Préparer la réponse
                output.seek(0)
                response = HttpResponse(
                    output.getvalue(),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = 'attachment; filename="regions.xlsx"'
                return response
                
            elif export_format == 'csv':
                import csv
                from io import StringIO
                
                # Créer un fichier CSV en mémoire
                output = StringIO()
                writer = csv.DictWriter(output, fieldnames=data[0].keys() if data else [])
                writer.writeheader()
                writer.writerows(data)
                
                # Préparer la réponse
                response = HttpResponse(
                    output.getvalue(),
                    content_type='text/csv; charset=utf-8-sig'  # Utilisation de utf-8-sig pour Excel
                )
                response['Content-Disposition'] = 'attachment; filename="regions.csv"'
                return response
                
            elif export_format == 'json':
                import json
                from django.core.serializers.json import DjangoJSONEncoder
                
                response = HttpResponse(
                    json.dumps(data, indent=2, ensure_ascii=False, cls=DjangoJSONEncoder),
                    content_type='application/json; charset=utf-8'
                )
                response['Content-Disposition'] = 'attachment; filename="regions.json"'
                return response
        
        # Si c'est une requête HTMX, retourner uniquement le tableau
        if self.request.headers.get('HX-Request'):
            return render(self.request, 'villes/partials/region_table.html', context)
                
        return super().render_to_response(context, **response_kwargs)

class RegionCreateView(LoginRequiredMixin, CreateView):
    model = Region
    fields = ['nom']
    template_name = 'villes/region_form.html'
    success_url = reverse_lazy('region-list')
    
    def form_valid(self, form):
        try:
            self.object = form.save(commit=False)
            self.object.save()
            logger.info(f"Région créée avec succès: {self.object}")
            
            if self.request.headers.get('HX-Request'):
                try:
                    # Vérifier que l'objet a bien un ID avant de le passer au template
                    if not hasattr(self.object, 'id') or not self.object.id:
                        logger.error("L'objet région n'a pas d'ID après sauvegarde")
                        return JsonResponse({
                            'success': False,
                            'message': 'Erreur lors de la création de la région: ID manquant.'
                        }, status=500)
                    
                    # Récupérer le template
                    template = 'villes/partials/region_row.html'
                    
                    # Préparer le contexte
                    context = {
                        'region': self.object,
                        'hide_actions': False
                    }
                    logger.debug(f"Contexte envoyé au template: {context}")
                    
                    # Rendre le template avec le contexte
                    html = render_to_string(template, context, request=self.request)
                    
                    # Retourner une réponse JSON avec le HTML et les données
                    return JsonResponse({
                        'success': True,
                        'html': html,
                        'message': 'Région créée avec succès!',
                        'region_id': self.object.id
                    })
                    
                except Exception as e:
                    logger.error(f"Erreur lors du rendu de la réponse HTMX: {str(e)}", exc_info=True)
                    return JsonResponse({
                        'success': False,
                        'message': f'Erreur lors de la création de la région: {str(e)}',
                        'error': str(e)
                    }, status=500)
            
            # Si ce n'est pas une requête HTMX, rediriger normalement
            messages.success(self.request, 'Région créée avec succès!')
            return redirect(self.get_success_url())
            
        except Exception as e:
            logger.error(f"Erreur lors de la création de la région: {str(e)}", exc_info=True)
            if self.request.headers.get('HX-Request'):
                return JsonResponse({
                    'success': False,
                    'message': f"Une erreur est survenue: {str(e)}",
                    'error': str(e)
                }, status=500)
            messages.error(self.request, f"Erreur lors de la création de la région: {str(e)}")
            return self.form_invalid(form)
    
    def form_invalid(self, form):
        logger.warning(f"Formulaire invalide: {form.errors}")
        if self.request.headers.get('HX-Request'):
            # Renvoyer les erreurs de formulaire pour affichage
            return JsonResponse({
                'success': False,
                'errors': form.errors.get_json_data(),
                'message': 'Veuillez corriger les erreurs ci-dessous.'
            }, status=400)
            
        return super().form_invalid(form)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['is_htmx'] = self.request.headers.get('HX-Request', False)
        return context

class RegionUpdateView(LoginRequiredMixin, UpdateView):
    model = Region
    fields = ['nom']
    template_name = 'villes/region_form.html'
    success_url = reverse_lazy('region-list')

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        if request.headers.get('HX-Request'):
            # Rendre uniquement le formulaire pour les requêtes HTMX
            return self.render_to_response(self.get_context_data())
        return super().get(request, *args, **kwargs)

    def form_valid(self, form):
        response = super().form_valid(form)
        if self.request.headers.get('HX-Request'):
            # Rendre la ligne mise à jour
            template = 'villes/partials/region_row.html'
            context = {
                'region': self.object,
                'hide_actions': False
            }
            html = render_to_string(template, context, request=self.request)
            return JsonResponse({
                'success': True,
                'html': html,
                'message': 'Région mise à jour avec succès!',
                'region': {
                    'id': self.object.id,
                    'nom': self.object.nom
                }
            })
        return response

@method_decorator(csrf_exempt, name='dispatch')
class RegionDeleteView(LoginRequiredMixin, DeleteView):
    model = Region
    success_url = reverse_lazy('region-list')
    template_name = 'villes/region_confirm_delete.html'

    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.delete()

        if request.headers.get('HX-Request'):
            return HttpResponse(status=204)
        return super().delete(request, *args, **kwargs)
        
    def form_valid(self, form):
        success_url = self.get_success_url()
        self.object.delete()
        
        if self.request.headers.get('HX-Request'):
            return HttpResponse(
                status=200,
                headers={
                    'HX-Redirect': str(success_url)
                }
            )
        return redirect(success_url)

    def get(self, request, *args, **kwargs):
        # Pour la confirmation de suppression HTMX
        if request.headers.get('HX-Request'):
            region = self.get_object()
            return render(request, 'villes/region_confirm_delete.html', {'region': region})
        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        # Gère les soumissions de formulaire normales et HTMX
        if request.headers.get('HX-Request'):
            return self.delete(request, *args, **kwargs)
        return super().post(request, *args, **kwargs)

class VilleCreateView(LoginRequiredMixin, CreateView):
    model = Ville
    fields = ['nom', 'region']
    template_name = 'villes/ville_form.html'  # Assurez-vous que ce template existe
    success_url = reverse_lazy('ville-list')  # Redirection après succès

    def form_valid(self, form):
        response = super().form_valid(form)
        if self.request.headers.get('HX-Request'):  # Pour les requêtes HTMX
            return HttpResponse(
                status=204,
                headers={
                    'HX-Trigger': 'villeAdded',
                    'HX-Redirect': str(self.success_url)
                }
            )
        return response

class VilleUpdateView(LoginRequiredMixin, UpdateView):
    model = Ville
    fields = ['nom', 'region']
    template_name = 'villes/ville_form.html'

    def form_valid(self, form):
        response = super().form_valid(form)
        if self.request.headers.get('HX-Request'):
            return JsonResponse({
                'success': True,
                'ville': {
                    'id': self.object.id,
                    'nom': self.object.nom,
                    'region': self.object.region.nom
                }
            })
            # return HttpResponse(
            #     status=204,
            #     headers={
            #         'HX-Trigger': 'villeUpdated'
            #     }
            # )
        return response
@method_decorator(csrf_exempt, name='dispatch')
class VilleDeleteView(LoginRequiredMixin, DeleteView):
    model = Ville
    success_url = reverse_lazy('ville-list')
    
    def delete(self, request, *args, **kwargs):
        self.object = self.get_object()
        success_url = self.get_success_url()
        self.object.delete()
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'redirect': str(success_url)})
        return redirect(success_url)


class RegionSearchView(LoginRequiredMixin, View):
    """Vue pour la recherche de régions"""
    
    def get(self, request, *args, **kwargs):
        query = request.GET.get('q', '').strip()
        regions = Region.objects.all()
        
        if query:
            regions = regions.filter(nom__icontains=query)
        
        return render(request, 'villes/partials/region_list_rows.html', {
            'regions': regions,
            'is_search': bool(query)
        })


class RegionImportView(LoginRequiredMixin, View):
    """Vue pour l'importation de régions depuis un fichier Excel ou CSV"""
    
    def post(self, request, *args, **kwargs):
        try:
            if 'file' not in request.FILES:
                return JsonResponse({'success': False, 'message': 'Aucun fichier fourni'}, status=400)
            
            uploaded_file = request.FILES['file']
            update_existing = request.POST.get('update_existing') == 'on'
            
            # Vérifier l'extension du fichier
            file_extension = os.path.splitext(uploaded_file.name)[1].lower()
            if file_extension not in ['.xlsx', '.xls', '.csv']:
                return JsonResponse({
                    'success': False,
                    'message': 'Format de fichier non supporté. Utilisez un fichier Excel (.xlsx, .xls) ou CSV (.csv).'
                }, status=400)
            
            # Sauvegarder le fichier temporairement
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)
                temp_file_path = temp_file.name
            
            try:
                # Lire le fichier avec pandas
                if file_extension == '.csv':
                    df = pd.read_csv(temp_file_path)
                else:  # .xlsx ou .xls
                    df = pd.read_excel(temp_file_path)
                
                # Vérifier les colonnes requises
                required_columns = ['nom']
                missing_columns = [col for col in required_columns if col not in df.columns]
                
                if missing_columns:
                    return JsonResponse({
                        'success': False,
                        'message': f'Colonnes manquantes dans le fichier : {", ".join(missing_columns)}'
                    }, status=400)
                
                # Nettoyer les données
                df = df.dropna(subset=['nom'])  # Supprimer les lignes sans nom
                df['nom'] = df['nom'].str.strip()
                
                # Compter les régions importées
                imported_count = 0
                
                # Démarrer une transaction pour assurer l'intégrité des données
                with transaction.atomic():
                    for _, row in df.iterrows():
                        nom = row['nom']
                        
                        # Vérifier si la région existe déjà
                        if update_existing:
                            Region.objects.update_or_create(
                                nom=nom,
                                defaults={'nom': nom}
                            )
                        else:
                            # Vérifier si la région existe déjà
                            if not Region.objects.filter(nom=nom).exists():
                                Region.objects.create(nom=nom)
                                imported_count += 1
                
                # Si on est en mode mise à jour, on considère toutes les lignes comme importées
                if update_existing:
                    imported_count = len(df)
                
                return JsonResponse({
                    'success': True,
                    'message': f'Import réussi : {imported_count} région(s) importée(s)',
                    'imported': imported_count
                })
                
            except Exception as e:
                logger.error(f"Erreur lors de l'importation du fichier : {str(e)}", exc_info=True)
                return JsonResponse({
                    'success': False,
                    'message': f'Erreur lors de la lecture du fichier : {str(e)}'
                }, status=500)
                
            finally:
                # Nettoyer le fichier temporaire
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    logger.error(f"Erreur lors de la suppression du fichier temporaire : {str(e)}")
                    
        except Exception as e:
            logger.error(f"Erreur inattendue lors de l'importation : {str(e)}", exc_info=True)
            return JsonResponse({
                'success': False,
                'message': f'Une erreur inattendue est survenue : {str(e)}'
            }, status=500)
            
            
def region_edit(request, pk):
    region = Region.objects.get(pk=pk)
    if request.method == 'POST':
        region.nom = request.POST['nom']
        region.save()
        return redirect('region-list')
    return render(request, 'villes/partials/region_table.html', {'region': region})