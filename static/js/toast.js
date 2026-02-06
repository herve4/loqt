// Vérifier si ToastSystem est déjà défini
if (typeof ToastSystem === 'undefined') {
// Déclaration de la classe ToastSystem
class ToastSystem {
    constructor() {
        this.container = document.getElementById('toast-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Écouter les messages Django
        const djangoMessages = document.querySelector('.messages');
        if (djangoMessages) {
            const messages = djangoMessages.querySelectorAll('.message');
            messages.forEach(msg => {
                const type = msg.classList.contains('success') ? 'success' :
                             msg.classList.contains('error') ? 'error' :
                             msg.classList.contains('warning') ? 'warning' : 'info';
                this.show(msg.textContent.trim(), type);
            });
            djangoMessages.remove();
        }
        
        // Écouter les événements personnalisés
        document.addEventListener('show-toast', (e) => {
            if (e.detail) {
                this.show(e.detail.message, e.detail.type, e.detail.duration);
            }
        });
    }
    
    show(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon ${this.getIconClass(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">&times;</button>
            <div class="toast-progress"></div>
        `;
        
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide(toast));
        
        this.container.appendChild(toast);
        
        // Démarrer l'animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Masquer automatiquement après la durée spécifiée
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }
        
        return toast;
    }
    
    hide(toast) {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });
    }
    
    getIconClass(type) {
        switch(type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-info-circle';
        }
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    if (!window.toastSystem) {
        window.toastSystem = new ToastSystem();
    }
});

// Fonction helper globale
function showToast(message, type = 'info', duration = 5000) {
    // Si le système de toast est prêt, on l'utilise
    if (window.toastSystem && window.toastSystem.show) {
        return window.toastSystem.show(message, type, duration);
    }
    
    // Sinon, on attend que le DOM soit chargé
    const initToast = () => {
        if (!window.toastSystem) {
            window.toastSystem = new ToastSystem();
        }
        window.toastSystem.show(message, type, duration);
        document.removeEventListener('DOMContentLoaded', initToast);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToast);
    } else {
        initToast();
    }
}

// Exposer la fonction globalement
    window.showToast = showToast;
} // Fin de la condition de vérification de ToastSystem