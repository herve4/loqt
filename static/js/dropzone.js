document.addEventListener("DOMContentLoaded", function () {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('id_image');
  const preview = document.getElementById('preview');
  const previewContainer = document.getElementById('previewContainer');
  const dropzoneText = document.getElementById('dropzoneText');
  const removeImageBtn = document.getElementById('removeImage');
  const errorMsg = document.getElementById('errorMsg');

//   dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', handleFile);


  function handleFile() {
    const file = fileInput.files[0];
    if (file && file.type.startsWith('image/')) {
      errorMsg.textContent = '';
      const reader = new FileReader();
      reader.onload = e => {
        preview.src = e.target.result;
        previewContainer.style.display = 'inline-block';
        dropzoneText.style.display = 'none';
      };
      reader.readAsDataURL(file);
    } else {
      errorMsg.textContent = "Veuillez sélectionner une image valide (JPG, PNG, etc.)";
      clearImage();
    }
  }

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#ff4800';
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = '#ccc';
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#ccc';
    fileInput.files = e.dataTransfer.files;
    handleFile();
  });

  removeImageBtn.addEventListener('click', () => {
    clearImage();
  });

  function clearImage() {
    fileInput.value = '';
    preview.src = '';
    previewContainer.style.display = 'none';
    dropzoneText.style.display = 'inline';
  }




})