/**
 * Configuration globale du calendrier
 */

// Configuration des endpoints API
window.CalendarConfig = {
  API_ENDPOINTS: {
    EVENTS: '/events/json/',
    EVENT_DETAIL: function(id) { return `/evenements/detail/${id}/`; }
  },
  
    // Configuration FullCalendar avec compatibilité CSP stricte
  CALENDAR_CONFIG: {
    // Configuration de base
    locale: 'fr',
    initialView: 'dayGridMonth',
    
    // Configuration de la barre d'outils
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    
    // Désactivation des fonctionnalités problématiques pour CSP
    editable: false,
    selectable: false,
    selectMirror: false,
    droppable: false,
    
    // Configuration des vues
    views: {
      dayGridMonth: { 
        dayMaxEvents: 3, 
        eventMaxStack: 2, 
        fixedWeekCount: false 
      },
      timeGridWeek: { 
        dayMaxEvents: 4, 
        slotDuration: '00:15:00' 
      },
      timeGridDay: { 
        dayMaxEvents: 6, 
        slotDuration: '00:15:00' 
      }
    },
    
    // Configuration du format d'heure
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      meridiem: false
    },
    
    // Désactivation des fonctionnalités utilisant des fonctions dynamiques
    eventDidMount: function(info) {
      try {
        const event = info.event;
        const element = info.el;
        
        // Ajout de classe CSS de manière sécurisée
        if (event.extendedProps && event.extendedProps.type) {
          const typeClass = 'event-type-' + String(event.extendedProps.type).toLowerCase()
            .replace(/[^a-z0-9-]/g, ''); // Nettoyage du nom de classe
          element.classList.add(typeClass);
        }
        
        // Affichage de l'heure de début pour les événements non-toute la journée
        if (!event.allDay && info.timeText) {
          const timeEl = document.createElement('div');
          timeEl.className = 'fc-event-time';
          timeEl.textContent = info.timeText;
          element.insertBefore(timeEl, element.firstChild);
        }
      } catch (error) {
        console.error('Erreur dans eventDidMount:', error);
      }
    },
    
    // Désactivation des fonctionnalités problématiques
    eventDragStart: null,
    eventDragStop: null,
    eventDrop: null,
    eventResize: null,
    eventResizeStart: null,
    eventResizeStop: null,
    eventMouseEnter: null,
    eventMouseLeave: null
  },
  
  // Messages d'erreur
  MESSAGES: {
    LOADING_ERROR: 'Erreur lors du chargement des événements',
    SAVE_SUCCESS: 'Événement enregistré avec succès',
    SAVE_ERROR: 'Erreur lors de la sauvegarde',
    DELETE_CONFIRM: 'Êtes-vous sûr de vouloir supprimer cet événement ?',
    DELETE_SUCCESS: 'Événement supprimé avec succès',
    DELETE_ERROR: 'Erreur lors de la suppression'
  },
  
  // Types d'événements
  EVENT_TYPES: [
    { id: 'reunion', label: 'Réunion', color: '#4e73df' },
    { id: 'formation', label: 'Formation', color: '#1cc88a' },
    { id: 'conference', label: 'Conférence', color: '#f6c23e' },
    { id: 'autre', label: 'Autre', color: '#e74a3b' }
  ]
};

// Initialisation globale
document.addEventListener('DOMContentLoaded', function() {
  // Vérifier que FullCalendar est disponible
  if (typeof FullCalendar === 'undefined') {
    console.error('FullCalendar n\'est pas chargé');
    return;
  }
  
  // Exporter FullCalendar globalement
  window.FullCalendar = FullCalendar;
  
  // Initialiser le calendrier si l'élément existe
  const calendarEl = document.getElementById('calendar');
  if (calendarEl) {
    window.calendar = new FullCalendar.Calendar(calendarEl, window.CalendarConfig.CALENDAR_CONFIG);
    window.calendar.render();
  }
});
