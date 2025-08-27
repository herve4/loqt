// Import des modules
import { CalendarUI } from './calendar/ui.js';

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
  // Initialisation du calendrier
  const calendarUI = new CalendarUI('calendar');
  
  // Rendre les fonctions accessibles globalement si nécessaire
  window.calendarUI = calendarUI;
  window.showEventDetails = (eventId) => {
    // Utilisez la méthode de l'instance calendarUI
    calendarUI.showEventDetails(eventId);
  };

  // Gestion des onglets
  const tabs = document.querySelectorAll('.event-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Désactiver tous les onglets
      document.querySelectorAll('.event-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.event-tab-content').forEach(c => c.classList.remove('active'));
      
      // Activer l'onglet sélectionné
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });

  // Filtrage du tableau
  const filterEventsTable = () => {
    const typeFilter = document.getElementById('filterType')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('filterStatus')?.value?.toLowerCase() || '';
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    
    const rows = document.querySelectorAll('#eventsTableBody tr');
    
    rows.forEach(row => {
      const type = row.querySelector('td:nth-child(2)')?.textContent?.toLowerCase() || '';
      const title = row.querySelector('td:nth-child(1)')?.textContent?.toLowerCase() || '';
      const status = row.querySelector('td:nth-child(3)')?.textContent?.toLowerCase() || '';
      
      const matchesType = !typeFilter || type.includes(typeFilter);
      const matchesStatus = !statusFilter || status.includes(statusFilter);
      const matchesSearch = !searchTerm || title.includes(searchTerm);
      
      row.style.display = matchesType && matchesStatus && matchesSearch ? '' : 'none';
    });
  };

  // Ajout des écouteurs d'événements pour le filtrage
  const filterType = document.getElementById('filterType');
  const filterStatus = document.getElementById('filterStatus');
  const searchInput = document.getElementById('searchInput');
  
  if (filterType) filterType.addEventListener('change', filterEventsTable);
  if (filterStatus) filterStatus.addEventListener('change', filterEventsTable);
  if (searchInput) searchInput.addEventListener('input', filterEventsTable);

  // Bouton nouveau événement
  const newEventBtn = document.getElementById('newEventBtn');
  if (newEventBtn) {
    newEventBtn.addEventListener('click', () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      calendarUI.showCreateEventForm(today, tomorrow);
    });
  }

  // Initialisation du stepper pour les détails d'événement
  function initStepper() {
    const steps = document.querySelectorAll('#eventStepper .event-step');
    const prevBtn = document.getElementById('stepperPrev');
    const nextBtn = document.getElementById('stepperNext');
    const indicator = document.getElementById('stepperIndicator');
    let currentStep = 0;
    let autoInterval = null;
    let isPaused = false;

        function updateStepper(scroll = true) {
          steps.forEach((step, idx) => {
            step.classList.toggle('active', idx === currentStep);
            if (scroll && idx === currentStep) {
              step.scrollIntoView({behavior: 'smooth', inline: 'center', block: 'nearest'});
            }
          });
          if (indicator) indicator.textContent = (currentStep + 1) + ' / ' + steps.length;
          if (prevBtn) prevBtn.disabled = steps.length <= 1;
          if (nextBtn) nextBtn.disabled = steps.length <= 1;
        }

        function goToStep(idx) {
          currentStep = Math.max(0, Math.min(idx, steps.length - 1));
          updateStepper();
        }

        function nextStep() {
          currentStep = (currentStep + 1) % steps.length;
          updateStepper();
        }

        function prevStep() {
          currentStep = (currentStep - 1 + steps.length) % steps.length;
          updateStepper();
        }

        // Auto défilement
        function startAuto() {
          stopAuto();
          autoInterval = setInterval(() => {
            if (!isPaused) nextStep();
          }, 3500);
        }
        function stopAuto() {
          if (autoInterval) clearInterval(autoInterval);
        }

        // Pause au survol
        const stepper = document.getElementById('eventStepper');
        if (stepper) {
          stepper.addEventListener('mouseenter', () => { isPaused = true; });
          stepper.addEventListener('mouseleave', () => { isPaused = false; });
        }

        // Boutons
        if (prevBtn) prevBtn.onclick = () => { prevStep(); };
        if (nextBtn) nextBtn.onclick = () => { nextStep(); };

        // Clavier
        document.addEventListener('keydown', function(e) {
          if (!document.getElementById('eventDetailsPopup').classList.contains('active')) return;
          if (e.key === 'ArrowLeft') { prevStep(); }
          if (e.key === 'ArrowRight') { nextStep(); }
        });

        // Clic sur une étape
        steps.forEach((step, idx) => {
          step.onclick = () => { goToStep(idx); };
        });

        // Init
        if (steps.length > 0) {
          updateStepper();
          startAuto();
        }
      }

      
      
      const content = `
        <div class="event-detail-header">
          <div>
            <h2 style="margin-bottom:0.2em;">
              <i class="fa fa-calendar-alt" style="color:#007bff;"></i> ${data.titre}
            </h2>
            <div class="event-detail-meta">
              <span><i class="fa fa-clock"></i> ${data.dates}</span>
              <span><i class="fa fa-user"></i> ${data.organisateur}</span>
            </div>
          </div>
          <div class="event-detail-export">
            <button class="export-btn" title="Exporter en PDF" onclick="exportChrono('pdf')"><i class="fa fa-file-pdf"></i></button>
            <button class="export-btn" title="Exporter en Word" onclick="exportChrono('word')"><i class="fa fa-file-word"></i></button>
            <button class="export-btn" title="Exporter en Excel" onclick="exportChrono('excel')"><i class="fa fa-file-excel"></i></button>
          </div>
        </div>
        <div class="event-section">
          <p><strong>Type:</strong> <span class="event-badge badge-${data.type_evenement}">${data.type}</span></p>
          ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
        </div>
        ${programmeHtml}
        ${materielsHtml}
        <button class="btn btn-warning" onclick="openEditEventPopup(${eventId})">Modifier l'Événement</button>
      `;

      
      document.getElementById('eventDetailsContent').innerHTML = content;
      openPopup('eventDetailsPopup');
      // Appelle le stepper après injection du HTML
      if (data.programme.length > 0) {
        initStepper();
      }
    });


function showCreateEventForm(start, end) {
      
      const dateDebutInput = document.getElementById('id_date_debut');
      const dateFinInput = document.getElementById('id_date_fin');
      if (dateDebutInput && dateFinInput) {
        dateDebutInput.value = start.toISOString().slice(0, 16);
        dateFinInput.value = end.toISOString().slice(0, 16);
      }
      openPopup('eventCreatePopup');
      
   
}



function openPopup(popupId) {
  document.getElementById('popupOverlay').style.display = 'block';
  document.getElementById(popupId).classList.add('active');
  document.body.style.overflow = 'hidden';
  
}

function closePopup() {
  document.getElementById('popupOverlay').style.display = 'none';
  document.querySelectorAll('.event-popup').forEach(popup => {
    popup.classList.remove('active');
  });
  document.querySelectorAll('.event-popup-create').forEach(popup => {
    popup.classList.remove('active');
  });
  document.body.style.overflow = '';
}



function openEditEventPopup(eventId) {
  fetch(`/evenements/detail/modifier/${eventId}/`)
    .then(r => r.text())
    .then(html => {
      document.getElementById('eventEditContent').innerHTML = html;
      openPopup('eventEditPopup');
      // Chronogramme dynamique
      document.getElementById('chronoTable').addEventListener('click', function() {
        const tbody = document.querySelector('#chronoTable tbody');
        const tr = tbody.querySelector('tr').cloneNode(true);
        tr.querySelectorAll('input').forEach(input => input.value = '');
        tbody.appendChild(tr);
      });
      document.querySelector('#chronoTable').addEventListener('click', function(e) {
        if (e.target.closest('.chrono-remove')) {
          const rows = this.querySelectorAll('tbody tr');
          if (rows.length > 1) e.target.closest('tr').remove();
        }
      });
      // Soumission AJAX
      document.getElementById('eventEditForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch(`/evenements/detail/modifier/${eventId}/`, {
          method: 'POST',
          body: formData
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            closePopup();
            //window.location.reload();
            window.location.href = '/evenements/'; // Recharger les événements du calendrier
          } else {
            alert('Erreur : ' + (data.error || 'Une erreur est survenue.'));
          }
        })
        .catch(() => alert('Erreur réseau'));
      });
    });
}

// Fonction pour exporter le chronogramme
function exportChrono(format) {
  const title = document.querySelector('.event-detail-header h2')?.textContent?.trim() || 'Chronogramme';
  const meta = document.querySelector('.event-detail-meta');
  const date = meta ? meta.querySelector('span:nth-child(1)')?.textContent?.trim() || '' : '';
  const orga = meta ? meta.querySelector('span:nth-child(2)')?.textContent?.trim() || '' : '';
  
  const rows = Array.from(document.querySelectorAll('#eventStepper .event-step')).map(step => {
    const heure = step.querySelector('.event-step-time')?.textContent?.trim() || '';
    const titre = step.querySelector('.event-step-title')?.textContent?.trim() || '';
    const resp = step.querySelector('.event-step-resp')?.textContent?.replace('Responsable:', '').trim() || '';
    const desc = step.querySelector('.event-step-desc')?.textContent?.trim() || '';
    return [heure, titre, resp, desc];
  });
  
  const headers = ['Heure', 'Titre', 'Responsable', 'Description'];
  const cleanTitle = title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');

  try {
    if (format === 'pdf' && window.jspdf) {
      const doc = new window.jspdf.jsPDF();
      doc.text(title, 14, 16);
      doc.text(date, 14, 24);
      doc.text(orga, 14, 32);
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 40,
        styles: { 
          fontSize: 10,
          cellPadding: 2,
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });
      doc.save(`${cleanTitle}_chronogramme.pdf`);
      
    } else if (format === 'excel' && window.XLSX) {
      const ws_data = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Chronogramme");
      
      // Style pour l'en-tête
      if (ws['!cols'] === undefined) ws['!cols'] = [];
      headers.forEach((_, i) => {
        ws['!cols'][i] = { wch: Math.max(...ws_data.map(row => (row[i] || '').toString().length)) + 2 };
      });
      
      XLSX.writeFile(wb, `${cleanTitle}_chronogramme.xlsx`);
      
    } else if (format === 'word') {
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2c3e50; }
            .meta { color: #7f8c8d; margin-bottom: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th { background-color: #3498db; color: white; text-align: left; padding: 8px; }
            td { border: 1px solid #ddd; padding: 8px; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">
            <div>${date}</div>
            <div>${orga}</div>
          </div>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rows.map(row => 
                `<tr>${row.map(cell => 
                  `<td>${cell.replace(/\n/g, '<br>')}</td>`
                ).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cleanTitle}_chronogramme.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } else {
      throw new Error('Format non supporté ou bibliothèque manquante');
    }
  } catch (error) {
    console.error('Erreur lors de l\'exportation:', error);
    alert(`Erreur lors de l'exportation en ${format.toUpperCase()}: ${error.message}`);
  }
}






 function openMaterielPopup() {
        document.getElementById('popupMateriel').style.display = 'block';
    }
    
    function closeMaterielPopup() {
        document.getElementById('popupMateriel').style.display = 'none';
    }
    
    // Exemple de gestion des responsables (à adapter)
    document.querySelectorAll('.add-resp').forEach(button => {
        button.addEventListener('click', function() {
            const matId = this.getAttribute('data-mat');
            const responsablesList = this.nextElementSibling;
            
            const newResp = document.createElement('div');
            newResp.innerHTML = `
                <select name="responsable_${matId}[]" style="margin-top:5px;">
                    <option value="1">Jean Dupont</option>
                    <option value="2">Marie Martin</option>
                    <option value="3">Pierre Durand</option>
                </select>
                <button type="button" class="btn btn-outline-danger btn-sm" onclick="this.parentNode.remove()">×</button>
            `;
            
            responsablesList.appendChild(newResp);
        });
    });
    
    // Gestion de la soumission du formulaire
    document.getElementById('materielReservationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Formulaire soumis! (fonctionnalité à implémenter)');
        closeMaterielPopup();
    });


