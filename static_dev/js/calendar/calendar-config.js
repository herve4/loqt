/**
 * Configuration globale du calendrier
 */

// Configuration des endpoints API
window.CalendarConfig = {
  API_ENDPOINTS: {
    EVENTS: '/events/json/',
    EVENT_DETAIL: function(id) { return `/evenements/detail/${id}/`; }
  },
  
  // Configuration FullCalendar
  CALENDAR_CONFIG: {
    locale: 'fr',
    initialView: 'dayGridMonth',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    editable: true,
    selectable: true,
    selectMirror: true,
    droppable: true,
    dragScroll: true,
    lazyFetching: true,
    snapDuration: '00:15:00',
    slotMinTime: '08:00:00',
    slotMaxTime: '22:00:00',
    allDaySlot: true,
    nowIndicator: true,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      meridiem: false
    },
    views: {
      dayGridMonth: { dayMaxEvents: 3, eventMaxStack: 2, fixedWeekCount: false },
      timeGridWeek: { dayMaxEvents: 4, slotDuration: '00:15:00' },
      timeGridDay: { dayMaxEvents: 6, slotDuration: '00:15:00' }
    },
    eventDidMount: function(info) {
      // Personnalisation du rendu des événements
      const event = info.event;
      const element = info.el;
      
      // Ajouter une classe CSS basée sur le type d'événement
      if (event.extendedProps && event.extendedProps.type) {
        element.classList.add('event-type-' + event.extendedProps.type.toLowerCase());
      }
      
      // Afficher l'heure de début pour les événements non-toute la journée
      if (!event.allDay) {
        const timeEl = document.createElement('div');
        timeEl.className = 'fc-event-time';
        timeEl.textContent = info.timeText;
        element.prepend(timeEl);
      }
    }
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
