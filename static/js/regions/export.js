// ============================================
// FONCTIONS D'EXPORTATION
// ============================================

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

// Récupérer les données depuis l'API d'export
async function getTableData() {
    try {
        // Afficher un indicateur de chargement
        const loadingToast = window.showToast ? window.showToast('Récupération des données en cours...', 'info') : null;
        
        // Appeler l'API d'export des régions
        const response = await fetch('/api/regions/export/', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        // Formater les en-têtes pour correspondre au format attendu
        const headers = result.headers.map(header => ({
            key: header.toLowerCase().replace(/\s+/g, '_'),
            label: header
        }));
        
        // Formater et trier les données par ID
        const data = result.data
            .map(item => {
                const formattedItem = {};
                headers.forEach((header, index) => {
                    const key = header.key;
                    formattedItem[key] = item[key.toLowerCase()] || '';
                });
                return formattedItem;
            })
            .sort((a, b) => parseInt(a.id) - parseInt(b.id));
        
        return { headers, data };
    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        if (window.showToast) {
            window.showToast('Erreur lors de la récupération des données', 'error');
        }
        return { headers: [], data: [] };
    }
}

// Exporter en CSV
async function exportToCSV() {
    try {
        const { headers, data } = await getTableData();
        if (!headers.length || !data.length) {
            window.showToast('Aucune donnée à exporter', 'warning');
            return;
        }
        
        // Créer les lignes CSV
        const date = formatDate(new Date(), 'YYYY-MM-DD');
        let csv = headers.map(h => `"${h.label}"`).join(';') + '\r\n';
        data.forEach(row => {
            const rowData = headers.map(header => {
                const value = String(row[header.key] || '').replace(/"/g, '""');
                return `"${value}"`;
            });
            csv += rowData.join(';') + '\r\n';
        });
        
        downloadFile('\ufeff' + csv, `regions_${date}.csv`, 'text/csv;charset=utf-8;');
        
        if (window.showToast) {
            window.showToast('Export CSV réussi', 'success');
        }
    } catch (error) {
        console.error('Erreur lors de l\'export CSV:', error);
        if (window.showToast) {
            window.showToast('Erreur lors de l\'export CSV', 'error');
        }
    }
}

// Exporter en Excel
async function exportToExcel() {
    try {
        if (typeof XLSX === 'undefined') {
            throw new Error('La bibliothèque XLSX n\'est pas chargée');
        }
        
        const { headers, data } = await getTableData();
        if (!headers.length || !data.length) {
            window.showToast('Aucune donnée à exporter', 'warning');
            return;
        }
        
        const date = formatDate(new Date(), 'YYYY-MM-DD');
        
        // Créer un nouveau classeur
        const wb = XLSX.utils.book_new();
        
        // Préparer les données pour Excel
        const excelData = [
            headers.map(h => h.label),
            ...data.map(row => headers.map(header => row[header.key] || ''))
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Ajouter la feuille au classeur
        XLSX.utils.book_append_sheet(wb, ws, 'Régions');
        
        // Générer le fichier Excel
        XLSX.writeFile(wb, `regions_${date}.xlsx`);
        
        if (window.showToast) {
            window.showToast('Export Excel réussi', 'success');
        }
    } catch (error) {
        console.error('Erreur lors de l\'export Excel:', error);
        if (window.showToast) {
            window.showToast('Erreur lors de l\'export Excel', 'error');
        }
    }
}

// Exporter en PDF
async function exportToPDF() {
    try {
        if (typeof jspdf === 'undefined' || typeof jspdf.jsPDF === 'undefined') {
            throw new Error('La bibliothèque jsPDF n\'est pas chargée');
        }
        
        const { headers, data } = await getTableData();
        if (data.length === 0) {
            showToast('Aucune donnée à exporter', 'warning');
            return;
        }
        
        const date = formatDate(new Date(), 'YYYY-MM-DD');
        
        // Créer un nouveau document PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Ajouter un titre
        doc.setFontSize(18);
        doc.text('Liste des régions', 14, 20);
        
        // Ajouter la date d'export
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Exporté le: ${formatDate(new Date(), 'DD/MM/YYYY à HH:mm')}`, 14, 30);
        
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
                fontSize: 9,
                cellPadding: 3,
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            headStyles: { 
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { 
                left: 14, 
                right: 14,
                top: 50
            },
            didDrawPage: function(data) {
                // Pied de page
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, pageHeight - 10);
            }
        });
        
        // Télécharger le PDF
        doc.save(`regions_${date}.pdf`);
        
        if (window.showToast) {
            window.showToast('Export PDF réussi', 'success');
        }
    } catch (error) {
        console.error('Erreur lors de l\'export PDF:', error);
        if (window.showToast) {
            window.showToast('Erreur lors de l\'export PDF', 'error');
        }
    }
}

// Initialisation des gestionnaires d'événements d'export
document.addEventListener('DOMContentLoaded', function() {
    // S'assurer que les fonctions sont bien dans la portée globale
    window.exportToCSV = window.exportToCSV || exportToCSV;
    window.exportToExcel = window.exportToExcel || exportToExcel;
    window.exportToPDF = window.exportToPDF || exportToPDF;
    
    // Initialiser les tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialiser les popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Fermer le menu d'exportation lors d'un clic en dehors
    document.addEventListener('click', function(event) {
        const exportButton = document.getElementById('exportDropdown');
        const dropdownMenu = document.querySelector('.dropdown-menu[aria-labelledby="exportDropdown"]');
        
        // Si le clic est en dehors du bouton et du menu déroulant
        if (exportButton && dropdownMenu && 
            !exportButton.contains(event.target) && 
            !dropdownMenu.contains(event.target)) {
            // Fermer le menu déroulant
            const dropdown = bootstrap.Dropdown.getInstance(exportButton);
            if (dropdown) {
                dropdown.hide();
            }
        }
    });
});
