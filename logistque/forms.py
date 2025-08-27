from django import forms
from .models import *

class DemandePermissionForm(forms.ModelForm):
    class Meta:
        model = DemandePermission
        fields = ['raison']
        widgets = {
            'raison': forms.Textarea(attrs={'placeholder': 'Expliquez pourquoi vous avez besoin de cette permission', 'rows': 3})
        }
        

from django import forms
from django.forms import inlineformset_factory, modelformset_factory
from .models import Materiel, MaterielImage

# class MaterielForm(forms.ModelForm):
#     class Meta:
#         model = Materiel
#         exclude = ('slug', 'qr_code', 'code_barre', 'is_deleted')
#         widgets = {
#             'nom': forms.TextInput(attrs={'class': 'form-control'}),
#             'quantite': forms.NumberInput(attrs={'class': 'form-control'}),
#             'image': forms.ClearableFileInput(attrs={'class': 'form-control'}),
#             'categorie': forms.Select(attrs={'class': 'form-control'}),
#             'sous_categorie': forms.Select(attrs={'class': 'form-control'}),
#             'logistique': forms.Select(attrs={'class': 'form-control'}),
#             'eglise': forms.Select(attrs={'class': 'form-control'}),
#         }
        

class MaterielForm(forms.ModelForm):
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)  # Récupérer l'utilisateur connecté
        super(MaterielForm, self).__init__(*args, **kwargs)
        
        # Si l'utilisateur est connecté et a une église associée
        if user and user.eglise:
            self.fields['eglise'].initial = user.eglise
            self.fields['eglise'].queryset = Eglise.objects.filter(pk=user.eglise.pk)
            
        # Limiter les sous-catégories si une catégorie est déjà sélectionnée
        if 'categorie' in self.data:
            try:
                categorie_id = int(self.data.get('categorie'))
                self.fields['sous_categorie'].queryset = SousCategorieMateriel.objects.filter(categorie_id=categorie_id)
            except (ValueError, TypeError):
                pass
        elif self.instance.pk and self.instance.categorie:
            self.fields['sous_categorie'].queryset = self.instance.categorie.sous_categories.all()
    class Meta:
        model = Materiel
        exclude = ('slug', 'qr_code', 'code_barre', 'is_deleted')
        widgets = {
            'nom': forms.TextInput(attrs={'class': 'form-control'}),
            'quantite': forms.NumberInput(attrs={'class': 'form-control'}),
            'image': forms.ClearableFileInput(attrs={'class': 'form-control'}),
            'categorie': forms.Select(attrs={'class': 'form-control', 'onchange': "getSousCategories()"}),
            'sous_categorie': forms.Select(attrs={'class': 'form-control'}),
            'logistique': forms.Select(attrs={'class': 'form-control'}),
            'eglise': forms.Select(attrs={'class': 'form-control', 'disabled': 'disabled'}),
        }

    

class MaterielImageForm(forms.ModelForm):
    class Meta:
        model = MaterielImage
        fields = ['image', 'description']
        widgets = {
            'image': forms.ClearableFileInput(attrs={'class': 'form-control'}),
            'description': forms.TextInput(attrs={'class': 'form-control'}),
        }

MaterielImageFormSet = modelformset_factory(
    MaterielImage,
    fields=('image', 'description'),
    extra=5,  # nombre d'images par défaut
    can_delete=True
)



