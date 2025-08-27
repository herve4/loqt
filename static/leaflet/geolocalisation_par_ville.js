// Géocodage adresse (OpenStreetMap Nominatim)
  function locateOnMaps() {
    const villeInput = document.getElementById('id_ville');
    if (!villeInput.value || !villeInput.value.trim()) return;

    const ville = villeInput.value.trim();
    
    fetch(`/api/geocode/?q=${encodeURIComponent(ville)}`)
      .then(res => res.json())
        .then(data => {
          
          if (!data || data.length === 0) {
            console.warn("Ville non trouvée.");
            return;
          }

          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          if (!map) {
            map = L.map("map").setView([lat, lon], 10);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            marker = L.marker([lat, lon]).addTo(map);
          } else {
            map.setView([lat, lon], 10);
            marker.setLatLng([lat, lon]);
          }
        })
        .catch(error => {
        console.error("Erreur de géolocalisation :", error);
      });
  }

  // Géolocalisation automatique
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 14);
      marker.setLatLng([latitude, longitude]);
    });
  }