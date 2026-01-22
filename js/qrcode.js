/* ============================================
   NEXWAVE - QR Code Service
   Generate QR codes for event sharing
   ============================================ */

// Generate QR code as data URL using a simple API
async function generateQRCode(text, size = 200) {
    // Using QR Server API (free, no auth required)
    const encodedText = encodeURIComponent(text);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&bgcolor=0a0a0f&color=ffffff`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('QR generation failed');
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('QR generation error:', error);
        // Fallback: return a placeholder
        return getPlaceholderImage(size, size, 'QR');
    }
}

// Generate event share link
function getEventShareLink(eventId) {
    // Get base URL (works for both localhost and production)
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#event/${eventId}`;
}

// Render QR code modal for event sharing
async function showEventQRCode(eventId, eventName) {
    const shareLink = getEventShareLink(eventId);

    // Show loading toast
    showToast('Generating QR code...', 'info');

    const qrDataUrl = await generateQRCode(shareLink, 250);

    const modal = document.createElement('div');
    modal.id = 'qr-modal';
    modal.className = 'modal-overlay active';

    modal.innerHTML = `
        <div class="modal-content qr-modal-content">
            <button class="modal-close" onclick="closeQRModal()">✕</button>
            
            <div class="qr-header">
                <h2 class="qr-title">Share Event</h2>
                <p class="qr-subtitle">${escapeHtml(eventName)}</p>
            </div>
            
            <div class="qr-code-container">
                <img src="${qrDataUrl}" alt="Event QR Code" class="qr-code-image">
            </div>
            
            <p class="qr-instructions">
                Attendees can scan this QR code to find their photos
            </p>
            
            <div class="qr-link-container">
                <input type="text" class="form-input qr-link-input" value="${shareLink}" readonly id="event-share-link">
                <button class="btn btn-secondary" onclick="copyEventLink()">
                    📋 Copy Link
                </button>
            </div>
            
            <div class="qr-actions">
                <button class="btn btn-primary" onclick="downloadQRCode('${eventId}', '${escapeHtml(eventName)}')">
                    📥 Download QR Code
                </button>
                <button class="btn btn-secondary" onclick="printQRCode()">
                    🖨️ Print
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Close QR modal
function closeQRModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.remove();
    }
}

// Copy event link to clipboard
function copyEventLink() {
    const input = document.getElementById('event-share-link');
    if (input) {
        input.select();
        document.execCommand('copy');
        showToast('Link copied to clipboard!', 'success');
    }
}

// Download QR code as image
async function downloadQRCode(eventId, eventName) {
    const shareLink = getEventShareLink(eventId);
    const qrDataUrl = await generateQRCode(shareLink, 500);

    // Create download link
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `${eventName.replace(/\s+/g, '-')}-QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('QR code downloaded!', 'success');
}

// Print QR code
function printQRCode() {
    window.print();
}
