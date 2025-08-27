document.addEventListener('DOMContentLoaded', function() {

   // 1. Déclarez d'abord les fonctions comme variables globales
    window.validateStep = function(step) {
        let isValid = true;
        
        if (step === 1) {
            if (!validateField('last_name', 'text')) isValid = false;
            if (!validateField('first_name', 'text')) isValid = false;
            if (!validateField('email', 'email')) isValid = false;
            if (!validateField('phone', 'phone')) isValid = false;
        } 
        else if (step === 2) {
            const role = document.getElementById('selectedRole').value;
            if (!role) {
                showError('role', 'Sélectionnez un rôle');
                isValid = false;
            }
        }
        else if (step === 3) {
            if (!validateField('password1', 'password')) isValid = false;
            if (!validateField('password2', 'password')) isValid = false;
            if (!validateField('accept_terms', 'checkbox')) isValid = false;
            
            const p1 = document.getElementById('password1').value;
            const p2 = document.getElementById('password2').value;
            if (p1 && p2 && p1 !== p2) {
                showError('password1', 'Les mots de passe ne correspondent pas');
                showError('password2', 'Les mots de passe ne correspondent pas');
                isValid = false;
            }
        }

        return isValid;
    };

    window.validateAndGoToStep = function(current, next) {
    if (window.validateStep(current)) {
        window.changeStep(current, next);
    } else {
        const errorContainer = document.getElementById('form-error-container');
        if (errorContainer) {
            errorContainer.textContent = 'Veuillez remplir tous les champs correctement';
            errorContainer.style.display = 'block';
            errorContainer.style.animation = 'shake 0.3s ease-in-out';
            setTimeout(() => errorContainer.style.display = 'none', 5000);
        }
    }
};

    window.changeStep = function(current, next) {
        document.getElementById(`step${current}`).classList.remove('active');
        document.getElementById(`step${next}`).classList.add('active');
        
        document.querySelectorAll('.step-indicator').forEach(el => {
            el.textContent = `Étape ${next}/3`;
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    // 1. Initialisation de la sélection du rôle
    function initRoleSelection() {
        const roleCards = document.querySelectorAll('.permission-card');
        
        roleCards.forEach(card => {
            card.addEventListener('click', function() {
                // Retirer les sélections précédentes
                roleCards.forEach(c => c.classList.remove('active', 'error'));
                
                // Activer la carte sélectionnée
                this.classList.add('active');
                
                // Mettre à jour les champs de rôle
                const role = this.dataset.role;
                document.getElementById('selectedRole').value = role;
                document.getElementById('form_role').value = role;
                
                // Debug
                console.log('Rôle sélectionné:', role);
            });
        });

        // Sélection par défaut
        const defaultCard = document.querySelector('.permission-card[data-role="membre"]');
        if (defaultCard) defaultCard.click();
    }

    // 2. Fonctions pour basculer la visibilité du mot de passe
    function togglePasswordVisibility(fieldId) {
        const input = document.getElementById(fieldId);
        if (input) {
            const icon = input.parentNode.querySelector('.toggle-password i');
            input.type = input.type === 'password' ? 'text' : 'password';
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        }
    }

    // 3. Gestion des erreurs de formulaire
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message text-danger mt-2 small';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
        field.classList.add('is-invalid');
        
        // Highlight des cartes de rôle si erreur
        if (fieldId === 'selectedRole') {
            document.querySelectorAll('.permission-card').forEach(card => {
                card.classList.add('error');
            });
        }
    }

    function clearError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) errorElement.remove();
        
        field.classList.remove('is-invalid');
        
        if (fieldId === 'selectedRole') {
            document.querySelectorAll('.permission-card').forEach(card => {
                card.classList.remove('error');
            });
        }
    }

    // 4. Validation des champs
    function validateField(fieldId, type) {
        const field = document.getElementById(fieldId);
        if (!field) return true;

        const value = field.type === 'checkbox' ? field.checked : field.value.trim();
        clearError(fieldId);

        if (field.required && !value) {
            showError(fieldId, 'Ce champ est obligatoire');
            return false;
        }

        switch (type) {
            case 'email':
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    showError(fieldId, 'Email invalide');
                    return false;
                }
                break;
            case 'phone':
                if (value && !/^[0-9 +-]{10,20}$/.test(value)) {
                    showError(fieldId, 'Numéro invalide');
                    return false;
                }
                break;
            case 'password':
                if (value && value.length < 8) {
                    showError(fieldId, '8 caractères minimum');
                    return false;
                }
                break;
            case 'checkbox':
                if (!value) {
                    showError(fieldId, 'Vous devez accepter les conditions');
                    return false;
                }
                break;
        }

        return true;
    }

     // Déplacez cette fonction en haut de votre fichier ou déclarez-la globalement
  window.validateCurrentStep = function(step) {
      let isValid = true;
      
      if (step === 1) {
          if (!validateField('last_name', 'text')) isValid = false;
          if (!validateField('first_name', 'text')) isValid = false;
          if (!validateField('email', 'email')) isValid = false;
          if (!validateField('phone', 'phone')) isValid = false;
      } 
      else if (step === 2) {
          const role = document.getElementById('selectedRole').value;
          if (!role || !['pasteur', 'responsable', 'membre'].includes(role)) {
              showError('selectedRole', 'Veuillez sélectionner un rôle valide');
              isValid = false;
          }
      }
      else if (step === 3) {
          if (!validateField('password1', 'password')) isValid = false;
          if (!validateField('password2', 'password')) isValid = false;
          if (!validateField('accept_terms', 'checkbox')) isValid = false;
          
          const p1 = document.getElementById('password1').value;
          const p2 = document.getElementById('password2').value;
          if (p1 && p2 && p1 !== p2) {
              showError('password1', 'Les mots de passe ne correspondent pas');
              showError('password2', 'Les mots de passe ne correspondent pas');
              isValid = false;
          }
      }

      return isValid;
  };

    // 5. Validation des étapes
    function validateStep(step) {
        let isValid = true;
        
        if (step === 1) {
            if (!validateField('last_name', 'text')) isValid = false;
            if (!validateField('first_name', 'text')) isValid = false;
            if (!validateField('email', 'email')) isValid = false;
            if (!validateField('phone', 'phone')) isValid = false;
        } 
        else if (step === 2) {
            const role = document.getElementById('selectedRole').value;
            if (!role) {
                showError('role', 'Sélectionnez un rôle');
                isValid = false;
            }
        }
        else if (step === 3) {
            if (!validateField('password1', 'password')) isValid = false;
            if (!validateField('password2', 'password')) isValid = false;
            if (!validateField('accept_terms', 'checkbox')) isValid = false;
            
            // Vérification de la correspondance des mots de passe
            const p1 = document.getElementById('password1').value;
            const p2 = document.getElementById('password2').value;
            if (p1 && p2 && p1 !== p2) {
                showError('password1', 'Les mots de passe ne correspondent pas');
                showError('password2', 'Les mots de passe ne correspondent pas');
                isValid = false;
            }
        }

        return isValid;
    }

    // 6. Navigation entre les étapes
    function goToStep(current, next) {
        document.getElementById(`step${current}`).classList.remove('active');
        document.getElementById(`step${next}`).classList.add('active');
        
        // Mise à jour de l'indicateur d'étape
        document.querySelectorAll('.step-indicator').forEach(el => {
            el.textContent = `Étape ${next}/3`;
        });
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    window.validateAndGoToStep = function(current, next) {
        if (validateStep(current)) {
            goToStep(current, next);
        } else {
            // Feedback visuel
            const errorContainer = document.getElementById('form-error-container');
            if (errorContainer) {
                errorContainer.textContent = 'Veuillez remplir tous les champs correctement';
                errorContainer.style.display = 'block';
                errorContainer.style.animation = 'background 0.3s ease-in-out';
                setTimeout(() => errorContainer.style.display = 'none', 5000);
            }
        }
    };

    // 7. Soumission du formulaire (version optimisée)
async function submitForm() {
    const submitBtn = document.querySelector('.btn-submit');
    const errorContainer = document.getElementById('form-error-container');
    try {
        // Désactiver le bouton
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-text').textContent = 'Envoi en cours...';
        }

        // Validation des étapes
        if (!window.validateCurrentStep(1) || !window.validateCurrentStep(2) || !window.validateCurrentStep(3)) {
            if (errorContainer) {
                errorContainer.textContent = 'Veuillez corriger les erreurs dans le formulaire';
                errorContainer.style.display = 'block';
                errorContainer.style.animation = 'background 0.3s ease-in-out';
                setTimeout(() => errorContainer.style.display = 'none', 5000);
            }
            throw new Error('Veuillez corriger les erreurs dans le formulaire');
            
        }

        // Vérification des champs obligatoires
        const requiredFields = ['last_name', 'first_name', 'email', 'phone', 'password1', 'password2', 'accept_terms'];
        for (const field of requiredFields) {
            const element = document.getElementById(field);
            if (element && element.required && !element.value.trim()) {
                throw new Error(`Le champ ${field} est obligatoire`);
            }
        }

        // Préparation des données
        const formData = new FormData();
        const fields = ['last_name', 'first_name', 'email', 'phone', 'role', 'password1', 'password2'];
        
        fields.forEach(field => {
            const el = document.getElementById(field);
            if (el) formData.append(field, el.value.trim());
        });

        formData.append('accept_terms', document.getElementById('accept_terms').checked ? 'on' : '');

        const role = document.getElementById('selectedRole').value;
        if (!role || !['pasteur', 'responsable', 'membre'].includes(role)) {
            throw new Error('Sélection de rôle invalide');
        }
        formData.append('role', role);

        // Gestion de l'image
        const imageInput = document.getElementById('image');
        if (imageInput.files[0]) {
            const file = imageInput.files[0];
            const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
            const maxSize = 5 * 1024 * 1024; // 5MB
            
            if (!validTypes.includes(file.type)) {
                if (errorContainer) {
                    errorContainer.textContent = 'Format d\'image non supporté. Utilisez JPEG, PNG ou GIF.';
                    errorContainer.style.display = 'block';
                    errorContainer.style.animation = 'background 0.3s ease-in-out';
                    setTimeout(() => errorContainer.style.display = 'none', 5000);
                }
                clearImage();
                throw new Error("Format d'image non supporté. Utilisez JPEG, PNG ou GIF.");
            }
            
            if (file.size > maxSize) {
                if (errorContainer) {
                    errorContainer.textContent = `L'image est trop lourde (${(file.size/1024/1024).toFixed(1)}MB). Maximum: 5MB`;
                    errorContainer.style.display = 'block';
                    errorContainer.style.animation = 'background 0.3s ease-in-out';
                    setTimeout(() => errorContainer.style.display = 'none', 5000);
                }
                throw new Error(`L'image est trop lourde (${(file.size/1024/1024).toFixed(1)}MB). Maximum: 5MB`);
            }
            
            formData.append('image', file);
        }

        formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);

        // Envoi de la requête
        const response = await fetch(document.getElementById('mainForm').action, {
            method: 'POST',
            body: formData,
            headers: { 
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        // Vérification du content-type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            if (errorContainer) {
                errorContainer.textContent = `Réponse inattendue du serveur: ${text}`;
                errorContainer.style.display = 'block';
                errorContainer.style.animation = 'background 0.3s ease-in-out';
                setTimeout(() => errorContainer.style.display = 'none', 5000);
            }
            throw new Error(`Réponse inattendue du serveur`);
        }

        const data = await response.json();

        // Gestion des erreurs serveur
        if (!response.ok || !data.success) {
            if (data.errors) {
                Object.entries(data.errors).forEach(([field, errors]) => {
                    const errorMessage = Array.isArray(errors) ? errors.join(', ') : errors;
                    showError(field, errorMessage);
                });
            }

            if (errorContainer) {
                errorContainer.textContent = data.message || 'Erreur lors de la soumission';
                errorContainer.style.display = 'block';
                errorContainer.style.animation = 'background 0.3s ease-in-out';
                setTimeout(() => errorContainer.style.display = 'none', 5000);
            }
            throw new Error(data.message || 'Erreur lors de la soumission');
        }

        // Redirection
        if (data.redirect_url) {
            window.location.href = data.redirect_url;
        } else {
            if (errorContainer) {
                errorContainer.textContent = 'Réponse serveur incomplète';
                errorContainer.style.display = 'block';
                errorContainer.style.animation = 'background 0.3s ease-in-out';
                setTimeout(() => errorContainer.style.display = 'none', 5000);
            }
            throw new Error('Réponse serveur incomplète');
        }

    } catch (error) {
        console.error('Erreur:', error);
        const errorContainer = document.getElementById('form-error-container');
        if (errorContainer) {
            errorContainer.textContent = error.message.startsWith('<!DOCTYPE') 
                ? 'Erreur serveur - veuillez réessayer' 
                : error.message;
            errorContainer.style.display = 'block';
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = 'S\'inscrire';
        }
    }
}
    // 8. Initialisation
    function init() {
        initRoleSelection();

        // Gestion des mots de passe
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                togglePasswordVisibility(this.getAttribute('data-target'));
            });
        });

        // Validation en temps réel
        document.querySelectorAll('input[required]').forEach(input => {
            input.addEventListener('blur', function() {
                const types = {
                    email: 'email',
                    phone: 'phone',
                    password1: 'password',
                    password2: 'password',
                    accept_terms: 'checkbox'
                };
                validateField(this.id, types[this.id] || 'text');
            });
        });

        // Prévisualisation de l'image
        const imageInput = document.getElementById('image');
        if (imageInput) {
            imageInput.addEventListener('change', function(e) {
                const preview = document.getElementById('previewImage');
                const defaultIcon = document.querySelector('.default-icon');
                
                if (e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        preview.src = event.target.result;
                        preview.style.display = 'block';
                        defaultIcon.style.display = 'none';
                    };
                    reader.readAsDataURL(e.target.files[0]);
                }
            });
        }

        // Soumission du formulaire
        document.querySelector('.btn-submit').addEventListener('click', submitForm);
    }

    init();
});
// Initialisation des labels flottants
document.querySelectorAll('.floating input').forEach(input => {
    input.addEventListener('focus', function() {
        const label = this.nextElementSibling;
        label.style.top = '-10px';
        label.style.left = '30px';
        label.style.fontSize = '0.8rem';
        label.style.background = 'white';
        label.style.padding = '0 5px';
        label.style.color = '#6e8efb';
    });
    
    input.addEventListener('blur', function() {
        if (!this.value) {
            const label = this.nextElementSibling;
            label.style.top = '15px';
            label.style.left = '45px';
            label.style.fontSize = '1rem';
            label.style.background = 'transparent';
            label.style.padding = '0';
            label.style.color = '#888';
        }
    });
    
    // Initialiser les labels si le champ a déjà une valeur
    if (input.value) {
        const label = input.nextElementSibling;
        label.style.top = '-10px';
        label.style.left = '30px';
        label.style.fontSize = '0.8rem';
        label.style.background = 'white';
        label.style.padding = '0 5px';
        label.style.color = '#6e8efb';
    }
});


