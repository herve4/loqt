import { CALENDAR_CONFIG, EVENT_COLORS } from './config.js';
import { fetchEvents, fetchEventDetails } from './api.js';

export class CalendarUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.calendar = null;
    this.initializeCalendar();
    this.setupEventListeners();
  }

  /**
   * Initialise le calendrier FullCalendar
   */
  initializeCalendar() {
    this.calendar = new FullCalendar.Calendar(this.container, {
      ...CALENDAR_CONFIG,
      events: this.fetchEvents.bind(this),
      eventContent: this.renderEventContent.bind(this),
      eventClick: this.handleEventClick.bind(this),
      select: this.handleDateSelect.bind(this),
      eventDidMount: this.handleEventMount.bind(this),
      eventDrop: this.handleEventDrop.bind(this),
      eventResize: this.handleEventResize.bind(this),
      eventDragStart: this.handleEventDragStart.bind(this),
      eventDragStop: this.handleEventDragStop.bind(this),
      eventResizeStart: this.handleResizeStart.bind(this),
      eventResizeStop: this.handleResizeStop.bind(this)
    });
    
    this.calendar.render();
  }

  /**
   * Récupère les événements pour la plage de dates affichée
   */
  async fetchEvents(fetchInfo, successCallback, failureCallback) {
    try {
      const events = await fetchEvents(fetchInfo.start, fetchInfo.end);
      successCallback(events);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      failureCallback(error);
    }
  }

  /**
   * Personnalise le rendu du contenu d'un événement
   */
  renderEventContent(arg) {
    const { event } = arg;
    const chrono = event.extendedProps.chrono_resume;
    
    const html = `
      <div class="fc-event-main">
        <div class="fc-event-title">${event.title}</div>
        ${chrono ? `
          <div class="fc-event-time">
            <i class="fa fa-clock"></i> ${chrono}
          </div>
        ` : ''}
      </div>
    `;
    
    return { html };
  }

  /**
   * Gère le clic sur un événement
   */
  async handleEventClick(clickInfo) {
    try {
      const event = clickInfo.event;
      await this.showEventDetails(event.id);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    }
  }

  /**
   * Affiche les détails d'un événement
   */
  async showEventDetails(eventId) {
    try {
      this.currentEventId = eventId; // Stocker l'ID de l'événement actuel
      const event = await fetchWithCache(`/api/events/${eventId}/`);
      if (event) {
        this.displayEventDetails(event);
        // Afficher le bouton de duplication
        const duplicateBtn = document.getElementById('duplicateEventBtn');
        if (duplicateBtn) {
          duplicateBtn.style.display = 'inline-block';
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des détails de l\'événement:', error);
      this.showNotification('Erreur lors du chargement des détails de l\'événement', 'error');
    }
  }

  /**
   * Gère la sélection d'une plage de dates
   */
  handleDateSelect(selectInfo) {
    this.showCreateEventForm(selectInfo.start, selectInfo.end);
  }

  /**
   * Personnalise le rendu initial d'un événement
   */
  handleEventMount(info) {
    const { event, el } = info;
    
    // Ajoute un tooltip avec le chrono complet
    const chronoFull = event.extendedProps.chrono_full;
    if (chronoFull) {
      this.setupTooltip(el, chronoFull);
    }
    
    // Styles personnalisés
    el.style.borderLeft = `4px solid ${event.backgroundColor}`;
    el.style.backgroundColor = `${event.backgroundColor}20`;
    el.style.color = event.textColor || '#333';
    el.style.cursor = 'pointer';
    el.style.borderRadius = '4px';
    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
  }

  /**
   * Configure un tooltip pour un élément
   */
  setupTooltip(element, content) {
    let tooltip = null;
    
    element.addEventListener('mouseenter', (e) => {
      tooltip = document.createElement('div');
      tooltip.className = 'fc-tooltip';
      tooltip.innerHTML = `<i class="fa fa-clock"></i> <pre>${content}</pre>`;
      document.body.appendChild(tooltip);
      
      const rect = element.getBoundingClientRect();
      tooltip.style.position = 'fixed';
      tooltip.style.top = `${rect.top - 32}px`;
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.background = '#222';
      tooltip.style.color = '#fff';
      tooltip.style.padding = '6px 12px';
      tooltip.style.borderRadius = '4px';
      tooltip.style.fontSize = '0.97em';
      tooltip.style.zIndex = '9999';
      tooltip.style.whiteSpace = 'pre-line';
    });
    
    element.addEventListener('mouseleave', () => {
      if (tooltip && tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
    });
  }

  /**
   * Affiche les détails d'un événement dans une modale
   */
  displayEventDetails(eventData) {
    // Implémentez l'affichage des détails de l'événement
    console.log('Détails de l\'événement:', eventData);
    // À compléter avec votre logique d'interface utilisateur
  }

  /**
   * Affiche le formulaire de création d'événement
   */
  showCreateEventForm(start, end) {
    // Implémentez l'affichage du formulaire de création
    console.log('Créer un événement du', start, 'au', end);
    // À compléter avec votre logique d'interface utilisateur
  }

  /**
   * Gère le début du glisser-déposer d'un événement
   */
  handleEventDragStart(info) {
    document.body.style.cursor = 'grabbing';
    info.el.classList.add('fc-event-dragging');
    
    // Afficher un indicateur visuel pendant le glisser
    const ghost = info.el.cloneNode(true);
    ghost.classList.add('fc-event-ghost');
    document.body.appendChild(ghost);
    info.jsEvent.dataTransfer.setDragImage(ghost, 10, 10);
    
    // Supprimer le ghost après un court délai
    setTimeout(() => ghost.remove(), 0);
  }

  /**
   * Gère la fin du glisser-déposer d'un événement
   */
  handleEventDragStop() {
    document.body.style.cursor = '';
    document.querySelectorAll('.fc-event-dragging').forEach(el => {
      el.classList.remove('fc-event-dragging');
    });
  }

  /**
   * Gère le glisser-déposer d'un événement
   */
  async handleEventDrop(dropInfo) {
    const event = dropInfo.event;
    const originalEvent = dropInfo.oldEvent;
    
    // Vérifier si la date a réellement changé
    const dateChanged = !event.start || 
      !originalEvent.start || 
      event.start.valueOf() !== originalEvent.start.valueOf() ||
      Boolean(event.end) !== Boolean(originalEvent.end) ||
      (event.end && originalEvent.end && event.end.valueOf() !== originalEvent.end.valueOf());
    
    if (!dateChanged) {
      return; // Aucun changement, ne rien faire
    }
    
    try {
      // Afficher un indicateur de chargement
      event.setProp('color', '#999');
      event.setProp('textColor', '#fff');
      
      // Préparer les données à envoyer au serveur
      const eventData = {
        id: event.id,
        start: event.start ? event.start.toISOString() : null,
        end: event.end ? event.end.toISOString() : null,
        allDay: event.allDay
      };
      
      // Envoyer la mise à jour au serveur
      const response = await fetchWithCache(`/api/events/${event.id}/update/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCsrfToken()
        },
        body: JSON.stringify(eventData)
      }, false);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour de l\'événement');
      }
      
      // Mettre à jour l'événement avec les données du serveur
      event.setProp('color', '');
      event.setProp('textColor', '');
      
      // Afficher une notification de succès
      this.showNotification('Événement déplacé avec succès', 'success');
      
    } catch (error) {
      console.error('Erreur lors du déplacement de l\'événement:', error);
      this.showNotification('Erreur lors du déplacement de l\'événement', 'error');
      dropInfo.revert();
    }
  }

  /**
   * Gère le début du redimensionnement d'un événement
   */
  handleResizeStart() {
    document.body.style.cursor = 'row-resize';
  }

  /**
   * Gère la fin du redimensionnement d'un événement
   */
  handleResizeStop() {
    document.body.style.cursor = '';
  }

  /**
   * Gère le redimensionnement d'un événement
   */
  async handleEventResize(resizeInfo) {
    const event = resizeInfo.event;
    const originalEvent = resizeInfo.oldEvent;
    
    // Vérifier si la durée a réellement changé
    const durationChanged = !event.end || 
      !originalEvent.end || 
      event.end.valueOf() !== originalEvent.end.valueOf();
    
    if (!durationChanged) {
      return; // Aucun changement, ne rien faire
    }
    
    try {
      // Afficher un indicateur de chargement
      event.setProp('color', '#999');
      event.setProp('textColor', '#fff');
      
      // Préparer les données à envoyer au serveur
      const eventData = {
        id: event.id,
        end: event.end ? event.end.toISOString() : null
      };
      
      // Envoyer la mise à jour au serveur
      const response = await fetchWithCache(`/api/events/${event.id}/update/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCsrfToken()
        },
        body: JSON.stringify(eventData)
      }, false);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la mise à jour de l\'événement');
      }
      
      // Mettre à jour l'événement avec les données du serveur
      event.setProp('color', '');
      event.setProp('textColor', '');
      
      // Afficher une notification de succès
      this.showNotification('Durée de l\'événement mise à jour', 'success');
      
    } catch (error) {
      console.error('Erreur lors du redimensionnement de l\'événement:', error);
      this.showNotification('Erreur lors de la mise à jour de la durée', 'error');
      resizeInfo.revert();
    }
  }
  
  /**
   * Récupère le jeton CSRF pour les requêtes AJAX
   */
  getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
  }
  
  /**
   * Affiche une notification à l'utilisateur
   */
  showNotification(message, type = 'info') {
    // Utilisez votre système de notification préféré ici
    // Par exemple, avec Toastr, SweetAlert2, ou une solution personnalisée
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Exemple avec une alerte basique
    if (type === 'error') {
      alert(`Erreur: ${message}`);
    } else {
      // Pour les succès, on pourrait utiliser une notification plus discrète
      const notification = document.createElement('div');
      notification.className = `fc-notification fc-notification-${type}`;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      // Supprimer la notification après 3 secondes
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  }

  /**
   * Configure les écouteurs d'événements
   */
  setupEventListeners() {
    // Gestionnaire pour le bouton de nouvel événement
    document.getElementById('newEventBtn')?.addEventListener('click', () => {
      this.showCreateEventForm();
    });
    
    // Gestionnaire pour le bouton de duplication d'événement
    document.getElementById('duplicateEventBtn')?.addEventListener('click', () => {
      this.duplicateCurrentEvent();
    });
    
    // Ajoutez ici les écouteurs d'événements globaux
    document.addEventListener('click', (e) => {
      // Ferme les modales lors d'un clic à l'extérieur
      if (e.target.classList.contains('modal')) {
        this.closeModal(e.target);
      }
    });
  }

  /**
   * Ferme la popup de détails
   */
  closeEventDetails() {
    const popup = document.getElementById('eventDetailsPopup');
    if (popup) {
      popup.style.display = 'none';
    }
    // Cacher le bouton de duplication
    const duplicateBtn = document.getElementById('duplicateEventBtn');
    if (duplicateBtn) {
      duplicateBtn.style.display = 'none';
    }
    document.body.classList.remove('modal-open');
  }

  /**
   * Ferme une modale
   */
  closeModal(modal) {
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Duplique l'événement actuel
   */
  async duplicateCurrentEvent() {
    try {
      const eventId = this.currentEventId;
      const response = await fetchWithCache(`/api/events/${eventId}/duplicate/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCsrfToken()
        }
      }, false);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la duplication de l\'événement');
      }
      
      // Afficher une notification de succès
      this.showNotification('Événement dupliqué avec succès', 'success');
      
      // Mettre à jour le calendrier
      this.calendar.refetchEvents();
      
    } catch (error) {
      console.error('Erreur lors de la duplication de l\'événement:', error);
      this.showNotification('Erreur lors de la duplication de l\'événement', 'error');
    }
  }
}
