

document.addEventListener('DOMContentLoaded', function() {
  // Toggle password visibility
  const togglePassword = document.querySelector('#togglePassword');
  const password = document.querySelector('#password');
  
  togglePassword.addEventListener('click', function() {
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye-slash');
    this.querySelector('i').classList.toggle('fa-eye');
  });
  
  // Form submission loader
  const form = document.querySelector('form');
  const submitBtn = document.querySelector('#submitBtn');
  const loader = document.querySelector('#loader');
  const btnText = submitBtn.querySelector('.btn-text');
  
  if (form) {
    form.addEventListener('submit', function() {
      btnText.style.visibility = 'hidden';
      loader.style.display = 'block';
      submitBtn.disabled = true;
    });
  }
  
  // Play notification sound if there are messages
  const messages = document.querySelector('.messages');
  const notifSound = document.getElementById('notifSound');
  
  if (messages && notifSound) {
    notifSound.play().catch(e => console.log("Audio play failed:", e));
  }
});