/**
 * Gestion des événements du calendrier
 * Ce fichier contient la logique pour l'affichage et la gestion des événements dans le calendrier
 */

// Configuration du calendrier
function initializeCalendar() {
    // Vérifie si FullCalendar est disponible
    if (typeof FullCalendar === 'undefined') {
        console.error('FullCalendar n\'est pas chargé');
        return;
    }

    // Récupère l'élément du calendrier
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('Élément du calendrier non trouvé');
        return;
    }

    // Initialise le calendrier
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'fr',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        buttonText: {
            today: 'Aujourd\'hui',
            month: 'Mois',
            week: 'Semaine',
            day: 'Jour'
        },
        events: function(fetchInfo, successCallback, failureCallback) {
            // Fonction pour charger les événements sans utiliser de fonctions dynamiques
            const url = new URL('/evenements/json/', window.location.origin);
            
            // Ajout des paramètres de date pour le filtrage côté serveur
            if (fetchInfo && fetchInfo.start && fetchInfo.end) {
                url.searchParams.append('start', fetchInfo.start.toISOString());
                url.searchParams.append('end', fetchInfo.end.toISOString());
            }
            
            // Utilisation de fetch pour charger les données
            fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                credentials: 'same-origin',
                cache: 'no-store'
            })
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Erreur HTTP: ' + response.status);
                }
                return response.json();
            })
            .then(function(events) {
                // Traitement des événements reçus
                if (Array.isArray(events)) {
                    successCallback(events);
                } else {
                    console.error('Format de réponse inattendu:', events);
                    throw new Error('Format de réponse inattendu du serveur');
                }
            })
            .catch(function(error) {
                console.error('Erreur lors du chargement des événements:', error);
                showNotification('Erreur lors du chargement des événements', 'error');
                if (typeof failureCallback === 'function') {
                    failureCallback(error);
                }
            });
        },
        eventClick: function(info) {
            // Gère le clic sur un événement
            if (window.eventModal) {
                window.eventModal.openEditEventModal(info.event);
            }
            info.jsEvent.preventDefault();
        },
        dateClick: function(info) {
            // Gère le clic sur une date
            if (window.eventModal) {
                window.eventModal.openNewEventModal(info.date);
            }
        },
        eventDidMount: function(info) {
            // Personnalisation du rendu des événements
            if (info.event.extendedProps && info.event.extendedProps.status) {
                const statusClass = 'fc-event-' + String(info.event.extendedProps.status).toLowerCase().replace(/[^a-z0-9-]/g, '');
                info.el.classList.add(statusClass);
            }
        }
    });

    // Rend le calendrier disponible globalement
    window.calendar = calendar;

    // Affiche le calendrier
    calendar.render();

    // Cache le loader une fois le calendrier chargé
    const loader = document.getElementById('calendarLoading');
    if (loader) {
        loader.style.display = 'none';
    }

    return calendar;
}

// Initialise le calendrier quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
    // Vérifie si FullCalendar est disponible
    if (typeof FullCalendar === 'undefined') {
        console.error('FullCalendar n\'est pas chargé');
        return;
    }
    
    // Initialise le calendrier
    initializeCalendar();
    
    // Gestion du rafraîchissement du calendrier
    const refreshButton = document.getElementById('refreshCalendar');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            if (window.calendar) {
                window.calendar.refetchEvents();
                showNotification('Calendrier rafraîchi avec succès', 'success');
            }
        });
    }
});

// Fonction utilitaire pour afficher des notifications
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const alertClass = type === 'error' ? 'alert-danger' : 'alert-success';
    const icon = type === 'error' ? 'exclamation-triangle' : 'check-circle';
    
    const notification = document.createElement('div');
    notification.className = `alert ${alertClass} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
        <i class="fas fa-${icon} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
    `;
    
    container.appendChild(notification);
    
    // Supprime la notification après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 150);
    }, 5000);
}
