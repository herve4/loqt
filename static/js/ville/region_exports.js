// Fonction utilitaire pour formater la date
function formatDate(date, format = 'YYYY-MM-DD') {
    const pad = num => num.toString().padStart(2, '0');
    const replacements = {
        'YYYY': date.getFullYear(),
        'MM': pad(date.getMonth() + 1),
        'DD': pad(date.getDate()),
        'HH': pad(date.getHours()),
        'mm': pad(date.getMinutes()),
        'ss': pad(date.getSeconds())
    };
    
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match]);
}

// Fonction pour télécharger un fichier
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

// Récupérer les données du tableau HTML
function getTableData() {
    const table = document.querySelector('table');
    if (!table) return { headers: [], data: [] };
    
    // Récupérer les en-têtes
    const headers = [];
    table.querySelectorAll('th').forEach(th => {
        headers.push({
            key: th.getAttribute('data-field') || th.innerText.trim().toLowerCase().replace(/\s+/g, '_'),
            label: th.innerText.trim()
        });
    });
    
    // Récupérer les données
    const data = [];
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
        const rowData = {};
        const cells = row.querySelectorAll('td');
        
        cells.forEach((cell, index) => {
            if (headers[index]) {
                rowData[headers[index].key] = cell.innerText.trim();
            }
        });
        
        if (Object.keys(rowData).length > 0) {
            data.push(rowData);
        }
    });
    
    return { headers, data };
}

// Exporter en CSV
function exportToCSV() {
    try {
        const { headers, data } = getTableData();
        if (data.length === 0) {
            showToast('Aucune donnée à exporter', 'warning');
            return;
        }
        
        // Créer les lignes CSV
        const headerRow = headers.map(h => `"${h.label}"`).join(',');
        const dataRows = data.map(row => 
            headers.map(h => {
                const value = row[h.key] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            }).join(',')
        );
        
        const csvContent = [headerRow, ...dataRows].join('\n');
        const fileName = `export_regions_${formatDate(new Date(), 'YYYY-MM-DD')}.csv`;
        
        downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
        showToast('Export CSV réussi', 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'export CSV:', error);
        showToast('Erreur lors de l\'export CSV', 'error');
    }
}

// Exporter en Excel
function exportToExcel() {
    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('La bibliothèque XLSX n\'est pas chargée');
        }
        
        const { headers, data } = getTableData();
        if (data.length === 0) {
            showToast('Aucune donnée à exporter', 'warning');
            return;
        }
        
        // Préparer les données pour XLSX
        const xlsxData = data.map(row => {
            const newRow = {};
            headers.forEach(header => {
                newRow[header.label] = row[header.key] || '';
            });
            return newRow;
        });
        
        // Créer un nouveau classeur
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(xlsxData);
        
        // Ajouter la feuille de calcul au classeur
        XLSX.utils.book_append_sheet(wb, ws, 'Régions');
        
        // Générer le fichier Excel
        const fileName = `export_regions_${formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('Export Excel réussi', 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'export Excel:', error);
        showToast('Erreur lors de l\'export Excel', 'error');
    }
}

// Exporter en PDF
function exportToPDF() {
    try {
        const { headers, data } = getTableData();
        if (data.length === 0) {
            showToast('Aucune donnée à exporter', 'warning');
            return;
        }
        
        // Créer un nouveau document PDF
        const doc = new jspdf.jsPDF();
        
        // Ajouter un titre
        doc.setFontSize(18);
        doc.text('Liste des régions', 14, 22);
        
        // Ajouter la date
        doc.setFontSize(10);
        doc.text(`Exporté le: ${new Date().toLocaleDateString()}`, 14, 30);
        
        // Préparer les données pour le tableau
        const tableData = data.map(row => 
            headers.map(header => row[header.key] || '')
        );
        
        // Ajouter le tableau
        doc.autoTable({
            head: [headers.map(h => h.label)],
            body: tableData,
            startY: 40,
            styles: { 
                fontSize: 10,
                cellPadding: 3,
                valign: 'middle'
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 10 }
        });
        
        // Sauvegarder le PDF
        const fileName = `export_regions_${formatDate(new Date(), 'YYYY-MM-DD')}.pdf`;
        doc.save(fileName);
        
        showToast('Export PDF réussi', 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        showToast('Erreur lors de l\'export PDF', 'error');
    }
}

// Afficher une notification
function showToast(message, type = 'info', title = '') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast show align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    const toastHeader = title ? `
        <div class="toast-header">
            <strong class="me-auto">${title}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Fermer"></button>
        </div>
    ` : '';
    
    toast.innerHTML = `
        ${toastHeader}
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fermer"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Supprimer la notification après 5 secondes
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // S'assurer que les fonctions sont disponibles globalement
    window.exportToCSV = exportToCSV;
    window.exportToExcel = exportToExcel;
    window.exportToPDF = exportToPDF;
    
    // Gestionnaire pour les boutons d'export
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-export="csv"]')) {
            exportToCSV();
        } else if (e.target.matches('[data-export="excel"]')) {
            exportToExcel();
        } else if (e.target.matches('[data-export="pdf"]')) {
            exportToPDF();
        }
    });
});
