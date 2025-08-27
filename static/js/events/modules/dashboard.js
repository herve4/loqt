/**
 * Module principal du tableau de bord des événements
 * Gère l'initialisation et la coordination des différents composants
 */

// Configuration globale
const CONFIG = {
    apiEndpoints: {
        events: '/api/events/',
        stats: '/api/dashboard/stats/'
    },
    pollingInterval: 300000 // 5 minutes
};

// État global de l'application
const APP_STATE = {
    isLoading: false,
    currentFilter: 'all',
    searchQuery: ''
};

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    // Initialisation des composants
    initTooltips();
    initPopovers();
    initEventListeners();
    
    // Chargement initial des données
    loadDashboardData();
    
    // Configuration du polling pour les mises à jour
    setupPolling();
    
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
 * Configure le polling pour les mises à jour régulières
 */
function setupPolling() {
    setInterval(() => {
        if (!document.hidden) {
            loadDashboardData();
        }
    }, CONFIG.pollingInterval);
}

/**
 * Initialise les écouteurs d'événements
 */
function initEventListeners() {
    // Gestion des événements de manière déléguée
    document.addEventListener('click', function(e) {
        // Filtres rapides
        if (e.target.closest('.quick-filter')) {
            e.preventDefault();
            const filter = e.target.closest('.quick-filter');
            applyFilter(filter.dataset.filter);
        }
        
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
    });
}

/**
 * Affiche une notification toast
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de notification (success, error, warning, info)
 * @param {Object} options - Options supplémentaires
 */
function showToast(message, type = 'info', options = {}) {
    // Vérifier si le conteneur toast existe, sinon le créer
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Créer l'élément toast
    const toastId = `toast-${Date.now()}`;
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.role = 'alert';
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Déterminer l'icône en fonction du type
    let iconClass = 'fa-info-circle';
    switch (type) {
        case 'success':
            iconClass = 'fa-check-circle';
            break;
        case 'error':
            iconClass = 'fa-exclamation-circle';
            break;
        case 'warning':
            iconClass = 'fa-exclamation-triangle';
            break;
    }
    
    // Contenu du toast
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${iconClass} me-2"></i>
                ${escapeHtml(message)}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
        </div>
    `;
    
    // Ajouter le toast au conteneur
    toastContainer.appendChild(toast);
    
    // Initialiser le toast Bootstrap
    const bsToast = new bootstrap.Toast(toast, {
        autohide: true,
        delay: 5000
    });
    
    // Gérer le clic sur le toast
    if (options.onClick) {
        toast.style.cursor = 'pointer';
        toast.addEventListener('click', options.onClick);
    }
    
    // Supprimer le toast du DOM après sa fermeture
    toast.addEventListener('hidden.bs.toast', function () {
        toast.remove();
        
        // Supprimer le conteneur s'il est vide
        if (toastContainer.children.length === 0) {
            toastContainer.remove();
        }
    });
    
    // Afficher le toast
    bsToast.show();
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
    
    // Récupérer les données du tableau de bord
    Promise.all([
        fetch(CONFIG.apiEndpoints.stats).then(res => res.json()),
        fetch(`${CONFIG.apiEndpoints.events}?limit=5&sort=-date_debut`).then(res => res.json())
    ])
    .then(([statsData, eventsData]) => {
        updateDashboard({
            stats: statsData,
            recentEvents: eventsData.events || []
        });
    })
    .catch(error => {
        console.error('Erreur lors du chargement des données du tableau de bord:', error);
        showToast('Erreur lors du chargement des données', 'error');
        
        // Afficher des données de démonstration en cas d'erreur
        updateDashboard({
            stats: {
                totalEvents: 0,
                upcomingEvents: 0,
                completedEvents: 0,
                cancelledEvents: 0
            },
            recentEvents: []
        });
    })
    .finally(() => {
        // Masquer l'indicateur de chargement
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    });
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

/**
 * Récupère le jeton CSRF pour les requêtes AJAX
 * @returns {string} - Le jeton CSRF
 */
function getCsrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

/**
 * Formate une date en temps relatif (ex: "il y a 2 minutes")
 * @param {string} dateString - La date à formater
 * @returns {string} - La date formatée
 */
function timeAgo(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (isNaN(seconds)) return '';
    
    const intervals = {
        année: 31536000,
        mois: 2592000,
        semaine: 604800,
        jour: 86400,
        heure: 3600,
        minute: 60,
        seconde: 1
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        
        if (interval >= 1) {
            if (interval === 1) {
                return `il y a ${interval} ${unit}`;
            } else {
                return `il y a ${interval} ${unit}s`;
            }
        }
    }
    
    return 'à l\'instant';
}

/**
 * Formate une date au format lisible
 * @param {string} dateString - La date à formater
 * @param {boolean} withTime - Inclure l'heure
 * @returns {string} - La date formatée
 */
function formatDate(dateString, withTime = true) {
    if (!dateString) return '';
    
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    if (withTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

/**
 * Formate une durée en heures et minutes
 * @param {number} minutes - La durée en minutes
 * @returns {string} - La durée formatée
 */
function formatDuration(minutes) {
    if (!minutes) return '0 min';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
    } else {
        return `${mins} min`;
    }
}

/**
 * Formate un nombre avec séparateur de milliers
 * @param {number} number - Le nombre à formater
 * @returns {string} - Le nombre formaté
 */
function formatNumber(number) {
    return number?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') || '0';
}

/**
 * Fonction utilitaire pour échapper les caractères HTML
 * @param {string} unsafe - Chaîne à échapper
 * @returns {string} - Chaîne échappée
 */
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Copie du texte dans le presse-papier
 * @param {string} text - Le texte à copier
 * @param {Object} options - Options supplémentaires
 * @returns {Promise<boolean>} - True si la copie a réussi
 */
async function copyToClipboard(text, options = {}) {
    try {
        await navigator.clipboard.writeText(text);
        
        if (options.showToast !== false) {
            showToast(options.successMessage || 'Copié dans le presse-papier', 'success');
        }
        
        return true;
    } catch (err) {
        console.error('Erreur lors de la copie dans le presse-papier:', err);
        
        if (options.showToast !== false) {
            showToast('Erreur lors de la copie', 'error');
        }
        
        return false;
    }
}

/**
 * Ouvre une URL dans un nouvel onglet
 * @param {string} url - L'URL à ouvrir
 * @param {boolean} newTab - Ouvrir dans un nouvel onglet
 */
function openUrl(url, newTab = true) {
    if (!url) return;
    
    if (newTab) {
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        window.location.href = url;
    }
}

/**
 * Affiche un indicateur de chargement
 * @param {boolean} show - Afficher ou masquer l'indicateur
 * @param {string} message - Message à afficher
 */
function showLoading(show = true, message = 'Chargement...') {
    let loader = document.getElementById('global-loader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="global-loader__content">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-2 mb-0">${escapeHtml(message)}</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        
        loader.style.display = 'flex';
    } else if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * Gère les erreurs de l'API
 * @param {Error} error - L'erreur à gérer
 * @param {string} context - Contexte de l'erreur
 */
function handleApiError(error, context = '') {
    console.error(`Erreur API${context ? ` (${context})` : ''}:`, error);
    
    let errorMessage = 'Une erreur est survenue';
    
    if (error.response) {
        // Erreur de réponse HTTP (4xx, 5xx)
        const { status, data } = error.response;
        
        if (status === 401) {
            errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            // Rediriger vers la page de connexion après un délai
            setTimeout(() => {
                window.location.href = '/login?expired=1';
            }, 2000);
        } else if (status === 403) {
            errorMessage = 'Vous n\'avez pas les droits pour effectuer cette action.';
        } else if (status === 404) {
            errorMessage = 'Ressource introuvable.';
        } else if (status === 422 && data.errors) {
            // Erreurs de validation
            errorMessage = Object.values(data.errors).flat().join('\n');
        } else if (data.message) {
            errorMessage = data.message;
        }
    } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        errorMessage = 'Pas de réponse du serveur. Vérifiez votre connexion Internet.';
    } else if (error.message) {
        // Une erreur s'est produite lors de la configuration de la requête
        errorMessage = error.message;
    }
    
    // Afficher l'erreur à l'utilisateur
    showToast(errorMessage, 'error');
    
    // Renvoyer l'erreur pour un traitement ultérieur si nécessaire
    return Promise.reject(error);
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
