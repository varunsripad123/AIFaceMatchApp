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

// Render upload zone component (Legacy - kept for backward compat if needed elsewhere)
function renderUploadZone(id, options = {}) {
    // ... existing implementation ...
    const {
        multiple = true,
        maxFiles = 50,
        accept = 'image/*',
        capture = '',
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

// ==========================================
// NEW: Selfie Uploader Component (React Port)
// ==========================================

let selfieState = {
    mode: 'select', // 'select' | 'camera' | 'preview'
    stream: null,
    capturedImage: null
};

// Icons (Lucide-like SVGs)
const Icons = {
    Camera: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
    Upload: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
    Refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 12"/><path d="M3 3v9h9"/></svg>`,
    X: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`
};

function renderSelfieUploader(id) {
    // Determine content based on state (simplified for initial render, dynamic updates handled by JS)
    // We render container and let init functions handle the state logic
    return `
        <div id="${id}-wrapper" class="w-full max-w-md mx-auto selfie-uploader-wrapper">
            <!-- Hidden Canvas for capture -->
            <canvas id="${id}-canvas" class="hidden" style="display:none;"></canvas>
            
            <!-- State: SELECT -->
            <div id="${id}-select" class="flex flex-col gap-4">
                <div class="aspect-[3/4] bg-muted rounded-2xl flex flex-col items-center justify-center gap-6 border-2 border-dashed border-border p-6" style="border: 2px dashed var(--border); border-radius: var(--radius-xl); background: var(--bg-secondary); aspect-ratio: 3/4; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: var(--space-4);">
                    <div class="w-24 h-24 rounded-full bg-secondary flex items-center justify-center mb-4" style="width: 6rem; height: 6rem; border-radius: 9999px; background: var(--bg-tertiary); display: flex; align-items: center; justify-content: center;">
                        <div class="text-muted-foreground w-12 h-12" style="color: var(--text-tertiary); transform: scale(2);">${Icons.Camera}</div>
                    </div>
                    <div class="text-center px-6">
                        <p class="text-lg font-semibold text-foreground" style="font-weight: 600; font-size: 1.125rem; margin-bottom: 0.5rem; color: var(--text-primary);">Take a selfie</p>
                        <p class="text-sm text-muted-foreground" style="font-size: 0.875rem; color: var(--text-secondary);">
                            We'll use AI to find your photos in the event gallery
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <button class="btn btn-primary btn-lg gap-2" onclick="startSelfieCamera('${id}')" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span style="width: 20px;">${Icons.Camera}</span>
                        Camera
                    </button>
                    <label style="display: block;">
                         <input
                            type="file"
                            class="hidden"
                            accept="image/*"
                            onchange="handleSelfieFileSelect(event, '${id}')"
                            style="display: none;"
                        />
                        <div class="btn btn-outline btn-lg w-full gap-2" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; background: transparent; border: 1px solid var(--border); color: var(--text-primary);">
                             <span style="width: 20px;">${Icons.Upload}</span>
                            Upload
                        </div>
                    </label>
                </div>
            </div>

            <!-- State: CAMERA (Hidden by default) -->
            <div id="${id}-camera" class="flex flex-col gap-4" style="display: none;">
                <div class="relative aspect-[3/4] bg-foreground rounded-2xl overflow-hidden" style="position: relative; aspect-ratio: 3/4; background: black; border-radius: var(--radius-xl); overflow: hidden; margin-bottom: var(--space-4);">
                    <video
                        id="${id}-video"
                        autoplay
                        playsinline
                        muted
                        style="width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1);"
                    ></video>
                    <!-- Face outline guide -->
                    <div class="absolute inset-0 flex items-center justify-center pointer-events-none" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none;">
                        <div style="width: 48%; height: 60%; border: 4px solid rgba(251, 191, 36, 0.5); border-radius: 50%;"></div>
                    </div>
                </div>

                <div class="flex gap-3" style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-outline btn-lg flex-1" onclick="resetSelfie('${id}')" style="flex: 1;">
                        Cancel
                    </button>
                    <button class="btn btn-primary btn-lg flex-1 gap-2" onclick="captureSelfie('${id}')" style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span style="width: 20px;">${Icons.Camera}</span>
                        Capture
                    </button>
                </div>
            </div>

            <!-- State: PREVIEW (Hidden by default) -->
            <div id="${id}-preview-mode" class="flex flex-col gap-4" style="display: none;">
                <div class="relative aspect-[3/4] bg-muted rounded-2xl overflow-hidden" style="position: relative; aspect-ratio: 3/4; background: var(--bg-secondary); border-radius: var(--radius-xl); overflow: hidden; margin-bottom: var(--space-4);">
                    <img
                        id="${id}-result-img"
                        src=""
                        alt="Your selfie"
                        style="width: 100%; height: 100%; object-fit: cover;"
                    />
                    <button
                        onclick="resetSelfie('${id}')"
                        aria-label="Remove photo"
                        style="position: absolute; top: 12px; right: 12px; padding: 8px; border-radius: 50%; background: rgba(255,255,255,0.9); border: none; box-shadow: var(--shadow-soft); cursor: pointer; color: var(--text-primary); display: flex; align-items: center; justify-content: center;"
                    >
                        <span style="width: 20px; height: 20px;" aria-hidden="true">${Icons.X}</span>
                    </button>
                </div>

                <button class="btn btn-outline btn-lg gap-2" onclick="resetSelfie('${id}')" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;">
                    <span style="width: 20px;">${Icons.Refresh}</span>
                    Retake Photo
                </button>
            </div>
            
            <!-- Hidden Input for compatibility with existing form logic -->
            <input type="hidden" id="${id}-data-url">
        </div>
    `;
}

// Logic for Selfie Camera
async function startSelfieCamera(id) {
    // Check if camera is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast("Camera not supported on this device. Please upload a photo.", "warning");
        // Auto-trigger file upload
        const fileInput = document.querySelector(`#${id}-select input[type="file"]`);
        if (fileInput) fileInput.click();
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
        });

        selfieState.stream = stream;
        selfieState.mode = 'camera';

        const video = document.getElementById(`${id}-video`);
        if (video) {
            video.srcObject = stream;
        }

        // Update UI
        document.getElementById(`${id}-select`).style.display = 'none';
        document.getElementById(`${id}-camera`).style.display = 'block';
        document.getElementById(`${id}-preview-mode`).style.display = 'none';

    } catch (err) {
        console.error("Camera access error:", err);

        let message = "Could not access camera. Please upload a file instead.";

        if (err.name === 'NotAllowedError') {
            message = "Camera permission denied. Please allow camera access or upload a photo.";
        } else if (err.name === 'NotFoundError') {
            message = "No camera found. Please upload a photo instead.";
        } else if (err.name === 'NotReadableError') {
            message = "Camera is in use by another app. Please close other apps or upload a photo.";
        } else if (err.name === 'OverconstrainedError') {
            message = "Camera doesn't support required settings. Please upload a photo.";
        }

        showToast(message, "warning");

        // Auto-trigger file upload as fallback
        const fileInput = document.querySelector(`#${id}-select input[type="file"]`);
        if (fileInput) fileInput.click();
    }
}

function stopSelfieCamera() {
    if (selfieState.stream) {
        selfieState.stream.getTracks().forEach(track => track.stop());
        selfieState.stream = null;
    }
}

function captureSelfie(id) {
    const video = document.getElementById(`${id}-video`);
    const canvas = document.getElementById(`${id}-canvas`);

    if (video && canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");

        if (ctx) {
            // Mirror the image
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);

            const imageData = canvas.toDataURL("image/jpeg", 0.9);
            selfieState.capturedImage = imageData;

            stopSelfieCamera();

            // Show preview
            document.getElementById(`${id}-result-img`).src = imageData;
            document.getElementById(`${id}-data-url`).value = imageData; // Store for form submission

            document.getElementById(`${id}-select`).style.display = 'none';
            document.getElementById(`${id}-camera`).style.display = 'none';
            document.getElementById(`${id}-preview-mode`).style.display = 'block';

            // Trigger global event/callback if needed or just let the view handle the hidden input
            // If the existing app expects files array, we might need adjustments.
            // For now, we assume the code will look for the image data or we simulate a file input.
        }
    }
}

function handleSelfieFileSelect(event, id) {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            selfieState.capturedImage = imageData;

            // Show preview
            document.getElementById(`${id}-result-img`).src = imageData;
            document.getElementById(`${id}-data-url`).value = imageData;

            document.getElementById(`${id}-select`).style.display = 'none';
            document.getElementById(`${id}-camera`).style.display = 'none';
            document.getElementById(`${id}-preview-mode`).style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function resetSelfie(id) {
    stopSelfieCamera();
    selfieState.capturedImage = null;
    document.getElementById(`${id}-data-url`).value = "";

    document.getElementById(`${id}-select`).style.display = 'block';
    document.getElementById(`${id}-camera`).style.display = 'none';
    document.getElementById(`${id}-preview-mode`).style.display = 'none';
}

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
            <button class="upload-preview-remove" aria-label="Remove photo" onclick="removeUploadedFile('${zoneId}', '${file.id}')">✕</button>
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
                <div class="photo-card" tabindex="0" onclick="${onPhotoClick ? `openLightbox(${index}, '${photo.id}')` : ''}" onkeydown="if(['Enter',' '].includes(event.key)){this.click();event.preventDefault();}">
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
        <button class="lightbox-close" aria-label="Close lightbox" onclick="closeLightbox()">✕</button>
        ${lightboxState.photos.length > 1 ? `
            <button class="lightbox-nav lightbox-prev" aria-label="Previous photo" onclick="lightboxPrev()">‹</button>
            <button class="lightbox-nav lightbox-next" aria-label="Next photo" onclick="lightboxNext()">›</button>
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

// ==========================================
// NEW: PhotoCard Component (React Port)
// ==========================================
// ==========================================
// NEW: PhotoCard Component (React Port)
// ==========================================
function renderPhotoCard(photo, options = {}) {
    // Options: isSelected, onSelect (string fn), onZoom (string fn), showWatermark, matchScore
    const {
        isSelected = false,
        onSelect = '',
        onZoom = '',
        showWatermark = true,
        matchScore = null
    } = options;

    return `
    <div class="photo-card group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
         tabindex="0"
         onclick="${onSelect}"
         onkeydown="if(['Enter',' '].includes(event.key)){this.click();event.preventDefault();}"
         onmouseover="this.querySelector('.photo-card-hover-overlay').style.opacity='1'; this.querySelector('.photo-card-img').style.transform='scale(1.05)'; this.style.boxShadow='var(--shadow-medium)';"
         onmouseout="this.querySelector('.photo-card-hover-overlay').style.opacity='0'; this.querySelector('.photo-card-img').style.transform='scale(1.0)'; this.style.boxShadow='${isSelected ? 'var(--shadow-elevated)' : 'var(--shadow-soft)'}';"
         style="position: relative; border-radius: var(--radius-xl); overflow: hidden; cursor: pointer; transition: all 0.3s ease; box-shadow: ${isSelected ? 'var(--shadow-elevated)' : 'var(--shadow-soft)'}; ${isSelected ? 'box-shadow: 0 0 0 4px var(--primary);' : ''}">
        
        <!-- Image -->
        <div class="aspect-[4/3] bg-muted ${showWatermark ? 'watermark-overlay' : ''}" style="aspect-ratio: 4/3; background: var(--bg-secondary); position: relative;">
            <img src="${photo.url || photo.data}" alt="Event photo" 
                 class="photo-card-img"
                 style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;">
        </div>

        <!-- Selection indicator -->
        <div style="position: absolute; top: 12px; left: 12px; width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}; background: ${isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.8)'}; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
            ${isSelected ? '<span style="color: white; font-size: 12px;">✓</span>' : ''}
        </div>

        <!-- Match score badge -->
        ${matchScore ? `
            <div style="position: absolute; top: 12px; right: 12px; background: var(--accent); color: var(--accent-foreground); font-size: 0.75rem; font-weight: bold; padding: 4px 8px; border-radius: 9999px; box-shadow: var(--shadow-soft);">
                ${matchScore}% match
            </div>
        ` : ''}

        <!-- Hover overlay -->
        <div class="photo-card-hover-overlay" style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.6), transparent); display: flex; align-items: flex-end; justify-content: flex-end; padding: 12px; opacity: 0; transition: opacity 0.3s ease;">
            <button onclick="event.stopPropagation(); ${onZoom}" aria-label="Zoom photo" style="padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.9); backdrop-filter: blur(4px); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                <span style="display: block; width: 16px; height: 16px;" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                </span>
            </button>
        </div>
    </div>
    `;
}

// ==========================================
// NEW: StatCard Component (React Port)
// ==========================================
function renderStatCard(title, value, options = {}) {
    const {
        subtitle = '',
        icon = 'BarChart', // Lucide icon name or SVG string
        trend = null, // { value: number, isPositive: boolean }
        variant = 'default' // default | primary | accent
    } = options;

    const variants = {
        default: 'background: var(--card); border: 1px solid var(--border);',
        primary: 'background: rgba(37, 99, 235, 0.05); border: 1px solid rgba(37, 99, 235, 0.2);',
        accent: 'background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3);'
    };

    const iconVariants = {
        default: 'background: var(--bg-secondary); color: var(--foreground);',
        primary: 'background: var(--primary); color: var(--primary-foreground);',
        accent: 'background: var(--accent); color: var(--accent-foreground);'
    };

    // Helper to get SVG for common icons
    const getIconSvg = (name) => {
        if (name.includes('<svg')) return name; // Already SVG
        // Map common names to generic SVG or specific ones defined in Icons
        return Icons[name] || Icons.Camera; // Fallback
    };

    const isPositive = trend?.isPositive;
    const trendColor = isPositive ? 'var(--success)' : 'var(--error)';
    const trendSymbol = isPositive ? '+' : '';

    return `
    <div style="padding: var(--space-6); border-radius: var(--radius-xl); box-shadow: var(--shadow-soft); transition: box-shadow 0.3s ease; ${variants[variant] || variants.default}"
         onmouseover="this.style.boxShadow='var(--shadow-medium)'"
         onmouseout="this.style.boxShadow='var(--shadow-soft)'">
        <div style="display: flex; align-items: flex-start; justify-content: space-between;">
            <div style="flex: 1;">
                <p style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin: 0;">${title}</p>
                <p style="font-size: 1.875rem; font-weight: 700; color: var(--text-primary); margin-top: 0.5rem; margin-bottom: 0px;">${value}</p>
                ${subtitle ? `<p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 4px;">${subtitle}</p>` : ''}
                
                ${trend ? `
                    <div style="display: flex; align-items: center; gap: 4px; margin-top: 8px;">
                        <span style="font-size: 0.875rem; font-weight: 500; color: ${trendColor};">
                            ${trendSymbol}${trend.value}%
                        </span>
                        <span style="font-size: 0.75rem; color: var(--text-secondary);">vs last month</span>
                    </div>
                ` : ''}
            </div>
            <div style="padding: 12px; border-radius: 12px; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; ${iconVariants[variant] || iconVariants.default}">
                <div style="width: 24px; height: 24px;">${getIconSvg(icon)}</div>
            </div>
        </div>
    </div>
    `;
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
        <div class="event-card" tabindex="0" onclick="${onClick}" onkeydown="if(['Enter',' '].includes(event.key)){this.click();event.preventDefault();}">
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

// Render persistent progress stepper
function renderStepper(currentStep) {
    const steps = [
        { num: 1, label: 'Scan QR' },
        { num: 2, label: 'Gallery' },
        { num: 3, label: 'Package' },
        { num: 4, label: 'Order' }
    ];

    return `
        <div class="stepper-container" style="padding: var(--space-4) 0; margin-bottom: var(--space-4);">
            <div style="display: flex; justify-content: space-between; align-items: center; max-width: 400px; margin: 0 auto; position: relative;">
                
                <!-- Connector Line -->
                <div style="position: absolute; top: 16px; left: 0; right: 0; height: 2px; background: var(--bg-tertiary); z-index: 0;"></div>
                
                ${steps.map(step => {
        const isActive = step.num <= currentStep;
        const isCurrent = step.num === currentStep;

        return `
                    <div class="stepper-step" style="position: relative; z-index: 1; text-align: center; background: none;">
                        <div style="
                            width: 32px; height: 32px; border-radius: 50%; 
                            background: ${isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)'};
                            color: ${isActive ? 'black' : 'var(--text-muted)'};
                            display: flex; align-items: center; justify-content: center;
                            font-weight: bold; font-size: 0.875rem;
                            margin: 0 auto 8px;
                            box-shadow: ${isCurrent ? '0 0 0 4px rgba(251, 191, 36, 0.2)' : 'none'};
                            transition: all 0.3s ease;
                        ">
                            ${isActive && !isCurrent ? '✓' : step.num}
                        </div>
                        <div style="
                            font-size: 0.75rem; 
                            color: ${isActive ? 'var(--text-primary)' : 'var(--text-muted)'};
                            font-weight: ${isActive ? '600' : '400'};
                        ">
                            ${step.label}
                        </div>
                    </div>
                `}).join('')}
            </div>
        </div>
    `;
}
