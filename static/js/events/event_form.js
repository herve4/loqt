// Initialisation des champs de date avec Flatpickr
document.addEventListener('DOMContentLoaded', function() {
    // Configuration de base pour les dates
    const dateOptions = {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        locale: 'fr',
        minDate: 'today'
    };

    // Initialisation des champs de date
    const dateDebut = document.getElementById('id_date_debut');
    const dateFin = document.getElementById('id_date_fin');
    
    if (dateDebut) {
        flatpickr(dateDebut, {
            ...dateOptions,
            onChange: function(_, dateStr) {
                if (dateFin && dateFin._flatpickr) {
                    dateFin._flatpickr.set('minDate', dateStr);
                }
            }
        });
    }

    if (dateFin) {
        flatpickr(dateFin, dateOptions);
    }

    // Gestion des champs de lieu conditionnels
    const egliseRadio = document.getElementById('eglise_radio');
    const autreLieuRadio = document.getElementById('autre_lieu_radio');
    const egliseField = document.getElementById('eglise_field');
    const autreLieuField = document.getElementById('autre_lieu_field');

    function updateLieuFields() {
        if (egliseRadio.checked) {
            egliseField.style.display = 'block';
            autreLieuField.style.display = 'none';
            document.getElementById('id_lieu').value = '';
        } else {
            egliseField.style.display = 'none';
            autreLieuField.style.display = 'block';
            document.getElementById('id_eglise').value = '';
        }
    }

    if (egliseRadio && autreLieuRadio) {
        egliseRadio.addEventListener('change', updateLieuFields);
        autreLieuRadio.addEventListener('change', updateLieuFields);
        updateLieuFields();
    }

    // Aperçu de l'image
    const imageInput = document.getElementById('id_image');
    const imagePreview = document.getElementById('imagePreview');
    
    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imagePreview.src = event.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Validation du formulaire
    const form = document.querySelector('form.needs-validation');
    if (form) {
        form.addEventListener('submit', (event) => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    }
});
