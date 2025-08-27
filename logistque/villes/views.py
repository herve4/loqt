from django.views.generic import ListView
from django.views.generic.edit import CreateView, UpdateView, DeleteView
from django.urls import reverse_lazy
from django.http import HttpResponse, HttpResponseForbidden, JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from logistque.models import Ville, Region
from logistque.villes.exports.export_utils import *

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
    
    def post(self, request, *args, **kwargs):
        # Créez une instance de VilleCreateView et appelez son post
        return VilleCreateView.as_view()(request)

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
        self.object.delete()

        if request.headers.get('HX-Request'):
            return HttpResponse(status=204)
        return super().delete(request, *args, **kwargs)