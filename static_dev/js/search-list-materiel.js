document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById("searchInput");
  const quantiteInput = document.getElementById("qte");
  const categorieSelect = document.getElementById('filterCategorie');
  const sousCategorieSelect = document.getElementById('filterSousCategorie');
  const logistiqueSelect = document.getElementById('filterLogistique');
  const exportVisible = document.getElementById('exportVisible');
  const countSpan = document.getElementById('count');
  const noResultMsg = document.getElementById('noResultMsg');
  const tableRows = Array.from(document.querySelectorAll('#materielTable tbody tr'));
  const allSousCatOptions = Array.from(sousCategorieSelect.querySelectorAll('option[data-categorie]'));

  function updateSousCategories() {
    const selectedCatId = categorieSelect.value;
    sousCategorieSelect.innerHTML = '<option value="">-- Toutes les sous-catégories --</option>';

    allSousCatOptions.forEach(option => {
      if (!selectedCatId || option.dataset.categorie === selectedCatId) {
        sousCategorieSelect.appendChild(option.cloneNode(true));
      }
    });

  }

  function filterTable() {
    const searchValue = searchInput.value.toLowerCase();
    const selectedCat = categorieSelect.value;
    const selectedSousCat = sousCategorieSelect.value;
    const selectedLogistique = logistiqueSelect.value;
    const selectedQuantite = quantiteInput.value.trim();

    let visibleCount = 0;

    tableRows.forEach(row => {
      const rowNom = row.textContent.toLowerCase();
      const rowCat = row.dataset.categorie || '';
      const rowSousCat = row.dataset.sousCategorie || '';
      const rowLogistique = row.dataset.logistique || '';
      const rowQuantite = row.dataset.quantite || '';

      const matchSearch = !searchValue || rowNom.includes(searchValue);
      const matchCat = !selectedCat || rowCat === selectedCat;
      const matchSousCat = !selectedSousCat || rowSousCat === selectedSousCat;
      const matchLogistique = !selectedLogistique || rowLogistique === selectedLogistique;
      const matchQuantite = !selectedQuantite || rowQuantite === selectedQuantite;

      const isVisible = matchSearch && matchCat && matchSousCat && matchLogistique && matchQuantite;
      row.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    togglePagination();
    countSpan.textContent = visibleCount;
    noResultMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    exportVisible.style.display = visibleCount === 0 ? 'none' : 'inline-block';
  }

  // Événements
  searchInput.addEventListener('keyup', () => {
    filterTable();
    togglePagination();
  });
  quantiteInput.addEventListener('input', () => {
    filterTable();
    togglePagination();
  });
  categorieSelect.addEventListener('change', () => {
    updateSousCategories();
    filterTable();
    togglePagination();
  });
  sousCategorieSelect.addEventListener('change', () => {
    filterTable();
    togglePagination();
  });
  logistiqueSelect.addEventListener('change', () => {
    filterTable();
    togglePagination();
  });

  // Initialisation
  updateSousCategories();
  filterTable();
  togglePagination();

});








function NewExport(){
  document.getElementById("exportVisible2").addEventListener("click", function () {
  const rows = Array.from(document.querySelectorAll("#materielTable tbody tr"));
  const headers = Array.from(document.querySelectorAll("#materielTable thead th")).map(th => th.textContent.trim());

  const visibleData = rows
    .filter(row => row.style.display !== "none")
    .map(row => {
      return Array.from(row.querySelectorAll("td")).map(cell => cell.innerText.trim());
    });

  if (visibleData.length === 0) {
    alert("Aucune donnée à exporter !");
    return;
  }

  // Construction de la feuille Excel
  const ws_data = [headers, ...visibleData];
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Matériels Visibles");

  XLSX.writeFile(wb, "materiels_visibles.xlsx");
});
}




document.getElementById('exportVisible').addEventListener('click', () => {
  const visibleData = [];

  document.querySelectorAll('#materielTable tbody tr').forEach(row => {
    if (row.style.display !== 'none') {
      const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
      visibleData.push(cells);
    }
  });

  // Envoie via Fetch API à Django
  fetch("/materiels/export/", {
    method: "POST",
    headers: {
      "X-CSRFToken": "{{ csrf_token }}",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ data: visibleData })
  })
  .then(res => {
    if (res.ok) return res.blob();
    throw new Error("Erreur lors de l'exportation.");
  })
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MaterielsFiltres.xlsx';
    link.click();
  })
  .catch(err => alert(err.message));
});
