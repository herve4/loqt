    const menuIcon = document.getElementById('menuIcon');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const avatar = document.getElementById('userAvatar');
    const dropdown = document.getElementById('userDropdown');

    menuIcon.onclick = () => {
      sidebar.classList.add('active');
      overlay.style.display = 'block';
    }

    closeSidebar.onclick = () => {
      sidebar.classList.remove('active');
      overlay.style.display = 'none';
    }

    overlay.onclick = () => {
      sidebar.classList.remove('active');
      overlay.style.display = 'none';
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