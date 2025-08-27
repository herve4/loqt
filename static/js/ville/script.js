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
                document.getElementById('modal-content').innerHTML = evt.detail.target.innerHTML;
                modal.style.display = 'block';
                evt.detail.target.innerHTML = '';
            }
            
        });
        
        // Fermer le modal
        closeBtn.onclick = function() {
            modal.style.display = 'none';
            window.location.reload();
        }
        
        // Fermer en cliquant à l'extérieur
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
                window.location.reload();
            }
        }
                


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
