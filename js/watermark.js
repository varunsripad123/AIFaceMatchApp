/* ============================================
   NEXWAVE - Watermark Service
   Canvas-based watermarking for photo protection
   ============================================ */

// Default watermark settings
const WATERMARK_CONFIG = {
    text: 'NEXWAVE',
    fontFamily: 'Inter, sans-serif',
    opacity: 0.3,
    angle: -30, // degrees
    pattern: true, // repeat watermark across image
    previewQuality: 0.7,
    downloadQuality: 0.95
};

// Apply watermark to an image and return as base64
async function applyWatermark(imageSrc, options = {}) {
    const config = { ...WATERMARK_CONFIG, ...options };

    // Load the original image
    const img = await loadImage(imageSrc);

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Apply watermark
    if (config.pattern) {
        applyPatternWatermark(ctx, canvas.width, canvas.height, config);
    } else {
        applySingleWatermark(ctx, canvas.width, canvas.height, config);
    }

    // Return as base64
    return canvas.toDataURL('image/jpeg', config.previewQuality);
}

// Apply repeating pattern watermark
function applyPatternWatermark(ctx, width, height, config) {
    ctx.save();

    // Calculate font size based on image dimensions
    const fontSize = Math.max(width, height) * 0.05;

    ctx.font = `bold ${fontSize}px ${config.fontFamily}`;
    ctx.fillStyle = `rgba(255, 255, 255, ${config.opacity})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Rotate context
    ctx.translate(width / 2, height / 2);
    ctx.rotate((config.angle * Math.PI) / 180);

    // Calculate pattern spacing
    const textWidth = ctx.measureText(config.text).width;
    const spacing = textWidth * 1.5;
    const rows = Math.ceil(Math.max(width, height) * 2 / spacing);
    const cols = Math.ceil(Math.max(width, height) * 2 / spacing);

    // Draw pattern
    for (let row = -rows; row <= rows; row++) {
        for (let col = -cols; col <= cols; col++) {
            const x = col * spacing;
            const y = row * spacing * 0.8;
            ctx.fillText(config.text, x, y);
        }
    }

    ctx.restore();
}

// Apply single centered watermark
function applySingleWatermark(ctx, width, height, config) {
    ctx.save();

    const fontSize = Math.max(width, height) * 0.08;

    ctx.font = `bold ${fontSize}px ${config.fontFamily}`;
    ctx.fillStyle = `rgba(255, 255, 255, ${config.opacity})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.translate(width / 2, height / 2);
    ctx.rotate((config.angle * Math.PI) / 180);

    ctx.fillText(config.text, 0, 0);

    ctx.restore();
}

// Generate preview thumbnail with watermark
async function generateWatermarkedPreview(imageSrc, maxWidth = 400, maxHeight = 300) {
    const img = await loadImage(imageSrc);

    // Calculate dimensions maintaining aspect ratio
    let { width, height } = img;
    const ratio = Math.min(maxWidth / width, maxHeight / height);

    if (ratio < 1) {
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
    }

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    // Draw resized image
    ctx.drawImage(img, 0, 0, width, height);

    // Apply watermark
    applyPatternWatermark(ctx, width, height, {
        ...WATERMARK_CONFIG,
        opacity: 0.35
    });

    return canvas.toDataURL('image/jpeg', 0.8);
}

// Get original image without watermark (for download after purchase/verification)
async function getOriginalForDownload(imageSrc) {
    const img = await loadImage(imageSrc);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL('image/jpeg', WATERMARK_CONFIG.downloadQuality);
}

// Create a downloadable image with light watermark (free download version)
async function createDownloadableImage(imageSrc, includeWatermark = false) {
    if (!includeWatermark) {
        return getOriginalForDownload(imageSrc);
    }

    // Light corner watermark for free downloads
    const img = await loadImage(imageSrc);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    // Add small corner watermark
    const fontSize = Math.min(img.width, img.height) * 0.03;
    ctx.font = `${fontSize}px ${WATERMARK_CONFIG.fontFamily}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';

    const padding = fontSize * 0.5;
    ctx.fillText('📸 Nexwave', img.width - padding, img.height - padding);

    return canvas.toDataURL('image/jpeg', 0.92);
}

// Trigger download of an image
function downloadImage(dataUrl, filename = 'nexwave-photo.jpg') {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Download photo with optional watermark
async function downloadPhoto(imageSrc, filename, addWatermark = false) {
    try {
        showToast('Preparing download...', 'info');
        const imageData = await createDownloadableImage(imageSrc, addWatermark);
        downloadImage(imageData, filename);
        showToast('Download started!', 'success');

        // Track download for analytics
        if (window.currentEventId && typeof trackDownload === 'function') {
            trackDownload(window.currentEventId, 1);
        }
    } catch (error) {
        console.error('Download error:', error);
        showToast('Failed to download image', 'error');
    }
}

// Download all matched photos (as individual files)
async function downloadAllPhotos(photos, eventName, addWatermark = false) {
    showToast(`Downloading ${photos.length} photos...`, 'info');

    for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const filename = `${eventName.replace(/\s+/g, '-')}_photo_${i + 1}.jpg`;

        try {
            const imageData = await createDownloadableImage(photo.data, addWatermark);
            downloadImage(imageData, filename);
            await sleep(500); // Small delay between downloads
        } catch (error) {
            console.error(`Error downloading photo ${i + 1}:`, error);
        }
    }

    // Track all downloads for analytics
    if (window.currentEventId && typeof trackDownload === 'function') {
        trackDownload(window.currentEventId, photos.length);
    }

    showToast('All downloads complete!', 'success');
}

