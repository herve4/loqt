function togglePagination() {
  const pagination = document.getElementById('paginationContainer');
  const rows = Array.from(document.querySelectorAll('#materielTable tbody tr'));
  const visibleRows = rows.filter(row => row.style.display !== 'none');

  if (visibleRows.length === rows.length) {
    // Aucun filtre actif : afficher la pagination
    pagination.style.display = 'block';
  } else {
    // Filtrage actif : cacher la pagination
    pagination.style.display = 'none';
  }
}
