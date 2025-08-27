/**
 * Module WebSocket pour la gestion des notifications en temps réel
 * Ce module gère la connexion WebSocket, la réception des notifications
 * et leur affichage dans l'interface utilisateur.
 */

export class WebSocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000; // 3 secondes
        this.connected = false;
        this.eventHandlers = new Map();
        this.messageQueue = [];
        this.userId = document.body.getAttribute('data-user-id');
        this.notificationSound = new Audio('/static/sounds/notification.mp3');
        
        this.initialize();
    }

    /**
     * Initialise la connexion WebSocket
     */
    initialize() {
        if (!this.userId) {
            console.error('User ID not found. Cannot initialize WebSocket connection.');
            return;
        }

        // Déterminer le protocole WebSocket en fonction du protocole de la page
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const host = window.location.host;
        const wsUrl = `${protocol}${host}/ws/notifications/`;
        
        try {
            this.socket = new WebSocket(wsUrl);
            this.setupEventHandlers();
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Configure les gestionnaires d'événements WebSocket
     */
    setupEventHandlers() {
        this.socket.onopen = () => {
            console.log('WebSocket connection established');
            this.connected = true;
            this.reconnectAttempts = 0;
            this.processMessageQueue();
            
            // Envoyer un message de connexion
            this.send({
                type: 'connection_established',
                user_id: this.userId,
                timestamp: new Date().toISOString()
            });
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleIncomingMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket connection closed:', event);
            this.connected = false;
            this.scheduleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.connected = false;
        };
    }

    /**
     * Tente de se reconnecter en cas de déconnexion
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(() => {
            this.initialize();
        }, this.reconnectDelay * this.reconnectAttempts);
    }

    /**
     * Traite un message entrant
     * @param {Object} message - Le message reçu
     */
    handleIncomingMessage(message) {
        console.log('Message reçu:', message);
        
        // Vérifier si un gestionnaire spécifique existe pour ce type de message
        if (this.eventHandlers.has(message.type)) {
            const handlers = this.eventHandlers.get(message.type);
            handlers.forEach(handler => handler(message));
        }
        
        // Gestion des notifications
        if (message.type === 'notification') {
            this.showNotification(message.data);
        }
    }

    /**
     * Envoie un message via la connexion WebSocket
     * @param {Object} message - Le message à envoyer
     */
    send(message) {
        if (this.connected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.warn('WebSocket not connected. Queueing message:', message);
            this.messageQueue.push(message);
        }
    }

    /**
     * Traite la file d'attente des messages
     */
    processMessageQueue() {
        while (this.messageQueue.length > 0 && this.connected) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }

    /**
     * Affiche une notification à l'utilisateur
     * @param {Object} notification - Les données de la notification
     */
    showNotification(notification) {
        // Vérifier si les notifications sont autorisées
        if (Notification.permission === 'granted') {
            this.showBrowserNotification(notification);
        } else if (Notification.permission !== 'denied') {
            // Demander la permission si elle n'a pas encore été demandée
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showBrowserNotification(notification);
                } else {
                    this.showInAppNotification(notification);
                }
            });
        } else {
            this.showInAppNotification(notification);
        }
        
        // Jouer un son de notification
        this.playNotificationSound();
        
        // Mettre à jour le compteur de notifications non lues
        this.updateUnreadCount();
    }

    /**
     * Affiche une notification du navigateur
     * @param {Object} notification - Les données de la notification
     */
    showBrowserNotification(notification) {
        const options = {
            body: notification.message,
            icon: '/static/images/logo.png',
            badge: '/static/images/badge.png',
            tag: `notification-${notification.id}`,
            data: {
                url: notification.url || '/notifications/'
            }
        };

        const notificationObj = new Notification(notification.title, options);
        
        notificationObj.onclick = (event) => {
            event.preventDefault();
            window.focus();
            window.location.href = notificationObj.data.url;
            notificationObj.close();
        };
        
        // Fermer la notification après 10 secondes
        setTimeout(() => {
            notificationObj.close();
        }, 10000);
    }

    /**
     * Affiche une notification dans l'application
     * @param {Object} notification - Les données de la notification
     */
    showInAppNotification(notification) {
        // Créer l'élément de notification
        const notificationElement = document.createElement('div');
        notificationElement.className = 'notification';
        notificationElement.innerHTML = `
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <small>${new Date(notification.created_at).toLocaleString()}</small>
            </div>
            <button class="close-notification" aria-label="Fermer">&times;</button>
        `;

        // Ajouter la notification au conteneur
        const container = document.getElementById('notifications-container') || document.body;
        container.appendChild(notificationElement);

        // Gérer la fermeture de la notification
        const closeButton = notificationElement.querySelector('.close-notification');
        closeButton.addEventListener('click', () => {
            notificationElement.remove();
        });

        // Supprimer automatiquement après 10 secondes
        setTimeout(() => {
            if (notificationElement.parentNode) {
                notificationElement.remove();
            }
        }, 10000);
    }

    /**
     * Joue un son de notification
     */
    playNotificationSound() {
        try {
            this.notificationSound.play().catch(error => {
                console.warn('Could not play notification sound:', error);
            });
        } catch (error) {
            console.warn('Error playing notification sound:', error);
        }
    }

    /**
     * Met à jour le compteur de notifications non lues
     */
    updateUnreadCount() {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = currentCount + 1;
            badge.style.display = 'inline-block';
        }
    }

    /**
     * Enregistre un gestionnaire d'événements pour un type de message spécifique
     * @param {string} eventType - Le type d'événement à écouter
     * @param {Function} handler - La fonction de gestionnaire à appeler
     */
    on(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }

    /**
     * Supprime un gestionnaire d'événements
     * @param {string} eventType - Le type d'événement
     * @param {Function} handler - La fonction de gestionnaire à supprimer
     */
    off(eventType, handler) {
        if (this.eventHandlers.has(eventType)) {
            const handlers = this.eventHandlers.get(eventType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Ferme la connexion WebSocket
     */
    close() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Créer une instance unique du gestionnaire WebSocket
const webSocketManager = new WebSocketManager();

// Exporter l'instance pour une utilisation dans d'autres modules
export default webSocketManager;

// Initialiser la connexion WebSocket lors du chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Démarrer la connexion WebSocket
    if (webSocketManager) {
        console.log('WebSocket manager initialized');
    }
    
    // Demander la permission pour les notifications
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
});
