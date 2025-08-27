class ImageUploader {
    constructor() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.realtimePreviews = document.getElementById('realtimePreviews');
        this.uploadSpinner = document.getElementById('uploadSpinner');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.uploadSpeed = document.getElementById('uploadSpeed');
        this.uploadQueue = [];
        this.workers = [];
        this.MAX_WORKERS = 4;
        this.initialize();
    }

    initialize() {
        this.createWorkers();
        this.setupEventListeners();
    }

    createWorkers() {
        for (let i = 0; i < this.MAX_WORKERS; i++) {
            const worker = {
                id: i,
                busy: false,
                worker: this.createWorker()
            };
            this.workers.push(worker);
        }
    }

    createWorker() {
        if (window.Worker) {
            const workerCode = `
                self.onmessage = function(e) {
                    const file = e.data.file;
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        self.postMessage({
                            id: e.data.id,
                            previewUrl: event.target.result
                        });
                    };
                    reader.readAsDataURL(file);
                };
            `;
            const blob = new Blob([workerCode], {type: 'application/javascript'});
            return new Worker(URL.createObjectURL(blob));
        }
        return null;
    }

    setupEventListeners() {
        this.dropZone.addEventListener('dragover', this.handleDragOver.bind(this));
        this.dropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.dropZone.addEventListener('drop', this.handleDrop.bind(this));
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.dropZone.classList.add('highlight');
    }

    handleDragLeave() {
        this.dropZone.classList.remove('highlight');
    }

    handleDrop(e) {
        e.preventDefault();
        this.dropZone.classList.remove('highlight');
        this.processFiles(e.dataTransfer.files);
    }

    handleFileSelect() {
        if (this.fileInput.files.length) {
            this.processFiles(this.fileInput.files);
            this.fileInput.value = '';
        }
    }

    processFiles(files) {
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (imageFiles.length === 0) return;
        
        this.uploadQueue.push(...imageFiles);
        this.processQueue();
        this.uploadFiles(imageFiles);
    }

    processQueue() {
        const availableWorker = this.workers.find(w => !w.busy);
        if (availableWorker && this.uploadQueue.length > 0) {
            const file = this.uploadQueue.shift();
            availableWorker.busy = true;
            this.updateSpinner();
            
            if (availableWorker.worker) {
                availableWorker.worker.postMessage({
                    id: availableWorker.id,
                    file: file
                });
                
                availableWorker.worker.onmessage = (e) => {
                    this.displayPreview(e.data.previewUrl);
                    availableWorker.busy = false;
                    this.processQueue();
                };
            } else {
                // Fallback pour navigateurs sans Web Workers
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.displayPreview(e.target.result);
                    availableWorker.busy = false;
                    this.processQueue();
                };
                reader.readAsDataURL(file);
            }
        }
    }

    displayPreview(previewUrl) {
        const previewId = 'preview-' + Date.now();
        const previewItem = document.createElement('div');
        previewItem.className = 'realtime-preview';
        previewItem.id = previewId;
        
        const img = document.createElement('img');
        img.src = previewUrl;
        img.alt = 'Prévisualisation';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-preview';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => previewItem.remove();
        
        previewItem.appendChild(img);
        previewItem.appendChild(removeBtn);
        this.realtimePreviews.appendChild(previewItem);
    }

    uploadFiles(files) {
        this.progressContainer.style.display = 'flex';
        this.progressBar.style.width = '0%';
        this.progressText.textContent = '0%';
        
        const formData = new FormData();
        files.forEach(file => formData.append('images', file));
        
        const xhr = new XMLHttpRequest();
        xhr.open('POST', window.location.href, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('X-CSRFToken', this.getCookie('csrftoken'));
        
        let lastLoaded = 0;
        let lastTime = Date.now();
        
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                this.progressBar.style.width = percent + '%';
                this.progressText.textContent = percent + '%';
                
                const now = Date.now();
                const timeDiff = (now - lastTime) / 1000;
                if (timeDiff > 0.5) {
                    const loadedDiff = e.loaded - lastLoaded;
                    const speed = this.formatSpeed(loadedDiff / timeDiff);
                    this.uploadSpeed.textContent = speed;
                    lastLoaded = e.loaded;
                    lastTime = now;
                }
            }
        };
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                this.progressBar.style.backgroundColor = '#4CAF50';
                setTimeout(() => {
                    this.progressContainer.style.display = 'none';
                }, 1000);
            }
        };
        
        xhr.send(formData);
    }

    updateSpinner() {
        const anyWorkerBusy = this.workers.some(w => w.busy);
        this.uploadSpinner.style.display = anyWorkerBusy ? 'block' : 'none';
    }

    formatSpeed(bytesPerSecond) {
        if (bytesPerSecond < 1024) return Math.round(bytesPerSecond) + ' B/s';
        if (bytesPerSecond < 1024 * 1024) return Math.round(bytesPerSecond / 1024) + ' KB/s';
        return (bytesPerSecond / (1024 * 1024)).toFixed(1) + ' MB/s';
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
}

// Initialisation quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new ImageUploader();
});


function getSousCategories() {
    const categorieId = document.getElementById('id_categorie').value;
    const sousCategorieSelect = document.getElementById('id_sous_categorie');
    
    if (categorieId) {
        fetch(`/get_sous_categories/?categorie_id=${categorieId}`)
            .then(response => response.json())
            .then(data => {
                sousCategorieSelect.innerHTML = '';
                data.forEach(sousCategorie => {
                    const option = document.createElement('option');
                    option.value = sousCategorie.id;
                    option.textContent = sousCategorie.nom;
                    sousCategorieSelect.appendChild(option);
                });
            });
    } else {
        sousCategorieSelect.innerHTML = '<option value="">---------</option>';
    }
}

// Charger les sous-catégories au chargement de la page si une catégorie est déjà sélectionnée
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('id_categorie').value) {
        getSousCategories();
    }
});