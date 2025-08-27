  // Ciblage de tous les messages
  const messages = document.querySelectorAll('.message');
  const ding = document.getElementById('notifSound');

  messages.forEach((msg) => {
    // ✅ Joue le son à l'apparition
     // ✅ Lecture du son
    if (ding) {
      try {
        ding.currentTime = 0;
        ding.play().then(() => {
          // ⏱️ Arrêter la lecture après 2 secondes
          setTimeout(() => {
            
            ding.pause();
            ding.currentTime = 0; // Réinitialise le son
          }, 4000); // ⏱️ ici 4 secondes
        });
      } catch (e) {
        console.log("Lecture audio bloquée :", e);
      }
    }
    // Affichage en fondu pendant 5 secondes
    setTimeout(() => {
    //   msg.style.transition = 'opacity 0.5s ease';
    //   msg.style.opacity = '0';
      msg.classList.add('disappear');

      // Puis suppression du message après le fondu
      setTimeout(() => {
        msg.remove();
      }, 500);
    }, 20000); // durée avant disparition = 20 secondes
  });