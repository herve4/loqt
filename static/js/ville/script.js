   // Gestion du modal
document.addEventListener('DOMContentLoaded', function() {
        
        
        const modal = document.getElementById('ville-modal');
        const closeBtn = document.querySelector('.close-modal');
        
        // Ouvrir le modal
        document.body.addEventListener('htmx:afterSwap', function(evt) {
            if (evt.detail.target.id === 'ville-form-container' || 
                evt.detail.target.id.includes('ville-') && 
                (evt.detail.target.id.includes('-name') || 
                 evt.detail.target.id.includes('-region'))) {
                // Sauvegarder le contenu original
                const content = evt.detail.target.innerHTML;
                // Vider la cible HTMX
                evt.detail.target.innerHTML = '';
                
                // Mettre à jour le contenu de la modale
                const modalContent = document.getElementById('modal-content');
                if (modalContent) {
                    modalContent.innerHTML = content;
                    // Afficher la modale avec une légère attente pour permettre le rendu
                    setTimeout(() => {
                        modal.style.display = 'flex';
                        modal.style.opacity = '1';
                        document.body.classList.add('no-scroll');
                    }, 10);
                }
            }
        });
        
        // Fermer le modal (helper)
        function closeModalAndRefresh() {
            if (modal) {
                // Animation de fermeture
                modal.style.opacity = '0';
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.body.classList.remove('no-scroll');
                    // Vider le contenu de la modale après l'animation
                    const modalContent = document.getElementById('modal-content');
                    if (modalContent) {
                        modalContent.innerHTML = '';
                    }
                    // Recharger la page uniquement si nécessaire
                    if (window.location.search.includes('saved=') || window.location.search.includes('deleted=')) {
                        window.location.reload();
                    }
                }, 300);
            }
        }

        // Bouton fermer
        closeBtn.onclick = closeModalAndRefresh;
        
        // Fermer en cliquant à l'extérieur
        window.onclick = function(event) {
            if (event.target === modal) {
                closeModalAndRefresh();
            }
        }

        // Fermer avec Échap
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closeModalAndRefresh();
            }
        });
        // Réagir aux créations via HTMX (HX-Trigger)
        document.body.addEventListener('regionAdded', function() {
            closeModalAndRefresh();
        });
        document.body.addEventListener('villeAdded', function() {
            closeModalAndRefresh();
        });
        
    });

document.addEventListener('DOMContentLoaded', function() {

    // Gestion personnalisée de la suppression
    document.body.addEventListener('htmx:afterRequest', function(evt) {
        if (evt.detail.successful && evt.detail.requestConfig.verb === 'delete') {
            // Animation de disparition
            const target = evt.detail.requestConfig.target;
            const row = document.querySelector(target);
            if (row) {
                row.style.transition = 'opacity 0.3s';
                row.style.opacity = '0';
                setTimeout(() => row.remove(), 300);
            }
        }
    });
});

async function deleteVille(villeUrl, villeName, elementHtml) {
    if (confirm(`Souhaitez-vous vraiment supprimer la ville ${villeName} ?`)) {
        try {
            const response = await fetch(`${villeUrl}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': "{{csrf_token }}",
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'

            });

            if (response.status === 404) {
                // Animation et suppression
                const row = elementHtml.closest('tr');
                row.style.opacity = '0';
                setTimeout(() => row.remove(), 300);
            } else {
                alert("Erreur lors de la suppression");
            }
        } catch (error) {
            console.error("Erreur:", error);
        }
    }
}
