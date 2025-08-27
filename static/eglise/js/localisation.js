document.addEventListener('DOMContentLoaded', () => {
const latInput = document.getElementById('id_latitude');
const lonInput = document.getElementById('id_longitude');
const mapContainer = document.getElementById('map');
const previewVille = document.getElementById('preview-ville');


latInput.type = 'hidden';
lonInput.type = 'hidden';
latInput.name = 'latitude';
lonInput.name = 'longitude';


    
  const hasLocation = sessionStorage.getItem("location_granted");

  if (hasLocation === null) {
    showLocationPopup();
  } else if (hasLocation === "true") {
    getUserLocation();
  } else {
    fallbackToManualSearch();
  }

  function showLocationPopup() {
    if (confirm("Souhaitez-vous partager votre position pour localiser votre église automatiquement ?")) {
      sessionStorage.setItem("location_granted", "true");
      getUserLocation();
    } else {
      sessionStorage.setItem("location_granted", "false");
      fallbackToManualSearch();
    }
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
  if (!L) return;

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
  return map;
}

function locateUser(map) {
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    document.getElementById('id_latitude').value = lat;
    document.getElementById('id_longitude').value = lon;
    map.setView([lat, lon], 13);
    L.marker([lat, lon]).addTo(map).bindPopup("Votre position").openPopup();
  }, () => {
    document.getElementById('manualLocationBlock').style.display = 'block';
    document.getElementById('manualMessage').style.display = 'block';
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
        map.setView([lat, lon], 13);
        L.marker([lat, lon]).addTo(map).bindPopup("Position choisie").openPopup();
      }
    });
}


if (hasLocation !== null){
  const popup = document.getElementById('geoPopup');
  popup.style.display = 'none';
  const map = initMap();
  locateUser(map);
}else{
const popup = document.getElementById('geoPopup');
const map = initMap();

window.onload = function() {
  
  const allowBtn = document.getElementById('acceptGeo');
  const denyBtn = document.getElementById('denyGeo');

  
  allowBtn.onclick = () => {
    popup.style.display = 'none';
    locateUser(map);
  };
  denyBtn.onclick = () => {
    popup.style.display = 'none';
    document.getElementById('manualLocationBlock').style.display = 'block';
    document.getElementById('manualMessage').style.display = 'block';
  };
};
}

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