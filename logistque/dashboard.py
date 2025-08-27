from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render


from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Count
from .models import Materiel, Eglise, Evenement

# @staff_member_required
# def admin_dashboard(request):
#     context = {
#         'total_materiels': Materiel.objects.count(),
#         'eglises': Eglise.objects.count(),
#         'evenements': Evenement.objects.filter(statut="en_attente").count(),
#     }
#     return render(request, 'admin/dashboard.html', context)




