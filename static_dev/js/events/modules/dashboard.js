/**
 * Module principal du tableau de bord des événements
 * Gère l'initialisation et la coordination des différents composants
 */

// Configuration globale
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des composants
    initTooltips();
    initPopovers();
    initEventListeners();
    
    // Chargement initial des données
    loadDashboardData();
    
    console.log('Tableau de bord des événements initialisé');
});

/**
 * Initialise les tooltips Bootstrap
 */
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Initialise les popovers Bootstrap
 */
function initPopovers() {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
}

/**
 * Initialise les écouteurs d'événements
 */
function initEventListeners() {
    // Filtres rapides
    const quickFilters = document.querySelectorAll('.quick-filter');
    quickFilters.forEach(filter => {
        filter.addEventListener('click', function(e) {
            e.preventDefault();
            applyFilter(this.dataset.filter);
        });
    });
    
    // Recherche
    const searchInput = document.getElementById('eventSearch');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Actualisation des données
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
}

/**
 * Charge les données du tableau de bord
 */
function loadDashboardData() {
    // Afficher l'indicateur de chargement
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    
    // Simuler un chargement asynchrone
    setTimeout(() => {
        // Ici, vous feriez normalement un appel AJAX pour récupérer les données
        // Par exemple :
        // fetch('/api/dashboard/data/')
        //     .then(response => response.json())
        //     .then(data => updateDashboard(data));
        
        // Pour l'instant, on simule des données
        const mockData = {
            stats: {
                totalEvents: 24,
                upcomingEvents: 5,
                completedEvents: 15,
                cancelledEvents: 4
            },
            recentEvents: [
                { id: 1, title: 'Réunion d\'équipe', date: '2023-06-15T10:00:00', location: 'Salle A1', status: 'upcoming' },
                { id: 2, title: 'Formation technique', date: '2023-06-16T14:30:00', location: 'Salle B2', status: 'upcoming' },
                { id: 3, title: 'Présentation client', date: '2023-06-10T09:15:00', location: 'Salle C3', status: 'completed' }
            ]
        };
        
        updateDashboard(mockData);
        
        // Masquer l'indicateur de chargement
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }, 800);
}

/**
 * Met à jour l'interface utilisateur avec les données du tableau de bord
 * @param {Object} data - Les données du tableau de bord
 */
function updateDashboard(data) {
    // Mettre à jour les statistiques
    if (data.stats) {
        updateStats(data.stats);
    }
    
    // Mettre à jour la liste des événements récents
    if (data.recentEvents) {
        updateRecentEvents(data.recentEvents);
    }
    
    // Mettre à jour les graphiques (si nécessaire)
    if (typeof updateCharts === 'function') {
        updateCharts(data);
    }
}

/**
 * Met à jour les cartes de statistiques
 * @param {Object} stats - Les statistiques à afficher
 */
function updateStats(stats) {
    const statElements = {
        'totalEvents': document.getElementById('totalEvents'),
        'upcomingEvents': document.getElementById('upcomingEvents'),
        'completedEvents': document.getElementById('completedEvents'),
        'cancelledEvents': document.getElementById('cancelledEvents')
    };
    
    for (const [key, element] of Object.entries(statElements)) {
        if (element && stats[key] !== undefined) {
            animateValue(element, 0, stats[key], 1000);
        }
    }
}

/**
 * Anime une valeur numérique
 * @param {HTMLElement} element - L'élément contenant la valeur
 * @param {number} start - Valeur de départ
 * @param {number} end - Valeur finale
 * @param {number} duration - Durée de l'animation en ms
 */
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

/**
 * Met à jour la liste des événements récents
 * @param {Array} events - Liste des événements récents
 */
function updateRecentEvents(events) {
    const container = document.getElementById('recentEventsList');
    if (!container) return;
    
    // Vider le conteneur
    container.innerHTML = '';
    
    // Ajouter chaque événement
    events.forEach(event => {
        const eventElement = createEventElement(event);
        if (eventElement) {
            container.appendChild(eventElement);
        }
    });
}

/**
 * Crée un élément DOM pour un événement
 * @param {Object} event - Les données de l'événement
 * @returns {HTMLElement} - L'élément DOM créé
 */
function createEventElement(event) {
    if (!event) return null;
    
    const eventDate = new Date(event.date);
    const timeString = eventDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateString = eventDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    
    const eventElement = document.createElement('div');
    eventElement.className = `event-item ${event.status || ''}`;
    eventElement.innerHTML = `
        <div class="event-time">${timeString}</div>
        <div class="event-details">
            <h5 class="event-title">${escapeHtml(event.title)}</h5>
            <div class="event-meta">
                <span class="event-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(event.location)}</span>
                <span class="event-date"><i class="far fa-calendar"></i> ${dateString}</span>
            </div>
        </div>
        <div class="event-actions">
            <button class="btn btn-sm btn-outline-primary" data-event-id="${event.id}">
                <i class="fas fa-eye"></i>
            </button>
        </div>
    `;
    
    return eventElement;
}

/**
 * Applique un filtre aux données du tableau de bord
 * @param {string} filter - Le filtre à appliquer
 */
function applyFilter(filter) {
    // Mettre à jour l'interface utilisateur pour refléter le filtre actif
    document.querySelectorAll('.quick-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    // Ici, vous pourriez recharger les données avec le filtre appliqué
    // Par exemple : loadDashboardData({ filter: filter });
    
    console.log(`Filtre appliqué : ${filter}`);
}

/**
 * Gère la recherche d'événements
 * @param {Event} e - L'événement de saisie
 */
function handleSearch(e) {
    const searchTerm = e.target.value.trim().toLowerCase();
    
    // Ici, vous pourriez effectuer une recherche côté client
    // ou envoyer une requête au serveur pour des résultats plus précis
    
    console.log(`Recherche : ${searchTerm}`);
    
    // Exemple de filtrage côté client
    const eventItems = document.querySelectorAll('.event-item');
    eventItems.forEach(item => {
        const title = item.querySelector('.event-title')?.textContent.toLowerCase() || '';
        const location = item.querySelector('.event-location')?.textContent.toLowerCase() || '';
        
        if (title.includes(searchTerm) || location.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

/**
 * Fonction utilitaire pour échapper les caractères HTML
 * @param {string} unsafe - Chaîne à échapper
 * @returns {string} - Chaîne échappée
 */
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Fonction utilitaire pour limiter la fréquence d'exécution d'une fonction
 * @param {Function} func - La fonction à limiter
 * @param {number} wait - Le délai d'attente en ms
 * @returns {Function} - La fonction limitée
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Exporter les fonctions pour les tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initTooltips,
        initPopovers,
        initEventListeners,
        loadDashboardData,
        updateDashboard,
        updateStats,
        animateValue,
        updateRecentEvents,
        createEventElement,
        applyFilter,
        handleSearch,
        escapeHtml,
        debounce
    };
}
