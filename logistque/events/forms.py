from django import forms
from logistque.models import Evenement, EvenementMateriel, ChronogrammeItem, Materiel, Eglise
from accounts.models import CustomUser
from django.utils import timezone
from datetime import timedelta




class EventForm(forms.ModelForm):
    """
    Formulaire pour la création et la mise à jour d'un événement.
    """
    date_debut = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'}),
        label="Date et heure de début"
    )
    date_fin = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'}),
        label="Date et heure de fin"
    )
    eglise = forms.ModelChoiceField(
        queryset=Eglise.objects.all(),
        required=False,
        widget=forms.Select(attrs={'class': 'form-control'}),
        label="Église concernée"
    )
    logisticiens_gestion = forms.ModelMultipleChoiceField(
        queryset=CustomUser.objects.filter(groups__name='logisticiens'),  # Assurez-vous que ce groupe existe
        widget=forms.SelectMultiple(attrs={'class': 'form-control select2'}),
        required=False,
        label="Logisticiens assignés"
    )

    class Meta:
        model = Evenement
        fields = [
            'titre', 'type_evenement', 'organisateur_type', 'organisateur_nom',
            'eglise', 'date_debut', 'date_fin', 'description', 'image',
            'logisticiens_gestion'
        ]
        widgets = {
            'titre': forms.TextInput(attrs={'class': 'form-control', 'placeholder': "Titre de l'événement"}),
            'type_evenement': forms.Select(attrs={'class': 'form-control'}),
            'organisateur_type': forms.Select(attrs={'class': 'form-control'}),
            'organisateur_nom': forms.TextInput(attrs={'class': 'form-control', 'placeholder': "Nom de l'organisateur externe"}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'image': forms.ClearableFileInput(attrs={'class': 'form-control-file'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        organisateur_type = cleaned_data.get('organisateur_type')
        eglise = cleaned_data.get('eglise')
        organisateur_nom = cleaned_data.get('organisateur_nom')

        if organisateur_type == 'eglise' and not eglise:
            self.add_error('eglise', "Une église doit être sélectionnée pour un organisateur de type 'Église'.")

        if organisateur_type == 'externe' and not organisateur_nom:
            self.add_error('organisateur_nom', "Le nom de l'organisateur est requis pour un type 'Externe'.")
        
        return cleaned_data


class EvenementMaterielForm(forms.ModelForm):
    """
    Formulaire pour ajouter du matériel à un événement.
    """
    materiel = forms.ModelChoiceField(
        queryset=Materiel.objects.filter(is_deleted=False),
        widget=forms.Select(attrs={'class': 'form-control select2'})
    )

    class Meta:
        model = EvenementMateriel
        fields = ['materiel', 'quantite']
        widgets = {
            'quantite': forms.NumberInput(attrs={'class': 'form-control', 'min': '1'}),
        }


class ChronogrammeItemForm(forms.ModelForm):
    """
    Formulaire pour un élément du chronogramme d'un événement.
    """
    heure_debut = forms.TimeField(
        widget=forms.TimeInput(attrs={'type': 'time', 'class': 'form-control'})
    )
    heure_fin = forms.TimeField(
        widget=forms.TimeInput(attrs={'type': 'time', 'class': 'form-control'})
    )

    class Meta:
        model = ChronogrammeItem
        fields = ['titre', 'description', 'heure_debut', 'heure_fin', 'responsable', 'materiels_needed']
        widgets = {
            'titre': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'responsable': forms.TextInput(attrs={'class': 'form-control'}),
            'materiels_needed': forms.SelectMultiple(attrs={'class': 'form-control select2'}),
        }
#         widget=forms.Select(attrs={'class': 'form-control'})
#     )
    
#     is_read = forms.ChoiceField(
#         label=_('Statut'),
#         choices=[
#             ('', _('Tous')),
#             ('1', _('Lu')),
#             ('0', _('Non lu'))
#         ],
#         required=False,
#         widget=forms.Select(attrs={'class': 'form-control'})
#     )
    
#     date_range = forms.ChoiceField(
#         label=_('Période'),
#         choices=[
#             ('', _('Toutes les dates')),
#             ('today', _('Aujourd\'hui')),
#             ('this_week', _('Cette semaine')),
#             ('this_month', _('Ce mois-ci')),
#             ('last_7_days', _('7 derniers jours')),
#             ('last_30_days', _('30 derniers jours')),
#             ('custom', _('Personnalisée'))
#         ],
#         required=False,
#         widget=forms.Select(attrs={'class': 'form-control'})
#     )
    
#     start_date = forms.DateField(
#         label=_('Du'),
#         required=False,
#         widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'})
#     )
    
#     end_date = forms.DateField(
#         label=_('Au'),
#         required=False,
#         widget=forms.DateInput(attrs={'type': 'date', 'class': 'form-control'})
#     )
    
#     def clean(self):
#         cleaned_data = super().clean()
#         date_range = cleaned_data.get('date_range')
#         start_date = cleaned_data.get('start_date')
#         end_date = cleaned_data.get('end_date')
        
#         if date_range == 'custom' and not (start_date and end_date):
#             raise forms.ValidationError({
#                 'start_date': _('Veuillez spécifier une période personnalisée'),
#                 'end_date': _('Veuillez spécifier une période personnalisée')
#             })
            
#         return cleaned_data
    
#     def get_filtered_queryset(self, queryset):
#         """
#         Applique les filtres du formulaire au queryset fourni
#         """
#         if not self.is_valid():
#             return queryset
            
#         # Filtre par type de notification
#         notification_type = self.cleaned_data.get('notification_type')
#         if notification_type:
#             queryset = queryset.filter(notification_type=notification_type)
            
#         # Filtre par statut de lecture
#         is_read = self.cleaned_data.get('is_read')
#         if is_read in ['0', '1']:
#             queryset = queryset.filter(is_read=bool(int(is_read)))
            
#         # Filtre par période
#         date_range = self.cleaned_data.get('date_range')
#         start_date = self.cleaned_data.get('start_date')
#         end_date = self.cleaned_data.get('end_date')
        
#         if date_range == 'today':
#             today = timezone.now().date()
#             queryset = queryset.filter(created_at__date=today)
#         elif date_range == 'this_week':
#             today = timezone.now().date()
#             start_of_week = today - timedelta(days=today.weekday())
#             queryset = queryset.filter(created_at__date__gte=start_of_week)
#         elif date_range == 'this_month':
#             today = timezone.now().date()
#             start_of_month = today.replace(day=1)
#             queryset = queryset.filter(created_at__date__gte=start_of_month)
#         elif date_range == 'last_7_days':
#             seven_days_ago = timezone.now() - timedelta(days=7)
#             queryset = queryset.filter(created_at__gte=seven_days_ago)
#         elif date_range == 'last_30_days':
#             thirty_days_ago = timezone.now() - timedelta(days=30)
#             queryset = queryset.filter(created_at__gte=thirty_days_ago)
#         elif date_range == 'custom' and start_date and end_date:
#             # Ajouter un jour à la date de fin pour inclure toute la journée
#             end_date = end_date + timedelta(days=1)
#             queryset = queryset.filter(
#                 created_at__date__gte=start_date,
#                 created_at__date__lte=end_date
#             )
            
#         return queryset




class ChronogramItemForm(forms.ModelForm):
    """
    Formulaire pour un élément du chronogramme
    """
    class Meta:
        model = ChronogrammeItem
        fields = ['titre', 'heure_debut', 'heure_fin', 'description', 'responsable']
        widgets = {
            'heure_debut': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'heure_fin': forms.TimeInput(attrs={'type': 'time'}, format='%H:%M'),
            'description': forms.Textarea(attrs={'rows': 2, 'class': 'form-control'}),
            'responsable': forms.TextInput(attrs={'class': 'form-control'}),
        }


class EventForm(forms.ModelForm):
    """
    Formulaire pour la création et la mise à jour d'événements
    """
    class Meta:
        model = Evenement
        fields = [
            'titre', 'type_evenement', 'organisateur_type', 'organisateur_nom',
            'eglise', 'date_debut', 'date_fin', 'lieu', 'description', 'image'
        ]
        widgets = {
            'date_debut': forms.DateTimeInput(attrs={'type': 'datetime-local'}, format='%Y-%m-%dT%H:%M'),
            'date_fin': forms.DateTimeInput(attrs={'type': 'datetime-local'}, format='%Y-%m-%dT%H:%M'),
            'description': forms.Textarea(attrs={'rows': 4, 'class': 'form-control'}),
        }
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Ajout des classes Bootstrap aux champs
        for field_name, field in self.fields.items():
            if field_name not in ['date_debut', 'date_fin', 'image']:
                field.widget.attrs.update({'class': 'form-control'})
        
        # Vérification de l'utilisateur et de son église
        user_has_eglise = (self.user and 
                          hasattr(self.user, 'eglise') and 
                          self.user.eglise is not None and 
                          hasattr(self.user.eglise, 'pk'))
        
        # Personnalisation des champs en fonction de l'utilisateur
        if user_has_eglise:
            try:
                # Si l'utilisateur appartient à une église, on limite les choix
                self.fields['eglise'].queryset = Eglise.objects.filter(pk=self.user.eglise.pk)
                self.fields['eglise'].initial = self.user.eglise
                self.fields['eglise'].disabled = True
                self.fields['organisateur_type'].initial = 'eglise'
                self.fields['organisateur_type'].disabled = True
                self.fields['organisateur_nom'].initial = self.user.eglise.nom
                self.fields['organisateur_nom'].disabled = True
            except (AttributeError, Eglise.DoesNotExist):
                # En cas d'erreur, on laisse la sélection d'église ouverte
                self.fields['eglise'].queryset = Eglise.objects.all()
                self.fields['eglise'].help_text = "Sélectionnez une église"
        
        # Configuration des champs de date et d'image
        self.fields['date_debut'].widget.attrs.update({'class': 'form-control datetimepicker'})
        self.fields['date_fin'].widget.attrs.update({'class': 'form-control datetimepicker'})
        self.fields['image'].widget.attrs.update({'class': 'form-control'})
        
        # Pour les utilisateurs admin ou sans église
        if not user_has_eglise:
            self.fields['eglise'].queryset = Eglise.objects.all()
            if self.user and self.user.is_authenticated:
                self.fields['eglise'].help_text = "Votre compte n'est pas rattaché à une église. Veuillez contacter un administrateur."
        
        # Définir les choix de type d'événement
        self.fields['type_evenement'].choices = Evenement.TYPE_EVENEMENT
        
        # Définir les choix de type d'organisateur
        self.fields['organisateur_type'].choices = Evenement.TYPE_ORGANISATEUR
        
        # Définir les formats de date pour les champs datetime
        self.fields['date_debut'].input_formats = ['%Y-%m-%dT%H:%M', '%Y-%m-%d %H:%M', '%d/%m/%Y %H:%M']
        self.fields['date_fin'].input_formats = ['%Y-%m-%dT%H:%M', '%Y-%m-%d %H:%M', '%d/%m/%Y %H:%M']
        
        # Ajouter des classes CSS pour le style
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'
    
    @classmethod
    def chronogram_forms(cls, *args, **kwargs):
        """
        Méthode de classe pour créer un formset de chronogramme
        """
        return forms.inlineformset_factory(
            Evenement, 
            ChronogrammeItem, 
            form=ChronogramItemForm,
            extra=1,
            can_delete=True,
            fields=('titre', 'heure_debut', 'heure_fin', 'description', 'responsable')
        )(*args, **kwargs)
    
    def clean(self):
        cleaned_data = super().clean()
        date_debut = cleaned_data.get('date_debut')
        date_fin = cleaned_data.get('date_fin')
        
        # Vérifier que la date de fin est postérieure à la date de début
        if date_debut and date_fin and date_fin <= date_debut:
            self.add_error('date_fin', "La date de fin doit être postérieure à la date de début.")
        
        # Vérifier que la date de début n'est pas dans le passé
        if date_debut and date_debut < timezone.now() - timedelta(minutes=30):
            self.add_error('date_debut', "La date de début ne peut pas être dans le passé.")
        
        return cleaned_data
#             notification.sender = self.user
        
#         # Définir la date de planification si fournie
#         schedule_for = self.cleaned_data.get('schedule_for')
#         if schedule_for:
#             notification.scheduled_for = schedule_for
        
#         if commit:
#             notification.save()
        
#         return notification




