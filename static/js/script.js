    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const avatar = document.getElementById('userAvatar');
    const dropdown = document.getElementById('userDropdown');
    const header = document.querySelector('.header');

    menuIcon.onclick = () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.classList.add('no-scroll');
    }

    closeSidebar.onclick = () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }

    overlay.onclick = () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.classList.remove('no-scroll');
    }

    if (avatar) {
      avatar.onclick = () => {
        dropdown.classList.toggle('show');
      };
    }

    window.onclick = function(e) {
      if (!e.target.matches('.user-avatar')) {
        if (dropdown) dropdown.classList.remove('show');
      }
    }

// Gérer le toggle des sous-menus
document.querySelectorAll('.submenu-toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    toggle.parentElement.classList.toggle('open');
  });
});

// Fermer la sidebar avec la touche ECHAP
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    sidebar.classList.remove('active');
    overlay.classList.remove('active', 'fade');
    document.body.classList.remove('no-scroll');
  }
});

// Effet header au scroll (ajoute une classe scrolled)
const onScroll = () => {
  if (!header) return;
  if (window.scrollY > 4) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
};
document.addEventListener('scroll', onScroll, { passive: true });
// init au chargement
onScroll();