const logistiqueSelect = document.getElementById('filterLogistique');


document.getElementById("searchInput").addEventListener("keyup", function () {
  const searchValue = this.value.toLowerCase();
  const rows = document.querySelectorAll("#materielTable tbody tr");

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchValue) ? "" : "none";
  });
});




document.querySelectorAll(".zoom-click").forEach(img => {
  img.addEventListener("click", function () {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImg");
    const modalDetails = document.getElementById("modalDetails");

    modalImg.src = this.dataset.image;
    modalDetails.innerHTML = `
      <h3>${this.dataset.nom}</h3>
      <p><strong>Catégorie :</strong> ${this.dataset.categorie}</p>
      <p><strong>Quantité :</strong> ${this.dataset.quantite}</p>
    `;
    modal.style.display = "block";
  });
});

document.querySelector(".close-modal").addEventListener("click", function () {
  document.getElementById("imageModal").style.display = "none";
});
window.addEventListener("click", function (e) {
  const modal = document.getElementById("imageModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});

 const categorieSelect = document.getElementById('filterCategorie');
  const sousCategorieSelect = document.getElementById('filterSousCategorie');
  const allSousCatOptions = Array.from(sousCategorieSelect.querySelectorAll('option[data-categorie]'));
  const tableRows = document.querySelectorAll('#materielTable tbody tr');

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
    const selectedCat = categorieSelect.value;
    const selectedSousCat = sousCategorieSelect.value;
    const selectedLogistique = logistiqueSelect.value;
    let visibleCount = 0;

    tableRows.forEach(row => {
      const rowCat = row.dataset.categorie;
      const rowSousCat = row.dataset.sousCategorie;
      const rowLogistique = row.dataset.logistique;

      const matchCat = !selectedCat || rowCat === selectedCat;
      const matchSousCat = !selectedSousCat || rowSousCat === selectedSousCat;
      const matchLogistique = !selectedLogistique || rowLogistique === selectedLogistique;

      const isVisible = matchCat && matchSousCat && matchLogistique;
      row.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;

      row.style.display = (matchCat && matchSousCat && matchLogistique) ? '' : 'none';
    });
    document.getElementById('count').textContent = visibleCount;
  }

  categorieSelect.addEventListener('change', () => {
    updateSousCategories();
    filterTable();
  });

  sousCategorieSelect.addEventListener('change', filterTable);
  logistiqueSelect.addEventListener('change', filterTable);

  // Initialisation au chargement
  document.addEventListener('DOMContentLoaded', () => {
    updateSousCategories();
  });

// document.getElementById("exportBtn").addEventListener("click", function () {
//     const params = new URLSearchParams(new FormData(document.getElementById("filters")));
//     window.location.href = `{% url 'export-materiels' %}?` + params.toString();
// });