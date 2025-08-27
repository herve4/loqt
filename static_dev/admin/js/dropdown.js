document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggleModeBtn');
  const dropdownToggle = document.getElementById('dropdownToggle');
  const dropdown = dropdownToggle?.closest('.dropdown');

  // Toggle dark/light mode
  btn?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    const mode = document.body.classList.contains('dark-mode') ? '🌞 Mode clair' : '🌙 Mode sombre';
    btn.textContent = mode;
    localStorage.setItem('admin-mode', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
  });

  // Load preferred mode
const savedMode = localStorage.getItem('admin-mode') || 'light';
  document.body.classList.add(savedMode + '-mode');
  btn.textContent = savedMode === 'dark' ? '🌞 Mode clair' : '🌙 Mode sombre';

  // Dropdown toggle
  // dropdownToggle?.addEventListener('click', () => {
  //   dropdown.classList.toggle('open');
  // });

  // // Close on click outside
  // document.addEventListener('click', (e) => {
  //   if (!dropdown.contains(e.target)) {
  //     dropdown.classList.remove('open');
  //   }
  // });
});
