// Gestion du calendrier avec FullCalendar
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation du calendrier
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    
    // Récupérer les options du calendrier depuis le template
    const calendarOptions = JSON.parse(document.getElementById('calendar-options').textContent);
    
    // Créer le calendrier avec les options
    const calendar = new FullCalendar.Calendar(calendarEl, {
        ...calendarOptions,
        locale: 'fr',
        firstDay: 1, // Lundi comme premier jour de la semaine
        buttonText: {
            today: 'Aujourd\'hui',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour',
            list: 'Liste'
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        },
        eventClick: function(info) {
            // Empêcher la navigation par défaut
            info.jsEvent.preventDefault();
            
            // Mettre à jour le titre de la modale
            document.getElementById('eventModalTitle').textContent = info.event.title;
            
            // Afficher les détails de l'événement
            const event = info.event;
            const eventDetails = `
                <div class="event-details">
                    <h6 class="fw-bold mb-3">${event.title}</h6>
                    <p class="mb-2"><i class="far fa-calendar me-2"></i> ${formatEventDate(event)}</p>
                    ${event.extendedProps.description ? 
                        `<p class="mb-3">${event.extendedProps.description}</p>` : 
                        '<p class="text-muted mb-3">Aucune description disponible.</p>'
                    }
                    ${event.extendedProps.location ? 
                        `<p class="mb-2"><i class="fas fa-map-marker-alt me-2"></i> ${event.extendedProps.location}</p>` : ''
                    }
                    ${event.extendedProps.organisateur ? 
                        `<p class="mb-2"><i class="fas fa-user me-2"></i> ${event.extendedProps.organisateur}</p>` : ''
                    }
                </div>
            `;
            
            document.getElementById('eventModalBody').innerHTML = eventDetails;
            
            // Mettre à jour les boutons d'action
            const viewBtn = document.getElementById('eventViewBtn');
            const editBtn = document.getElementById('eventEditBtn');
            
            if (viewBtn && event.url) {
                viewBtn.href = event.url;
                viewBtn.style.display = 'inline-block';
            }
            
            if (editBtn) {
                editBtn.href = event.url + 'edit/';
                editBtn.style.display = 'inline-block';
            }
            
            // Afficher la modale
            const modal = new bootstrap.Modal(document.getElementById('eventModal'));
            modal.show();
        },
        eventDrop: function(info) {
            // Mettre à jour la date de l'événement via AJAX
            updateEventDate(info.event);
        },
        eventResize: function(info) {
            // Mettre à jour la date de fin de l'événement via AJAX
            updateEventDate(info.event);
        },
        select: function(info) {
            // Créer un nouvel événement lors de la sélection d'une plage de dates
            const modal = new bootstrap.Modal(document.getElementById('newEventModal'));
            
            // Pré-remplir les champs de date
            document.getElementById('id_date_debut').value = info.startStr.substring(0, 16);
            document.getElementById('id_date_fin').value = info.endStr ? info.endStr.substring(0, 16) : '';
            
            modal.show();
        }
    });
    
    // Afficher le calendrier
    calendar.render();
    
    // Gestion des boutons de navigation
    document.getElementById('prevBtn')?.addEventListener('click', function() {
        calendar.prev();
    });
    
    document.getElementById('todayBtn')?.addEventListener('click', function() {
        calendar.today();
    });
    
    document.getElementById('nextBtn')?.addEventListener('click', function() {
        calendar.next();
    });
    
    // Filtrage des événements
    document.getElementById('eventSearch')?.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        calendar.getEvents().forEach(function(event) {
            const eventTitle = event.title.toLowerCase();
            const eventMatches = eventTitle.includes(searchTerm);
            event.setProp('display', eventMatches ? 'auto' : 'none');
        });
    });
    
    // Filtrage par type d'événement
    document.getElementById('eventLegend')?.addEventListener('click', function(e) {
        const target = e.target.closest('.event-type-legend');
        if (!target) return;
        
        const typeClass = Array.from(target.classList).find(cls => cls.startsWith('event-type-'));
        if (!typeClass) return;
        
        // Basculer la classe active
        target.classList.toggle('active');
        
        // Filtrer les événements
        const isActive = target.classList.contains('active');
        const eventType = typeClass.replace('event-type-', '');
        
        calendar.getEvents().forEach(function(event) {
            const eventTypeClass = Array.from(event._def.ui.classNames).find(cls => cls.startsWith('event-type-'));
            if (eventTypeClass && eventTypeClass.endsWith(eventType)) {
                event.setProp('display', isActive ? 'none' : 'auto');
            }
        });
    });
    
    // Gestion du formulaire de création d'événement
    document.getElementById('eventForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const form = this;
        const formData = new FormData(form);
        
        // Désactiver le bouton de soumission
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        
        // Envoyer la requête AJAX
        fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Ajouter le nouvel événement au calendrier
                calendar.addEvent({
                    id: data.event_id,
                    title: formData.get('nom'),
                    start: formData.get('date_debut'),
                    end: formData.get('date_fin'),
                    url: data.event_url,
                    extendedProps: {
                        description: formData.get('description'),
                        location: formData.get('lieu'),
                        organisateur: formData.get('organisateur')
                    }
                });
                
                // Fermer la modale et réinitialiser le formulaire
                bootstrap.Modal.getInstance(document.getElementById('newEventModal')).hide();
                form.reset();
                
                // Afficher un message de succès
                showToast('Succès', 'L\'événement a été créé avec succès.', 'success');
            } else {
                // Afficher les erreurs de validation
                showFormErrors(form, data.errors);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showToast('Erreur', 'Une erreur est survenue lors de la création de l\'événement.', 'error');
        })
        .finally(() => {
            // Réactiver le bouton de soumission
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        });
    });
    
    // Fonction pour mettre à jour la date d'un événement
    function updateEventDate(event) {
        const csrftoken = getCookie('csrftoken');
        
        fetch(updateEventDateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrftoken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({
                'event_id': event.id,
                'start': event.start ? event.start.toISOString() : '',
                'end': event.end ? event.end.toISOString() : '',
                'action': 'update_event_date'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error('Erreur lors de la mise à jour de la date:', data.error);
                // Recharger le calendrier pour annuler les modifications
                calendar.refetchEvents();
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            calendar.refetchEvents();
        });
    }
    
    // Fonction pour formater la date d'un événement
    function formatEventDate(event) {
        let dateStr = '';
        
        if (event.start) {
            const startDate = event.start;
            dateStr += startDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            if (event.end) {
                dateStr += ' au ';
                
                // Vérifier si c'est le même jour
                const startDay = startDate.toDateString();
                const endDay = event.end.toDateString();
                
                if (startDay === endDay) {
                    // Même jour, n'afficher que l'heure de fin
                    dateStr += event.end.toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                } else {
                    // Jours différents, afficher la date complète
                    dateStr += event.end.toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }
        } else {
            dateStr = 'Date non spécifiée';
        }
        
        return dateStr;
    }
    
    // Fonction pour afficher les erreurs de formulaire
    function showFormErrors(form, errors) {
        // Réinitialiser les erreurs précédentes
        form.querySelectorAll('.is-invalid').forEach(el => {
            el.classList.remove('is-invalid');
        });
        
        form.querySelectorAll('.invalid-feedback').forEach(el => {
            el.remove();
        });
        
        // Afficher les nouvelles erreurs
        Object.entries(errors).forEach(([field, messages]) => {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'invalid-feedback';
                errorDiv.textContent = Array.isArray(messages) ? messages[0] : messages;
                
                input.classList.add('is-invalid');
                input.parentNode.appendChild(errorDiv);
            }
        });
    }
    
    // Fonction utilitaire pour récupérer un cookie
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // Fonction pour afficher une notification toast
    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <strong>${title}</strong><br>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        const bsToast = new bootstrap.Toast(toast, {
            autohide: true,
            delay: 5000
        });
        
        bsToast.show();
        
        // Supprimer le toast du DOM après sa fermeture
        toast.addEventListener('hidden.bs.toast', function() {
            toast.remove();
        });
    }
});
