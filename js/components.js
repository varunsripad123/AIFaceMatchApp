/* ============================================
   NEXWAVE - Reusable UI Components
   ============================================ */

// Progress Modal state
let progressModalState = {
    steps: [],
    currentStep: 0,
    isVisible: false
};

// Show progress modal
function showProgressModal(title, steps) {
    progressModalState = {
        steps: steps,
        currentStep: 0,
        isVisible: true
    };

    const modal = document.getElementById('progress-modal');
    const titleEl = document.getElementById('progress-title');
    const stepsEl = document.getElementById('progress-steps');
    const progressBar = document.getElementById('progress-bar');

    titleEl.textContent = title;

    // Render steps
    stepsEl.innerHTML = steps.map((step, index) => `
        <div class="progress-step ${index === 0 ? 'active' : ''}" id="progress-step-${index}">
            <div class="progress-step-icon">${index + 1}</div>
            <div class="progress-step-text">${escapeHtml(step)}</div>
        </div>
    `).join('');

    progressBar.style.width = '0%';
    modal.classList.add('active');
}

// Update progress modal step
function updateProgressStep(stepIndex, completed = false) {
    progressModalState.currentStep = stepIndex;

    const steps = document.querySelectorAll('.progress-step');
    const progressBar = document.getElementById('progress-bar');

    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index < stepIndex || (index === stepIndex && completed)) {
            step.classList.add('completed');
            step.querySelector('.progress-step-icon').textContent = '✓';
        } else if (index === stepIndex) {
            step.classList.add('active');
        }
    });

    const progress = ((completed ? stepIndex + 1 : stepIndex) / progressModalState.steps.length) * 100;
    progressBar.style.width = `${progress}%`;
}

// Hide progress modal
function hideProgressModal() {
    progressModalState.isVisible = false;
    const modal = document.getElementById('progress-modal');
    modal.classList.remove('active');
}

// Render upload zone component
function renderUploadZone(id, options = {}) {
    const {
        multiple = true,
        maxFiles = 50,
        accept = 'image/*',
        capture = '', // New: Support for 'user' (selfie) or 'environment' (rear cam)
        onFiles = () => { },
        hint = 'Tap to take a photo or upload from gallery'
    } = options;

    const captureAttr = capture ? `capture="${capture}"` : '';

    return `
        <div class="upload-zone" id="${id}" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '${id}')">
            <input type="file" ${multiple ? 'multiple' : ''} accept="${accept}" ${captureAttr}
                   onchange="handleFileSelect(event, '${id}')" 
                   data-max-files="${maxFiles}">
            <div class="upload-zone-icon">📸</div>
            <div class="upload-zone-text">Tap to Upload / Take Photo</div>
            <div class="upload-zone-hint">${hint}</div>
        </div>
        <div class="upload-preview-grid" id="${id}-preview"></div>
    `;
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

// Handle drag leave  
function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

// Handle drop
function handleDrop(event, zoneId) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');

    const files = Array.from(event.dataTransfer.files).filter(f => isImageFile(f));
    processUploadedFiles(zoneId, files);
}

// Handle file input change
function handleFileSelect(event, zoneId) {
    const files = Array.from(event.target.files).filter(f => isImageFile(f));
    processUploadedFiles(zoneId, files);
}

// Store uploaded files per zone
const uploadedFilesStore = {};

// Compress image to reduce memory usage
async function compressImage(base64, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Scale down if too large
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Convert to compressed JPEG
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64); // Fallback to original
        img.src = base64;
    });
}

// Process uploaded files with compression
async function processUploadedFiles(zoneId, files) {
    if (!uploadedFilesStore[zoneId]) {
        uploadedFilesStore[zoneId] = [];
    }

    const input = document.querySelector(`#${zoneId} input[type="file"]`);
    const maxFiles = parseInt(input?.dataset.maxFiles || '100');

    const currentCount = uploadedFilesStore[zoneId].length;
    const remainingSlots = maxFiles - currentCount;

    if (remainingSlots <= 0) {
        showToast(`Maximum ${maxFiles} files allowed`, 'warning');
        return;
    }

    const filesToAdd = files.slice(0, remainingSlots);

    showToast(`Processing ${filesToAdd.length} photos...`, 'info');

    for (const file of filesToAdd) {
        try {
            const base64 = await fileToBase64(file);
            // Aggressive compression for large photos (800px max, 50% quality)
            // This reduces 4.6MB photos to ~50-80KB each
            const compressed = await compressImage(base64, 800, 0.5);
            uploadedFilesStore[zoneId].push({
                id: generateId(),
                name: file.name,
                data: compressed,
                size: file.size
            });
        } catch (error) {
            console.error('Error processing file:', error);
        }
    }

    showToast(`${filesToAdd.length} photos added`, 'success');

    renderUploadPreviews(zoneId);

    // Trigger custom event for file changes
    const event = new CustomEvent('filesChanged', {
        detail: { zoneId, files: uploadedFilesStore[zoneId] }
    });
    document.dispatchEvent(event);
}

// Render upload previews
function renderUploadPreviews(zoneId) {
    const previewContainer = document.getElementById(`${zoneId}-preview`);
    if (!previewContainer) return;

    const files = uploadedFilesStore[zoneId] || [];

    previewContainer.innerHTML = files.map(file => `
        <div class="upload-preview-item" id="preview-${file.id}">
            <img src="${file.data}" alt="${escapeHtml(file.name)}">
            <button class="upload-preview-remove" onclick="removeUploadedFile('${zoneId}', '${file.id}')">✕</button>
        </div>
    `).join('');
}

// Remove uploaded file
function removeUploadedFile(zoneId, fileId) {
    if (uploadedFilesStore[zoneId]) {
        uploadedFilesStore[zoneId] = uploadedFilesStore[zoneId].filter(f => f.id !== fileId);
        renderUploadPreviews(zoneId);

        // Trigger custom event
        const event = new CustomEvent('filesChanged', {
            detail: { zoneId, files: uploadedFilesStore[zoneId] }
        });
        document.dispatchEvent(event);
    }
}

// Get uploaded files for a zone
function getUploadedFiles(zoneId) {
    return uploadedFilesStore[zoneId] || [];
}

// Clear uploaded files for a zone
function clearUploadedFiles(zoneId) {
    uploadedFilesStore[zoneId] = [];
    renderUploadPreviews(zoneId);
}

// Render photo gallery
function renderPhotoGallery(photos, options = {}) {
    const {
        showDownload = true,
        showMatch = false,
        watermarked = true,
        onPhotoClick = null
    } = options;

    if (!photos || photos.length === 0) {
        return renderEmptyState('📷', 'No photos yet', 'Upload some photos to get started');
    }

    return `
        <div class="photo-gallery">
            ${photos.map((photo, index) => `
                <div class="photo-card" onclick="${onPhotoClick ? `openLightbox(${index}, '${photo.id}')` : ''}">
                    <img src="${photo.previewData || photo.data}" alt="Photo ${index + 1}" loading="lazy">
                    ${showMatch && photo.matchConfidence ? `
                        <div class="match-badge">${photo.matchConfidence}% match</div>
                    ` : ''}
                    <div class="photo-card-overlay">
                        <div class="photo-card-actions">
                            ${showDownload ? `
                                <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); downloadPhoto('${photo.data}', 'nexwave-${photo.id}.jpg')">
                                    📥 Download
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Render empty state
function renderEmptyState(icon, title, text, buttonText = '', buttonAction = '') {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">${icon}</div>
            <h3 class="empty-state-title">${escapeHtml(title)}</h3>
            <p class="empty-state-text">${escapeHtml(text)}</p>
            ${buttonText ? `
                <button class="btn btn-primary" onclick="${buttonAction}">
                    ${escapeHtml(buttonText)}
                </button>
            ` : ''}
        </div>
    `;
}

// Render no match found component
function renderNoMatchFound(eventName, onRetry) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">😔</div>
            <h3 class="empty-state-title">No matches found</h3>
            <p class="empty-state-text">
                We couldn't find any photos matching your selfie in "${escapeHtml(eventName)}". 
                This could happen if:
            </p>
            <div class="selfie-tips" style="text-align: left; margin-bottom: var(--space-6);">
                <div class="selfie-tips-list">
                    <div class="selfie-tip">
                        <span class="selfie-tip-icon">•</span>
                        <span>Your face isn't clearly visible in event photos</span>
                    </div>
                    <div class="selfie-tip">
                        <span class="selfie-tip-icon">•</span>
                        <span>The selfie quality or lighting wasn't ideal</span>
                    </div>
                    <div class="selfie-tip">
                        <span class="selfie-tip-icon">•</span>
                        <span>You weren't photographed at this event</span>
                    </div>
                </div>
            </div>
            <div style="display: flex; gap: var(--space-3); justify-content: center;">
                <button class="btn btn-secondary" onclick="navigate('attendee')">
                    ← Browse Events
                </button>
                <button class="btn btn-primary" onclick="${onRetry}">
                    Try Different Selfie
                </button>
            </div>
        </div>
    `;
}

// Lightbox state
let lightboxState = {
    photos: [],
    currentIndex: 0,
    isOpen: false
};

// Open lightbox
function openLightbox(index, photoId) {
    // Get photos from current results
    const photos = window.currentDisplayPhotos || [];
    if (photos.length === 0) return;

    lightboxState = {
        photos: photos,
        currentIndex: index,
        isOpen: true
    };

    renderLightbox();
}

// Render lightbox
function renderLightbox() {
    const photo = lightboxState.photos[lightboxState.currentIndex];
    if (!photo) return;

    let lightbox = document.getElementById('lightbox');

    if (!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'lightbox';
        lightbox.className = 'lightbox';
        document.body.appendChild(lightbox);
    }

    lightbox.innerHTML = `
        <button class="lightbox-close" onclick="closeLightbox()">✕</button>
        ${lightboxState.photos.length > 1 ? `
            <button class="lightbox-nav lightbox-prev" onclick="lightboxPrev()">‹</button>
            <button class="lightbox-nav lightbox-next" onclick="lightboxNext()">›</button>
        ` : ''}
        <div class="lightbox-content">
            <img class="lightbox-image" src="${photo.data}" alt="Photo">
            <div class="lightbox-actions">
                <button class="btn btn-primary" onclick="downloadPhoto('${photo.data}', 'nexwave-photo.jpg')">
                    📥 Download
                </button>
            </div>
        </div>
    `;

    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }
    lightboxState.isOpen = false;
}

// Lightbox navigation
function lightboxPrev() {
    lightboxState.currentIndex = (lightboxState.currentIndex - 1 + lightboxState.photos.length) % lightboxState.photos.length;
    renderLightbox();
}

function lightboxNext() {
    lightboxState.currentIndex = (lightboxState.currentIndex + 1) % lightboxState.photos.length;
    renderLightbox();
}

// Keyboard navigation for lightbox
document.addEventListener('keydown', (e) => {
    if (!lightboxState.isOpen) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrev();
    if (e.key === 'ArrowRight') lightboxNext();
});

// Render event card
function renderEventCard(event, onClick) {
    const photoCount = event.photos?.length || 0;

    return `
        <div class="event-card" onclick="${onClick}">
            <div class="event-card-image">
                <img src="${event.coverImage}" alt="${escapeHtml(event.name)}">
            </div>
            <div class="event-card-content">
                <h3 class="event-card-title">${escapeHtml(event.name)}</h3>
                <div class="event-card-date">
                    📅 ${formatDate(event.date)}
                </div>
                <div class="event-card-stats">
                    <span class="event-stat">
                        <span class="event-stat-value">${photoCount}</span> photos
                    </span>
                    <span class="event-stat">
                        by <span class="event-stat-value">${escapeHtml(event.photographerName)}</span>
                    </span>
                </div>
            </div>
        </div>
    `;
}

// Render back button
function renderBackButton(text, route) {
    return `
        <button class="back-button" onclick="navigate('${route}')">
            ← ${escapeHtml(text)}
        </button>
    `;
}
