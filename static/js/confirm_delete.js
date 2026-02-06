(function() {
    'use strict';
    
    // Variables privées
    let deleteUrl = '';
    let rowToDelete = null;
    let deletedData = null;
    const deletedMaterials = [];

    // Fonction utilitaire pour obtenir le token CSRF
    function getCSRFToken() {
        const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfTokenMeta) return csrfTokenMeta.getAttribute("content");
        const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        return cookie ? cookie.split('=')[1] : '';
    }

    // Fonction pour afficher le bouton d'annulation
    function showUndoButton() {
        const container = document.createElement('div');
        container.classList.add('undo-container');
        const duration = 10;

        const undoBtn = document.createElement('button');
        undoBtn.classList.add('btn-undo');
        let countdown = duration;
        undoBtn.textContent = `↩️ Annuler suppression (${countdown}s)`;

        const progress = document.createElement('div');
        progress.classList.add('undo-progress');

        container.appendChild(undoBtn);
        container.appendChild(progress);
        getMessageContainer().appendChild(container);

        const intervalId = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                undoBtn.textContent = `↩️ Annuler suppression (${countdown}s)`;
                progress.style.width = `${(countdown / duration) * 100}%`;
            } else {
                clearInterval(intervalId);
                container.remove();
            }
        }, 1000);

        progress.style.transition = `width ${duration}s linear`;
        progress.style.width = '0%';

        undoBtn.onclick = () => {
            clearInterval(intervalId);
            restoreRow();
            showMessage("✅ Matériel restauré !");
            container.remove();
        };
    }

    // Fonction pour ouvrir la modale de suppression
    function openDeleteModal(url, row, nomMateriel) {
        deleteUrl = url;
        rowToDelete = row;
        deletedData = {
            nom: nomMateriel,
            row: row
        };
        
        // Afficher la modale de confirmation
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        document.getElementById('materielName').textContent = nomMateriel;
        modal.show();
    }

    // Fonction pour fermer la modale de suppression
    function closeDeleteModal() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        if (modal) modal.hide();
    }

    // Fonction pour confirmer la suppression
    function confirmDelete() {
        if (!deleteUrl) return;
        
        fetch(deleteUrl, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                if (rowToDelete) {
                    deletedData.row = rowToDelete.cloneNode(true);
                    deletedMaterials.push(deletedData);
                    rowToDelete.remove();
                    showUndoButton();
                }
                showMessage("✅ " + (data.message || "Suppression réussie"));
            } else {
                showMessage("❌ " + (data.error || "Erreur lors de la suppression"), true);
            }
        })
        .catch(error => {
            console.error('Erreur:', error);
            showMessage("❌ Erreur lors de la suppression", true);
        })
        .finally(() => {
            closeDeleteModal();
            deleteUrl = '';
            rowToDelete = null;
        });
    }

    // Fonction pour restaurer la dernière suppression
    function restoreRow() {
        if (!deletedData || !deletedData.row) return;
        
        const tbody = document.querySelector('table tbody');
        if (tbody) {
            tbody.appendChild(deletedData.row);
            showMessage("✅ " + (deletedData.nom || "Élément") + " restauré avec succès");
        }
    }

    // Fonction pour afficher un message
    function showMessage(message, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
        messageDiv.textContent = message;
        
        const container = getMessageContainer();
        container.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Fonction utilitaire pour obtenir le conteneur de messages
    function getMessageContainer() {
        let container = document.getElementById('message-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'message-container';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '9999';
            document.body.appendChild(container);
        }
        return container;
    }

    // Gestionnaire d'événements DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        // Gestion de la corbeille
        const openTrashBtn = document.getElementById('openTrashBtn');
        const closeTrashModalBtn = document.getElementById('closeTrashModalBtn');
        const trashModal = document.getElementById('trashModal');

        // Fonction pour fermer la modale de corbeille
        function closeTrashModal() {
            if (trashModal) {
                trashModal.style.display = 'none';
                document.body.classList.remove('blurred');
            }
        }

        // Événements
        if (openTrashBtn && trashModal) {
            openTrashBtn.addEventListener('click', () => {
                trashModal.style.display = 'flex';
                document.body.classList.add('blurred');
            });
        }

        if (closeTrashModalBtn) {
            closeTrashModalBtn.addEventListener('click', closeTrashModal);
        }

        // Fermer la modale en cliquant à l'extérieur
        if (trashModal) {
            trashModal.addEventListener('click', (e) => {
                if (e.target === trashModal) {
                    closeTrashModal();
                }
            });
        }
    });

    // Fonction de restauration AJAX
    function restoreMateriel(id) {
        fetch(`/materiels/${id}/restore/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const trashedItem = document.getElementById(`trashed-${id}`);
                if (trashedItem) trashedItem.remove();
                showMessage("✅ Matériel restauré !");
            } else {
                showMessage("❌ " + (data.error || "Erreur inconnue"), true);
            }
        })
        .catch(() => showMessage("❌ Erreur de requête", true));
    }

    // Exposer uniquement les fonctions nécessaires globalement
    window.deleteVille = openDeleteModal;
    window.openDeleteModal = openDeleteModal;
    window.closeDeleteModal = closeDeleteModal;
    window.restoreMateriel = restoreMateriel;
})();