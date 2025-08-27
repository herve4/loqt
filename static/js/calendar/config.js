/**
 * Configuration du calendrier et constantes globales
 */

export const API_ENDPOINTS = {
  EVENTS: '/events/json/',
  EVENT_DETAIL: (id) => `/evenements/detail/${id}/`,
  // Ajoutez d'autres endpoints API ici
};

export const CALENDAR_CONFIG = {
  locale: 'fr',
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  // Activation des fonctionnalités de glisser-déposer et redimensionnement
  editable: true,
  selectable: true,
  selectMirror: true,
  droppable: true,
  dragScroll: true,
  lazyFetching: true,
  snapDuration: '00:15:00', // Durée d'alignement pour le glisser-déposer (15 minutes)
  slotMinTime: '08:00:00',
  slotMaxTime: '22:00:00',
  allDaySlot: true,
  nowIndicator: true,
  
  // Formatage des heures
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    meridiem: false
  },
  
  // Configuration des vues
  views: {
    dayGridMonth: {
      dayMaxEvents: 3,
      eventMaxStack: 2,
      fixedWeekCount: false
    },
    timeGridWeek: {
      dayMaxEvents: 4,
      slotDuration: '00:15:00',
      slotLabelInterval: '01:00:00',
      allDayText: 'Toute la journée',
      dayHeaderFormat: { weekday: 'short', day: 'numeric', month: 'short' }
    },
    timeGridDay: {
      dayMaxEvents: 6,
      slotDuration: '00:15:00',
      slotLabelInterval: '01:00:00'
    }
  },
  
  // Configuration des événements
  eventDisplay: 'block',
  eventOrder: 'start,-duration,allDay,title',
  eventMinHeight: 20,
  eventShortHeight: 30,
  
  // Options de glisser-déposer
  eventDragMinDistance: 5, // Distance minimale en pixels avant de commencer le glisser
  dragRevertDuration: 500, // Durée de l'animation de retour si échec du dépôt
  dragOpacity: 0.75, // Opacité pendant le glisser
  
  // Options de redimensionnement
  eventResizableFromStart: false, // Empêche le redimensionnement depuis le début
  eventMinDuration: '00:15:00', // Durée minimale d'un événement
  
  // Gestion du temps
  slotEventOverlap: true, // Autorise le chevauchement des événements
  dayMaxEvents: true, // Affiche le bouton "+X de plus" quand il y a trop d'événements
  
  // Amélioration des performances
  eventRenderWait: 0, // Délai avant le rendu des événements (ms)
  eventMaxStack: 3 // Nombre maximum d'événements empilés
};

export const EVENT_COLORS = {
  default: '#3788d8',
  important: '#e74c3c',
  warning: '#f39c12',
  success: '#2ecc71',
  info: '#3498db'
};
