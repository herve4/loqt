document.addEventListener('DOMContentLoaded', () => {
const latInput = document.getElementById('id_latitude');
const lonInput = document.getElementById('id_longitude');
const mapContainer = document.getElementById('map');
const previewVille = document.getElementById('preview-ville');


latInput.type = 'hidden';
lonInput.type = 'hidden';
latInput.name = 'latitude';
lonInput.name = 'longitude';


    // Attendre que Leaflet (L) soit disponible avant d'initialiser la carte
 function onLeafletReady(callback) {
   if (window.L) return callback();
   let tries = 0;
   const maxTries = 100; // ~5s
   const timer = setInterval(() => {
     if (window.L) {
       clearInterval(timer);
       callback();
     } else if (++tries >= maxTries) {
       clearInterval(timer);
       console.error('Leaflet n\'a pas été chargé.');
     }
   }, 50);
 }
  const shouldAsk = (!latInput.value && !lonInput.value);
  // Toujours afficher notre popup personnalisé si aucune coordonnée n'est renseignée
  if (shouldAsk) {
    showLocationPopup();
  }

  function showLocationPopup() {
    const popup = document.getElementById('geoPopup');
    if (!popup) return;
    popup.classList.add('active');
    document.body.classList.add('no-scroll');
    const allowBtn = document.getElementById('acceptGeo');
    const denyBtn = document.getElementById('denyGeo');
    const closeBtn = document.getElementById('closeGeo');
    const spinner = document.getElementById('geoSpinner');

    function ensureMap(cb) {
      if (mapInstance) return cb(mapInstance);
      onLeafletReady(() => {
        const map = initMap();
        cb(map);
      });
    }

    if (allowBtn) {
      allowBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (spinner) spinner.style.display = 'block';
        allowBtn.disabled = true;
        if (denyBtn) denyBtn.disabled = true;
        if (closeBtn) closeBtn.disabled = true;
        ensureMap((map) => {
          locateUser(
            map,
            () => {
              if (spinner) spinner.style.display = 'none';
              popup.classList.remove('active');
              document.body.classList.remove('no-scroll');
              allowBtn.disabled = false;
              if (denyBtn) denyBtn.disabled = false;
              if (closeBtn) closeBtn.disabled = false;
            },
            () => {
              if (spinner) spinner.style.display = 'none';
              popup.classList.remove('active');
              document.body.classList.remove('no-scroll');
              allowBtn.disabled = false;
              if (denyBtn) denyBtn.disabled = false;
              if (closeBtn) closeBtn.disabled = false;
            }
          );
        });
      };
    }

    const handleDeny = (e) => {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      popup.classList.remove('active');
      document.body.classList.remove('no-scroll');
      if (spinner) spinner.style.display = 'none';
      document.getElementById('manualLocationBlock').style.display = 'block';
      document.getElementById('manualMessage').style.display = 'block';
      fallbackToManualSearch();
    };

    if (denyBtn) denyBtn.onclick = handleDeny;
    if (closeBtn) closeBtn.onclick = handleDeny;
  }

  function getUserLocation() {
    if (!navigator.geolocation) {
      fallbackToManualSearch();
      return;
    }

    navigator.geolocation.getCurrentPosition(success => {
      const { latitude, longitude } = success.coords;
      latInput.value = latitude;
      lonInput.value = longitude;

      displayMap(latitude, longitude);
    }, error => {
      fallbackToManualSearch();
    });
  }

  function fallbackToManualSearch() {
    const villeInput = document.querySelector('[name="ville"]');
    villeInput.addEventListener("input", () => {
      const query = villeInput.value;
      if (query.length > 2) {
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
          .then(res => res.json())
          .then(data => {
            if (data.length > 0) {
              const result = data[0];
              const latitude = result.lat;
              const longitude = result.lon;

              latInput.value = latitude;
              lonInput.value = longitude;
              displayMap(latitude, longitude);
              previewVille.textContent = result.display_name;
            }
          });
      }
    });
  }


let mapInstance = null; // globale

function displayMap(lat, lon) {
  if (typeof L === 'undefined') return;

  if (mapInstance !== null) {
    mapInstance.remove(); // détruire l’ancienne carte proprement
  }

  mapInstance = L.map(mapContainer).setView([lat, lon], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap',
  }).addTo(mapInstance);

  const marker = L.marker([lat, lon]).addTo(mapInstance);
  marker.bindPopup("📍 Position détectée").openPopup();

  mapInstance.on('click', function (e) {
    const { lat, lng } = e.latlng;
    latInput.value = lat;
    lonInput.value = lng;
    marker.setLatLng([lat, lng]);
    marker.bindPopup("📍 Position mise à jour").openPopup();
  });
}



function initMap(lat = 7.5, lon = -5.5) {
  const map = L.map('map').setView([lat, lon], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  let marker;
  map.on('click', function(e) {
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    document.getElementById('id_latitude').value = e.latlng.lat;
    document.getElementById('id_longitude').value = e.latlng.lng;
  });
  // exposer l'instance globalement
  mapInstance = map;
  return map;
}

function locateUser(map, done, fail) {
  const options = { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 };
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    document.getElementById('id_latitude').value = lat;
    document.getElementById('id_longitude').value = lon;
    map.setView([lat, lon], 13);
    L.marker([lat, lon]).addTo(map).bindPopup("Votre position").openPopup();
    if (typeof done === 'function') done(true);
  }, (err) => {
    document.getElementById('manualLocationBlock').style.display = 'block';
    document.getElementById('manualMessage').style.display = 'block';
    if (window.showToast) {
      const msg = err && err.code === 1 ? "Permission de géolocalisation refusée." : "Géolocalisation indisponible ou expirée (8s).";
      window.showToast(msg + " Vous pouvez saisir l'adresse manuellement.", 'warning', 6000);
    } else {
      alert('La géolocalisation a échoué. Veuillez saisir votre adresse manuellement.');
    }
    if (typeof fail === 'function') fail(err);
  });

    // Exemple après obtention de la position
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        document.getElementById("id_latitude").value = position.coords.latitude;
        document.getElementById("id_longitude").value = position.coords.longitude;
    });
    }

}

function searchAddress() {
  const query = document.getElementById('searchAddress').value;
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        const lat = data[0].lat;
        const lon = data[0].lon;
        document.getElementById('id_latitude').value = lat;
        document.getElementById('id_longitude').value = lon;
        if (mapInstance) {
          mapInstance.setView([lat, lon], 13);
          L.marker([lat, lon]).addTo(mapInstance).bindPopup("Position choisie").openPopup();
        }
      }
    });
}


// Plus de double initialisation en bas; la logique ci-dessus décide déjà quoi faire

});








  document.addEventListener("DOMContentLoaded", () => {
    const steps = document.querySelectorAll(".step");
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");
    const submitBtn = document.getElementById("submit-btn");
    const progressBar = document.getElementById("progressBar");

    let currentStep = 0;
    const totalSteps = steps.length;

    steps[currentStep].classList.add("active");
    updateButtons();
    updateProgress();

    prevBtn.addEventListener("click", () => {
      if (currentStep > 0) {
        steps[currentStep].classList.remove("active");
        currentStep--;
        steps[currentStep].classList.add("active");
        updateButtons();
        updateProgress();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentStep < steps.length - 1) {
        steps[currentStep].classList.remove("active");
        currentStep++;
        steps[currentStep].classList.add("active");
        updateButtons();
        updateProgress();
      }
    });

    function updateButtons() {
      prevBtn.disabled = currentStep === 0;
      nextBtn.style.display = currentStep < totalSteps - 1 ? "inline-block" : "none";
      submitBtn.style.display = currentStep === totalSteps - 1 ? "inline-block" : "none";
    }

    function updateProgress() {
      const progress = ((currentStep + 1) / totalSteps) * 100;
      progressBar.style.width = `${progress}%`;
    }

     updatePreview();
  });

 
   // Live preview
    function updatePreview() {
      const nom = document.getElementById("id_nom");
      const pasteur = document.getElementById("id_pasteur");
      const phone = document.getElementById("id_phone");
      const region = document.getElementById("id_region");
      const ville = document.getElementById("id_ville");
      const image_id = document.getElementById("id_image");
      const previewImage = document.getElementById("preview-image")

      if (nom) document.getElementById("preview-nom").textContent = nom.value || "-";
      if (pasteur) document.getElementById("preview-pasteur").textContent = pasteur.options[pasteur.selectedIndex]?.text || "-";
      if (phone) document.getElementById("preview-phone").textContent = phone.value || "-";
      if (region) document.getElementById("preview-region").textContent = region.options[region.selectedIndex]?.text || "-";
      if (ville) document.getElementById("preview-ville").textContent = ville.options[ville.selectedIndex]?.text || "-";
      
      if (image_id.files && image_id.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
            previewImage.src = e.target.result;
            }
            reader.readAsDataURL(image_id.files[0]);
        }

  }