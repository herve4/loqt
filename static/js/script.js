// Envelopper tout le code dans une IIFE
(function() {
    'use strict';
    
    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const avatar = document.getElementById('userAvatar');
    const dropdown = document.getElementById('userDropdown');
    const header = document.querySelector('.header');
    let isSidebarOpen = false;

    // Fonction pour ouvrir la sidebar
    const openSidebar = (e) => {
        if (e) e.preventDefault();
        isSidebarOpen = true;
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.classList.add('no-scroll');
    };

    // Fonction pour fermer la sidebar
    const closeSidebarFunc = (e) => {
        if (e) e.preventDefault();
        isSidebarOpen = false;
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.classList.remove('no-scroll');
    };

    // Gestionnaire d'événements pour le bouton de menu
    if (menuIcon) {
        menuIcon.addEventListener('click', openSidebar);
    }

    // Gestionnaire d'événements pour le bouton de fermeture
    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeSidebarFunc);
    }

    // Gestionnaire d'événements pour l'overlay
    if (overlay) {
        overlay.addEventListener('click', closeSidebarFunc);
    }

    if (avatar) {
        avatar.onclick = () => {
            dropdown.classList.toggle('show');
        };
    }

    window.onclick = function(e) {
        if (!e.target.matches('.user-avatar') && !e.target.closest('.user-avatar')) {
            if (dropdown) {
                dropdown.classList.remove('show');
            }
        }
    };

    // Gérer le toggle des sous-menus
    document.querySelectorAll('.submenu-toggle').forEach(toggle => {
        toggle.addEventListener('click', () => {
            toggle.parentElement.classList.toggle('open');
        });
    });

    // Effet header au scroll (ajoute une classe scrolled)
    const onScroll = () => {
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    };

    document.addEventListener('scroll', onScroll, { passive: true });
    
    // Initialisation au chargement
    onScroll();
})();