document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleModeBtn');
  const dropdownToggle = document.getElementById('dropdownToggle');
  
  // Vérifier si l'élément btn existe avant de l'utiliser
  if (btn) {
    // Toggle dark/light mode
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      document.body.classList.toggle('light-mode');
      const mode = document.body.classList.contains('dark-mode') ? '🌞 Mode clair' : '🌙 Mode sombre';
      btn.textContent = mode;
      localStorage.setItem('admin-mode', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });

    // Charger le mode préféré
    const savedMode = localStorage.getItem('admin-mode') || 'light';
    document.body.classList.add(savedMode + '-mode');
    btn.textContent = savedMode === 'dark' ? '🌞 Mode clair' : '🌙 Mode sombre';
  }

  // Gestion du dropdown si l'élément existe
  if (dropdownToggle) {
    const dropdown = dropdownToggle.closest('.dropdown');
    
    // Activer le toggle du dropdown
    dropdownToggle.addEventListener('click', (e) => {
      e.preventDefault();
      dropdown?.classList.toggle('open');
    });

    // Fermer le dropdown en cliquant à l'extérieur
    document.addEventListener('click', (e) => {
      if (dropdown && !dropdown.contains(e.target) && !dropdownToggle.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  }
});
