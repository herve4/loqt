let deleteUrl = '';
let rowToDelete = null;
let deletedData = null;
const deletedMaterials = [];

function getCSRFToken() {
  const csrfTokenMeta = document.querySelector('meta[name="csrf-token"]');
  if (csrfTokenMeta) return csrfTokenMeta.getAttribute("content");

  const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
  return cookie ? cookie.split('=')[1] : '';
}



function showUndoButton() {
  const container = document.createElement('div');
  container.classList.add('undo-container');
  const duration = 10;
  // const container = document.getElementById('undo-container')

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

function openDeleteModal(url, row, nomMateriel) {
  deleteUrl = url;
  console.log("URL de suppression :", url); // ⬅️ Vérifie ici
  rowToDelete = row;
  deletedData = {
    html: row.innerHTML,
    parent: row.parentNode,
    index: [...row.parentNode.children].indexOf(row),
    nom: nomMateriel,
    responsable: row.dataset.responsable,
    eglise: row.dataset.eglise,
    categorie: row.dataset.categorie,
    quantite: row.dataset.quantite,
  };


  let message = document.getElementById('deleteMessage').textContent = `Voulez-vous vraiment supprimer "${nomMateriel}" ?`;

  if (message) {
    document.getElementById('deleteModal').style.display = 'flex';
  }
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
}

document.getElementById('confirmDeleteBtn').addEventListener('click', function () {
  fetch(`${deleteUrl}`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': getCSRFToken(),
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json'
    }
  }).then(response => {
    if (response.ok) {
      showUndoButton();
      rowToDelete.classList.add('fade-out');
      setTimeout(() => {
        // Ajoute à la corbeille

        addToTrash(deletedData.nom, deletedData.responsable, deletedData.eglise, deletedData.categorie, deletedData.quantite, deletedData.html);
        


        rowToDelete.remove();
        showMessage("✅ Matériel supprimé avec sucess !");
        updateTrashUI();
        updateCount();
        checkPagination();
      }, 400);
    }else if (response.status === 403) {
      showMessage("❌ Suppression non autorisée, ce matériel n'appartient pas à votre église", true);
    } else if (response.status === 500) {
      showMessage("❌ Erreur interne du serveur !", true);
    } 
    else {
      showMessage("❌ Erreur lors de la suppression", true);
    }

    closeDeleteModal();
  }).catch(() => {
    showMessage("❌ Échec de la requête", true);
  });
  updateTrashUI();
});

document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);


function addToTrash(nom, responsable, eglise, categorie, quantite, html) {
          const trashedMaterial = {
            nom,
            responsable,
            eglise,
            categorie,
            quantite,
            html,
          };
          deletedMaterials.push(trashedMaterial);
          const trashedRow = document.createElement('tr');
          trashedRow.innerHTML = html;
          trashedRow.dataset.nom = nom;
          trashedRow.dataset.responsable = responsable;
          trashedRow.dataset.eglise = eglise;
          trashedRow.dataset.categorie = categorie;
          trashedRow.dataset.quantite = quantite;
          document.getElementById('trashBody').appendChild(trashedRow);
        }
function showMessage(message, error = false) {
  const msg = document.createElement('div');
  msg.className = error ? 'error' : 'success';
  msg.textContent = message;

  const container = getMessageContainer();
  container.appendChild(msg);
  container.style.display = 'block';
  container.style.background = error ? ' #FFEBEE' : ' #E8F5E9';
  container.style.borderLeft = error ? '5px solid #F44336' : '5px solid #4CAF50';
  setTimeout(() => {
    msg.remove()
    container.style.display = 'none';
  }, 6000);
}

function getMessageContainer() {
  let container = document.getElementById('messageContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'messageContainer';
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.right = '10px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }
  return container;
}

function restoreRow(data = deletedData) {
  const newRow = document.createElement('tr');
  newRow.innerHTML = data.html;
  const rows = data.parent.children;

  if (data.index >= rows.length) {
    data.parent.appendChild(newRow);
  } else {
    data.parent.insertBefore(newRow, rows[data.index]);
  }

  updateCount();
  checkPagination();
  // Supprime de la corbeille
  const index = deletedMaterials.indexOf(data);
  if (index > -1) {
    deletedMaterials.splice(index, 1);
    updateTrashUI();
  }
}

function updateCount() {
  const visibleRows = document.querySelectorAll('#materielTable tbody tr:not([style*="display: none"])');
  const countSpan = document.getElementById('count');
  if (countSpan) countSpan.textContent = visibleRows.length;
}

function checkPagination() {
  const pagination = document.querySelector('.pagination');
  const visibleRows = document.querySelectorAll('#materielTable tbody tr:not([style*="display: none"])');
  if (pagination) {
    pagination.style.display = visibleRows.length ? 'block' : 'none';
  }
}



function updateTrashUI() {
  const tbody = document.getElementById('trashTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (deletedMaterials.length === 0) {
    tbody.innerHTML = '<tr id="emptyTrashRow"><td colspan="4">Aucun matériel supprimé.</td></tr>';
    return;
  }

  deletedMaterials.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.nom}</td>
      <td>${item.categorie || '—'}</td>
      <td>${item.quantite || '—'}</td>
      <td>
        <button class="btn-restore" onclick="restoreRow(deletedMaterials[${index}])">Restaurer</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}





// Ouvrir / Fermer la corbeille
document.getElementById('openTrashBtn').addEventListener('click', () => {
  document.getElementById('trashModal').style.display = 'flex';
  document.body.classList.add('blurred');
});

function closeTrashModal() {
  document.getElementById('trashModal').style.display = 'none';
  document.body.classList.remove('blurred');

}

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
      document.getElementById(`trashed-${id}`).remove();
      showMessage("✅ Matériel restauré !");
    } else {
      showMessage("❌ " + (data.error || "Erreur inconnue"), true);
    }
  })
  .catch(() => showMessage("❌ Erreur de requête", true));
}


// function restoreFromTrash(id) {
//   fetch(`/materiels/${id}/restore/`, {
//     method: 'POST',
//     headers: {
//       'X-CSRFToken': getCSRFToken(),
//       'X-Requested-With': 'XMLHttpRequest'
//     }
//   }).then(res => res.json()).then(data => {
//     if (data.success) {
//       showMessage("✅ Matériel restauré !");
//       // optionnel : rafraîchir la liste ou enlever la ligne de la corbeille
//     } else {
//       showMessage("❌ " + (data.error || "Échec de la restauration"), true);
//     }
//   });
// }
