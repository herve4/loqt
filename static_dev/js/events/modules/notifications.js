/**
 * Gestionnaire des notifications
 * Ce module gère l'interface utilisateur des notifications,
 * y compris le menu déroulant et les interactions utilisateur.
 */
class NotificationManager {
    constructor() {
        this.notificationDropdown = null;
        this.notificationList = null;
        this.notificationCount = 0;
        this.notificationBadge = null;
        this.notificationSound = new Audio('/static/sounds/notification.mp3');
        this.pollingInterval = null;
        
        this.initialize();
    }
    
    /**
     * Initialise le gestionnaire de notifications
     */
    initialize() {
        // Créer les éléments DOM si nécessaire
        this.createNotificationElements();
        
        // Démarrer le polling pour les nouvelles notifications
        this.startPolling();
        
        // Charger les notifications existantes
        this.loadNotifications();
        
        // Configurer les écouteurs d'événements
        this.setupEventListeners();
    }
    
    /**
     * Crée les éléments DOM pour les notifications
     */
    createNotificationElements() {
        // Vérifier si le conteneur de notifications existe déjà
        let container = document.getElementById('notifications-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notifications-container';
            document.body.appendChild(container);
        }
        
        // Créer le bouton de notification dans la barre de navigation
        const header = document.querySelector('header');
        if (header) {
            const notificationButton = document.createElement('div');
            notificationButton.className = 'event-notification-dropdown';
            notificationButton.id = 'event-notification-dropdown';
            notificationButton.innerHTML = `
                <button class="event-notification-button" aria-label="Notifications">
                    <i class="fas fa-bell"></i>
                    <span class="event-notification-badge" style="display: none;">0</span>
                </button>
                <div class="event-notification-dropdown-content">
                    <div class="event-notification-header">
                        <h4>Notifications</h4>
                        <div class="event-notification-actions">
                            <button class="event-mark-all-read" title="Marquer tout comme lu">
                                <i class="fas fa-check-double"></i>
                            </button>
                            <button class="event-refresh-notifications" title="Actualiser">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                    <ul class="event-notification-list">
                        <li class="event-notification-empty">
                            <p>Aucune notification</p>
                        </li>
                    </ul>
                    <div class="event-notification-footer">
                        <a href="/notifications/" class="event-view-all">Voir toutes les notifications</a>
                    </div>
                </div>
            `;
            
            const nav = header.querySelector('nav');
            if (nav) {
                nav.appendChild(notificationButton);
            } else {
                header.appendChild(notificationButton);
            }
            
            this.notificationDropdown = document.getElementById('event-notification-dropdown');
            this.notificationList = this.notificationDropdown.querySelector('.event-notification-list');
            this.notificationBadge = this.notificationDropdown.querySelector('.event-notification-badge');
        }
    }
    
    /**
     * Démarre le polling pour vérifier les nouvelles notifications
     */
    startPolling() {
        // Vérifier les nouvelles notifications toutes les 30 secondes
        this.pollingInterval = setInterval(() => {
            this.checkForNewNotifications();
        }, 30000); // 30 secondes
    }
    
    /**
     * Charge les notifications depuis le serveur
     */
    async loadNotifications() {
        try {
            const response = await fetch('/api/notifications/?limit=10');
            if (response.ok) {
                const data = await response.json();
                this.renderNotifications(data.results);
                this.updateUnreadCount(data.unread_count || 0);
            } else {
                throw new Error('Erreur lors du chargement des notifications');
            }
        } catch (error) {
            console.error('Erreur:', error);
            this.showErrorNotification('Impossible de charger les notifications');
        }
    }
    
    /**
     * Vérifie les nouvelles notifications sur le serveur
     */
    async checkForNewNotifications() {
        try {
            const response = await fetch('/api/notifications/unread_count/');
            if (response.ok) {
                const data = await response.json();
                const newCount = data.count || 0;
                
                // Si le nombre de notifications non lues a augmenté
                if (newCount > this.notificationCount) {
                    // Charger les nouvelles notifications
                    this.loadNotifications();
                }
                
                // Mettre à jour le compteur
                this.updateUnreadCount(newCount);
            }
        } catch (error) {
            console.error('Erreur lors de la vérification des nouvelles notifications:', error);
        }
    }
    
    /**
     * Affiche une notification d'erreur
     * @param {string} message - Le message d'erreur à afficher
     */
    showErrorNotification(message) {
        const notification = {
            id: 'error-' + Date.now(),
            title: 'Erreur',
            message: message,
            type: 'error',
            created_at: new Date().toISOString()
        };
        
        this.showFloatingNotification(notification);
    }
    
    /**
     * Affiche une notification de déconnexion
     */
    showOfflineNotification() {
        const notification = {
            id: 'offline-' + Date.now(),
            title: 'Hors ligne',
            message: 'Connexion perdue. Tentative de reconnexion...',
            type: 'warning',
            created_at: new Date().toISOString()
        };
        
        this.showFloatingNotification(notification);
    }
    
    /**
     * Traite une nouvelle notification reçue
     * @param {Object} notification - Les données de la notification
     */
    handleNewNotification(notification) {
        // Mettre à jour le compteur de notifications
        this.updateUnreadCount(this.notificationCount + 1);
        
        // Ajouter la notification en haut de la liste
        this.prependNotification(notification);
        
        // Afficher une notification flottante
        this.showFloatingNotification(notification);
        
        // Jouer un son de notification
        this.playNotificationSound();
    }
    
    /**
     * Met à jour le compteur de notifications non lues
     * @param {number} count - Le nouveau nombre de notifications non lues
     */
    updateUnreadCount(count) {
        this.notificationCount = count;
        this.notificationBadge.textContent = count.toString();
        this.notificationBadge.style.display = count > 0 ? 'block' : 'none';
    }
    
    /**
     * Préfixe une notification à la liste des notifications
     * @param {Object} notification - Les données de la notification
     */
    /**
     * Ajoute une notification au début de la liste
     * @param {Object} notification - Les données de la notification
     */
    prependNotification(notification) {
        // Supprimer le message "Aucune notification" s'il existe
        const emptyItem = this.notificationList.querySelector('.notification-empty');
        if (emptyItem) {
            this.notificationList.removeChild(emptyItem);
        }
        
        // Créer et ajouter le nouvel élément de notification
        const notificationItem = this.createNotificationElement({
            ...notification,
            unread: true
        });
        
        this.notificationList.insertBefore(notificationItem, this.notificationList.firstChild);
    }
    
    /**
     * Crée un élément DOM pour une notification
     * @param {Object} notification - Les données de la notification
     * @returns {HTMLElement} - L'élément DOM de la notification
     */
    createNotificationElement(notification) {
        const notificationItem = document.createElement('li');
        notificationItem.className = `notification-item ${notification.unread ? 'unread' : ''}`;
        notificationItem.dataset.notifId = notification.id;
        
        // Formater la date
        const date = new Date(notification.created_at || new Date());
        const timeString = this.formatTimeAgo(date);
        
        // Déterminer l'icône en fonction du type de notification
        let iconClass = 'info-circle';
        if (notification.type === 'success') iconClass = 'check-circle';
        else if (notification.type === 'warning') iconClass = 'exclamation-triangle';
        else if (notification.type === 'error') iconClass = 'exclamation-circle';
        
        notificationItem.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${iconClass} ${notification.type || 'info'}"></i>
            </div>
            <div class="notification-content">
                <h5>${this.escapeHtml(notification.title)}</h5>
                <p>${this.escapeHtml(notification.message)}</p>
                <span class="notification-time">${timeString}</span>
            </div>
            <button class="notification-close" title="Fermer">&times;</button>
        `;
        
        // Gérer le clic sur une notification
        notificationItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('notification-close')) {
                // Marquer comme lue et rediriger
                this.markAsRead(notification.id);
                if (notification.url) {
                    window.location.href = notification.url;
                }
            }
        });
        
        // Gérer la fermeture de la notification
        const closeButton = notificationItem.querySelector('.notification-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeNotification(notification.id);
        });
        
        return notificationItem;
    }
    
    /**
     * Formate une date en temps relatif (ex: "il y a 2 minutes")
     * @param {Date} date - La date à formater
     * @returns {string} - La date formatée
     */
    formatTimeAgo(date) {
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        
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
                return interval === 1 ? `il y a ${interval} ${unit}` : `il y a ${interval} ${unit}s`;
            }
        }
        
        return 'à l\'instant';
    }
    
    /**
     * Échappe les caractères HTML pour éviter les injections XSS
     * @param {string} text - Le texte à échapper
     * @returns {string} - Le texte échappé
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Marque une notification comme lue
     * @param {string} notificationId - L'ID de la notification à marquer comme lue
     */
    async markAsRead(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/mark_as_read/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors du marquage comme lue');
            }
            
            // Mettre à jour l'interface utilisateur
            const notificationItem = this.notificationList.querySelector(`[data-notif-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.classList.remove('unread');
                this.updateUnreadCount(Math.max(0, this.notificationCount - 1));
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            this.showErrorNotification('Impossible de marquer la notification comme lue');
        }
    }
    
    /**
     * Supprime une notification
     * @param {string} notificationId - L'ID de la notification à supprimer
     */
    async removeNotification(notificationId) {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression');
            }
            
            // Supprimer l'élément du DOM
            const notificationItem = this.notificationList.querySelector(`[data-notif-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.remove();
                
                // Afficher le message "Aucune notification" si la liste est vide
                if (this.notificationList.children.length === 0) {
                    const emptyItem = document.createElement('li');
                    emptyItem.className = 'notification-empty';
                    emptyItem.innerHTML = '<p>Aucune notification</p>';
                    this.notificationList.appendChild(emptyItem);
                }
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            this.showErrorNotification('Impossible de supprimer la notification');
        }
    }
    
    /**
     * Récupère le jeton CSRF depuis les cookies
     * @returns {string} - Le jeton CSRF
     */
    /**
     * Récupère le jeton CSRF depuis les cookies
     * @returns {string} - Le jeton CSRF
     */
    getCsrfToken() {
        const cookieValue = document.cookie.match('(^|;)\s*csrftoken\s*=\s*([^;]+)');
        return cookieValue ? cookieValue.pop() : '';
    }
    
    /**
     * Marque toutes les notifications comme lues
     */
    async markAllAsRead() {
        try {
            const response = await fetch('/api/notifications/mark_all_as_read/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error('Erreur lors du marquage comme lues');
            }
            
            // Mettre à jour l'interface utilisateur
            const unreadItems = this.notificationList.querySelectorAll('.notification-item.unread');
            unreadItems.forEach(item => {
                item.classList.remove('unread');
            });
            
            this.updateUnreadCount(0);
            
        } catch (error) {
            console.error('Erreur:', error);
            this.showErrorNotification('Impossible de marquer toutes les notifications comme lues');
        }
    }
    
    /**
     * Affiche une notification flottante
     * @param {Object} notification - Les données de la notification
     */
    showFloatingNotification(notification) {
        const container = document.getElementById('notifications-container');
        if (!container) return;
        
        const notif = document.createElement('div');
        notif.className = `floating-notification ${notification.type || 'info'}`;
        notif.dataset.notifId = notification.id;
        
        // Déterminer l'icône en fonction du type de notification
        let iconClass = 'info-circle';
        if (notification.type === 'success') iconClass = 'check-circle';
        else if (notification.type === 'warning') iconClass = 'exclamation-triangle';
        else if (notification.type === 'error') iconClass = 'exclamation-circle';
        
        notif.innerHTML = `
            <div class="floating-notification-icon">
                <i class="fas fa-${iconClass}"></i>
            </div>
            <div class="floating-notification-content">
                <h5>${this.escapeHtml(notification.title)}</h5>
                <p>${this.escapeHtml(notification.message)}</p>
            </div>
            <button class="floating-notification-close" title="Fermer">&times;</button>
            <div class="notification-progress"></div>
        `;
        
        container.appendChild(notif);
        
        // Animation d'entrée
        setTimeout(() => {
            notif.classList.add('show');
            
            // Démarrer la barre de progression
            const progressBar = notif.querySelector('.notification-progress');
            if (progressBar) {
                progressBar.style.animation = `progress ${notification.duration || 5000}ms linear`;
            }
        }, 10);
        
        // Fermeture automatique
        const duration = notification.duration || 5000;
        const autoClose = setTimeout(() => {
            this.closeFloatingNotification(notif);
        }, duration);
        
        // Fermeture manuelle
        const closeButton = notif.querySelector('.floating-notification-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            clearTimeout(autoClose);
            this.closeFloatingNotification(notif);
        });
        
        // Clic sur la notification
        notif.addEventListener('click', () => {
            clearTimeout(autoClose);
            this.closeFloatingNotification(notif);
            
            // Marquer comme lue et rediriger si une URL est fournie
            if (notification.id && !notification.id.startsWith('temp-')) {
                this.markAsRead(notification.id);
            }
            
            if (notification.url) {
                window.location.href = notification.url;
            }
        });
    }
    
    /**
     * Ferme une notification flottante
     * @param {HTMLElement} element - L'élément de notification à fermer
     */
    closeFloatingNotification(element) {
        if (!element) return;
        
        element.classList.remove('show');
        element.classList.add('hide');
        
        // Supprimer l'élément après l'animation
        setTimeout(() => {
            if (element.parentNode) {
                element.remove();
            }
        }, 300);
    }
    
    /**
     * Joue un son de notification
     */
    playNotificationSound() {
        try {
            // Réinitialiser le son s'il était en cours de lecture
            this.notificationSound.pause();
            this.notificationSound.currentTime = 0;
            
            // Lire le son
            this.notificationSound.play().catch(error => {
                console.warn('Impossible de lire le son de notification:', error);
            });
        } catch (error) {
            console.error('Erreur lors de la lecture du son:', error);
        }
    }
}

// Créer une instance unique du gestionnaire de notifications
const notificationManager = new NotificationManager();

// Exporter l'instance pour une utilisation dans d'autres modules
export default notificationManager;

// Initialiser le gestionnaire de notifications lorsque le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    // L'instance est déjà créée, cette partie est pour l'initialisation supplémentaire si nécessaire
    console.log('Gestionnaire de notifications initialisé');
});