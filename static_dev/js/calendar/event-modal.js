/**
 * Gestion du modal de création et d'édition d'événements
 */

class EventModal {
    constructor() {
        this.modal = $('#eventModal');
        this.form = $('#eventForm');
        this.currentStep = 1;
        this.totalSteps = 3;
        this.initializeEventListeners();
        this.initializeSelect2();
        this.initializeDatePickers();
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initializeEventListeners() {
        // Gestion du changement de type d'organisateur
        $('input[name="organisateur_type"]').on('change', (e) => this.toggleOrganisateurType(e.target.value));
        
        // Gestion de la sélection de matériel
        $(document).on('click', '.materiel-card', (e) => this.toggleMaterielSelection(e));
        
        // Gestion de la sélection de logisticien
        $(document).on('click', '.logisticien-card', (e) => this.toggleLogisticienSelection(e));
        
        // Gestion du bouton "Tout sélectionner" pour le matériel
        $('#selectAllMaterials').on('click', (e) => this.toggleSelectAllMaterials(e));
        
        // Gestion de la navigation entre les étapes
        $('.btn-next-step').on('click', () => this.nextStep());
        $('.btn-prev-step').on('click', () => this.prevStep());
        
        // Gestion de la soumission du formulaire
        this.form.on('submit', (e) => this.handleSubmit(e));
        
        // Gestion de la fermeture du modal
        this.modal.on('hidden.bs.modal', () => this.resetForm());
    }
    
    /**
     * Initialise les sélecteurs Select2
     */
    initializeSelect2() {
        $('.select2').select2({
            theme: 'bootstrap4',
            width: '100%',
            placeholder: 'Sélectionnez une option',
            allowClear: true
        });
    }
    
    /**
     * Initialise les sélecteurs de date et heure
     */
    initializeDatePickers() {
        const now = new Date();
        const defaultStart = new Date(now.getTime() + (60 * 60 * 1000)); // 1 heure dans le futur
        const defaultEnd = new Date(defaultStart.getTime() + (2 * 60 * 60 * 1000)); // 3 heures après le début
        
        // Format: YYYY-MM-DDTHH:MM
        $('#date_debut').val(this.formatDateTimeForInput(defaultStart));
        $('#date_fin').val(this.formatDateTimeForInput(defaultEnd));
        
        // Validation des dates
        $('#date_debut, #date_fin').on('change', () => this.validateDates());
    }
    
    /**
     * Formate une date pour l'input datetime-local
     */
    formatDateTimeForInput(date) {
        const pad = (num) => num.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
    
    /**
     * Bascule entre les types d'organisateur (église/autre)
     */
    toggleOrganisateurType(type) {
        if (type === 'eglise') {
            $('#egliseGroup').removeClass('d-none');
            $('#autreOrganisateurGroup').addClass('d-none');
            $('#eglise').prop('required', true);
            $('#organisateur_nom').prop('required', false);
        } else {
            $('#egliseGroup').addClass('d-none');
            $('#autreOrganisateurGroup').removeClass('d-none');
            $('#eglise').prop('required', false);
            $('#organisateur_nom').prop('required', true);
        }
    }
    
    /**
     * Bascule la sélection d'un matériel
     */
    toggleMaterielSelection(e) {
        const card = $(e.currentTarget).closest('.materiel-card');
        const checkbox = card.find('.materiel-checkbox');
        const quantityInput = card.find('.quantite-input');
        
        // Bascule l'état de sélection
        const isChecked = !checkbox.prop('checked');
        
        // Met à jour l'état
        checkbox.prop('checked', isChecked);
        quantityInput.prop('disabled', !isChecked);
        
        // Met à jour le style de la carte
        if (isChecked) {
            card.addClass('selected');
        } else {
            card.removeClass('selected');
        }
        
        // Met à jour l'affichage des matériels sélectionnés
        this.updateSelectedMaterials();
    }
    
    /**
     * Bascule la sélection d'un logisticien
     */
    toggleLogisticienSelection(e) {
        const card = $(e.currentTarget).closest('.logisticien-card');
        const checkbox = card.find('.logisticien-checkbox');
        const isChecked = !checkbox.prop('checked');
        
        // Met à jour l'état
        checkbox.prop('checked', isChecked);
        
        // Met à jour le style de la carte
        if (isChecked) {
            card.addClass('selected');
        } else {
            card.removeClass('selected');
        }
        
        // Met à jour l'affichage des logisticiens sélectionnés
        this.updateSelectedLogisticiens();
    }
    
    /**
     * Sélectionne ou désélectionne tous les matériaux
     */
    toggleSelectAllMaterials(e) {
        const button = $(e.currentTarget);
        const container = $('#materielsContainer');
        const checkboxes = container.find('.materiel-checkbox');
        const allChecked = checkboxes.length === checkboxes.filter(':checked').length;
        
        // Inverse l'état de toutes les cases à cocher
        checkboxes.prop('checked', !allChecked).trigger('change');
        
        // Met à jour le texte du bouton
        if (allChecked) {
            button.html('<i class="fas fa-check-double mr-1"></i>Tout sélectionner');
        } else {
            button.html('<i class="fas fa-times mr-1"></i>Tout désélectionner');
        }
        
        // Met à jour les styles
        container.find('.materiel-card').toggleClass('selected', !allChecked);
        container.find('.quantite-input').prop('disabled', allChecked);
        
        // Met à jour l'affichage des matériels sélectionnés
        this.updateSelectedMaterials();
    }
    
    /**
     * Met à jour l'affichage des matériels sélectionnés
     */
    updateSelectedMaterials() {
        const selectedContainer = $('#selectedMaterials');
        selectedContainer.empty();
        
        const selectedMaterials = [];
        $('.materiel-checkbox:checked').each(function() {
            const id = $(this).val();
            const name = $(this).data('name');
            const quantity = $(`#quantite_${id}`).val();
            
            selectedMaterials.push({ id, name, quantity });
        });
        
        if (selectedMaterials.length === 0) {
            selectedContainer.html('<div class="empty-message">Aucun matériel sélectionné</div>');
            return;
        }
        
        selectedMaterials.forEach(item => {
            const element = `
                <div class="selected-item" data-id="${item.id}">
                    <span class="item-name">${item.name}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                    <button type="button" class="btn btn-sm btn-link text-danger remove-item" data-type="materiel" data-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            selectedContainer.append(element);
        });
    }
    
    /**
     * Met à jour l'affichage des logisticiens sélectionnés
     */
    updateSelectedLogisticiens() {
        const selectedContainer = $('#selectedLogisticiens');
        selectedContainer.empty();
        
        const selectedLogisticiens = [];
        $('.logisticien-checkbox:checked').each(function() {
            const id = $(this).val();
            const name = $(this).data('name');
            const avatar = $(this).data('avatar') || '/static/img/default-avatar.png';
            
            selectedLogisticiens.push({ id, name, avatar });
        });
        
        if (selectedLogisticiens.length === 0) {
            selectedContainer.html('<div class="empty-message">Aucun logisticien sélectionné</div>');
            return;
        }
        
        selectedLogisticiens.forEach(item => {
            const element = `
                <div class="selected-item" data-id="${item.id}">
                    <img src="${item.avatar}" alt="${item.name}" class="rounded-circle" width="24" height="24">
                    <span class="item-name ml-2">${item.name}</span>
                    <button type="button" class="btn btn-sm btn-link text-danger remove-item" data-type="logisticien" data-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            selectedContainer.append(element);
        });
    }
    
    /**
     * Passe à l'étape suivante du formulaire
     */
    nextStep() {
        if (!this.validateCurrentStep()) {
            return;
        }
        
        if (this.currentStep < this.totalSteps) {
            $(`#step-${this.currentStep}`).removeClass('active');
            this.currentStep++;
            $(`#step-${this.currentStep}`).addClass('active');
            this.updateStepIndicator();
        }
    }
    
    /**
     * Retourne à l'étape précédente du formulaire
     */
    prevStep() {
        if (this.currentStep > 1) {
            $(`#step-${this.currentStep}`).removeClass('active');
            this.currentStep--;
            $(`#step-${this.currentStep}`).addClass('active');
            this.updateStepIndicator();
        }
    }
    
    /**
     * Met à jour l'indicateur d'étape
     */
    updateStepIndicator() {
        $('.step').removeClass('active completed');
        
        $('.step').each((index, element) => {
            const stepNumber = parseInt($(element).data('step'));
            
            if (stepNumber < this.currentStep) {
                $(element).addClass('completed');
            } else if (stepNumber === this.currentStep) {
                $(element).addClass('active');
            }
        });
        
        // Met à jour les boutons de navigation
        $('.btn-prev-step').toggle(this.currentStep > 1);
        $('.btn-next-step').toggle(this.currentStep < this.totalSteps);
        $('.btn-submit-form').toggle(this.currentStep === this.totalSteps);
    }
    
    /**
     * Valide l'étape actuelle du formulaire
     */
    validateCurrentStep() {
        let isValid = true;
        
        // Validation de l'étape 1 (Informations de base)
        if (this.currentStep === 1) {
            const titre = $('#titre').val().trim();
            const typeOrganisateur = $('input[name="organisateur_type"]:checked').val();
            const eglise = $('#eglise').val();
            const organisateurNom = $('#organisateur_nom').val().trim();
            
            if (!titre) {
                this.showError('titre', 'Veuillez saisir un titre pour l\'événement');
                isValid = false;
            }
            
            if (typeOrganisateur === 'eglise' && !eglise) {
                this.showError('eglise', 'Veuillez sélectionner une église');
                isValid = false;
            } else if (typeOrganisateur === 'autre' && !organisateurNom) {
                this.showError('organisateur_nom', 'Veuillez saisir le nom de l\'organisateur');
                isValid = false;
            }
        }
        
        // Validation de l'étape 2 (Dates et matériel)
        if (this.currentStep === 2) {
            const dateDebut = $('#date_debut').val();
            const dateFin = $('#date_fin').val();
            
            if (!dateDebut) {
                this.showError('date_debut', 'Veuillez saisir une date de début');
                isValid = false;
            }
            
            if (!dateFin) {
                this.showError('date_fin', 'Veuillez saisir une date de fin');
                isValid = false;
            }
            
            if (dateDebut && dateFin && new Date(dateDebut) >= new Date(dateFin)) {
                this.showError('date_fin', 'La date de fin doit être postérieure à la date de début');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    /**
     * Valide les dates de l'événement
     */
    validateDates() {
        const dateDebut = $('#date_debut').val();
        const dateFin = $('#date_fin').val();
        
        if (dateDebut && dateFin) {
            const start = new Date(dateDebut);
            const end = new Date(dateFin);
            
            if (start >= end) {
                this.showError('date_fin', 'La date de fin doit être postérieure à la date de début');
                return false;
            }
            
            // Vérifie que la date de début n'est pas dans le passé
            const now = new Date();
            if (start < now) {
                this.showError('date_debut', 'La date de début ne peut pas être dans le passé');
                return false;
            }
            
            // Vérifie que la durée ne dépasse pas 24 heures
            const durationHours = (end - start) / (1000 * 60 * 60);
            if (durationHours > 24) {
                this.showError('date_fin', 'La durée de l\'événement ne peut pas dépasser 24 heures');
                return false;
            }
            
            // Efface les messages d'erreur si tout est valide
            this.clearError('date_debut');
            this.clearError('date_fin');
            return true;
        }
        
        return false;
    }
    
    /**
     * Affiche un message d'erreur pour un champ
     */
    showError(fieldId, message) {
        let $field = $(`#${fieldId}`);
        let $error = $(`#${fieldId}-error`);
        
        if ($error.length === 0) {
            $field.after(`<div id="${fieldId}-error" class="invalid-feedback">${message}</div>`);
        } else {
            $error.text(message);
        }
        
        $field.addClass('is-invalid');
        
        // Fait défiler jusqu'au premier champ en erreur
        if ($('.is-invalid').length === 1) {
            $('html, body').animate({
                scrollTop: $field.offset().top - 100
            }, 500);
        }
    }
    
    /**
     * Efface le message d'erreur d'un champ
     */
    clearError(fieldId) {
        $(`#${fieldId}`).removeClass('is-invalid');
        $(`#${fieldId}-error`).remove();
    }
    
    /**
     * Gère la soumission du formulaire
     */
    handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateCurrentStep()) {
            return;
        }
        
        // Affiche l'indicateur de chargement
        const submitButton = $(e.currentTarget).find('button[type="submit"]');
        const originalButtonText = submitButton.html();
        submitButton.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enregistrement...');
        
        // Récupère les données du formulaire
        const formData = new FormData(this.form[0]);
        
        // Envoie la requête AJAX
        $.ajax({
            url: this.form.attr('action'),
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: (response) => this.handleSuccess(response),
            error: (xhr) => this.handleError(xhr),
            complete: () => {
                submitButton.prop('disabled', false).html(originalButtonText);
            }
        });
    }
    
    /**
     * Gère la réponse en cas de succès
     */
    handleSuccess(response) {
        // Affiche un message de succès
        this.showNotification('Succès', 'L\'événement a été enregistré avec succès', 'success');
        
        // Rafraîchit le calendrier
        if (typeof window.calendar !== 'undefined') {
            window.calendar.refetchEvents();
        }
        
        // Ferme le modal après un court délai
        setTimeout(() => {
            this.modal.modal('hide');
            this.resetForm();
        }, 1500);
    }
    
    /**
     * Gère les erreurs de la requête AJAX
     */
    handleError(xhr) {
        if (xhr.status === 400 && xhr.responseJSON) {
            // Affiche les erreurs de validation
            const errors = xhr.responseJSON;
            
            for (const field in errors) {
                if (errors.hasOwnProperty(field)) {
                    this.showError(field, errors[field].join(' '));
                }
            }
            
            // Fait défiler jusqu'au premier champ en erreur
            const firstError = $('.is-invalid').first();
            if (firstError.length) {
                $('html, body').animate({
                    scrollTop: firstError.offset().top - 100
                }, 500);
            }
        } else {
            // Affiche un message d'erreur générique
            this.showNotification('Erreur', 'Une erreur est survenue lors de l\'enregistrement de l\'événement', 'error');
        }
    }
    
    /**
     * Affiche une notification
     */
    showNotification(title, message, type = 'info') {
        const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
        const icon = type === 'error' ? 'exclamation-triangle' : 'check-circle';
        
        const notification = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="fas fa-${icon} mr-2"></i>
                <strong>${title}</strong> ${message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Fermer">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;
        
        // Ajoute la notification en haut du formulaire
        const container = $('.notification-container');
        if (container.length) {
            container.html(notification);
        } else {
            this.form.prepend(`<div class="notification-container">${notification}</div>`);
        }
        
        // Fait défiler jusqu'en haut du formulaire
        $('html, body').animate({
            scrollTop: this.form.offset().top - 100
        }, 500);
    }
    
    /**
     * Réinitialise le formulaire
     */
    resetForm() {
        this.form.trigger('reset');
        this.currentStep = 1;
        $('.step').removeClass('active completed');
        $('#step-1').addClass('active');
        this.updateStepIndicator();
        $('.invalid-feedback').remove();
        $('.is-invalid').removeClass('is-invalid');
        $('.selected').removeClass('selected');
        $('.quantite-input').prop('disabled', true);
        $('.notification-container').empty();
        
        // Réinitialise les sélecteurs Select2
        if ($.fn.select2) {
            $('.select2').val(null).trigger('change');
        }
        
        // Réinitialise les champs de date
        this.initializeDatePickers();
    }
    
    /**
     * Ouvre le modal pour créer un nouvel événement
     */
    openNewEventModal(start, end) {
        this.resetForm();
        
        // Définit les dates si elles sont fournies
        if (start) {
            $('#date_debut').val(this.formatDateTimeForInput(new Date(start)));
        }
        
        if (end) {
            $('#date_fin').val(this.formatDateTimeForInput(new Date(end)));
        }
        
        // Ouvre le modal
        this.modal.modal('show');
    }
    
    /**
     * Ouvre le modal pour modifier un événement existant
     */
    openEditEventModal(event) {
        this.resetForm();
        
        // Remplit le formulaire avec les données de l'événement
        if (event.title) $('#titre').val(event.title);
        if (event.start) $('#date_debut').val(this.formatDateTimeForInput(new Date(event.start)));
        if (event.end) $('#date_fin').val(this.formatDateTimeForInput(new Date(event.end)));
        if (event.description) $('#description').val(event.description);
        
        // Définit le type d'organisateur
        if (event.organisateur_type) {
            $(`input[name="organisateur_type"][value="${event.organisateur_type}"]`).prop('checked', true);
            this.toggleOrganisateurType(event.organisateur_type);
            
            if (event.organisateur_type === 'eglise' && event.eglise) {
                $('#eglise').val(event.eglise).trigger('change');
            } else if (event.organisateur_type === 'autre' && event.organisateur_nom) {
                $('#organisateur_nom').val(event.organisateur_nom);
            }
        }
        
        // Définit le type d'événement
        if (event.type_evenement) {
            $(`input[name="type_evenement"][value="${event.type_evenement}"]`).prop('checked', true);
        }
        
        // Sélectionne les matériels
        if (event.materiels && Array.isArray(event.materiels)) {
            event.materiels.forEach(materiel => {
                $(`#materiel_${materiel.id}`).prop('checked', true);
                $(`#quantite_${materiel.id}`).val(materiel.quantite).prop('disabled', false);
                $(`#materiel_${materiel.id}`).closest('.materiel-card').addClass('selected');
            });
            
            this.updateSelectedMaterials();
        }
        
        // Sélectionne les logisticiens
        if (event.logisticiens && Array.isArray(event.logisticiens)) {
            event.logisticiens.forEach(logisticien => {
                $(`#logisticien_${logisticien.id}`).prop('checked', true);
                $(`#logisticien_${logisticien.id}`).closest('.logisticien-card').addClass('selected');
            });
            
            this.updateSelectedLogisticiens();
        }
        
        // Change le titre du modal
        $('#eventModalLabel').html('<i class="fas fa-edit mr-2"></i>Modifier l\'événement');
        
        // Met à jour l'URL du formulaire pour l'édition
        if (event.id) {
            this.form.attr('action', `/evenements/${event.id}/modifier/`);
        }
        
        // Ouvre le modal
        this.modal.modal('show');
    }
}

// Initialise le modal lorsque le DOM est prêt
$(document).ready(function() {
    window.eventModal = new EventModal();
    
    // Ouvre le modal de création d'événement au clic sur le bouton "Nouvel événement"
    $(document).on('click', '.fc-addEventButton-button', function(e) {
        e.preventDefault();
        window.eventModal.openNewEventModal();
    });
    
    // Ouvre le modal d'édition d'événement au clic sur un événement du calendrier
    $(document).on('click', '.fc-event', function() {
        const event = $(this).data('event');
        if (event) {
            window.eventModal.openEditEventModal(event);
        }
    });
});
