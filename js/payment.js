/* ============================================
   NEXWAVE - Payment Service
   Handles payment flow for photo downloads
   ============================================ */

// Pricing configuration
const PRICING = {
    digitalDownload: {
        single: 2.99,      // Per photo
        bundle5: 9.99,     // 5 photos
        bundle10: 14.99,   // 10 photos
        unlimited: 19.99   // All photos from event
    },
    print: {
        single4x6: 4.99,   // 4x6 print
        single5x7: 6.99,   // 5x7 print
        single8x10: 12.99  // 8x10 print
    },
    currency: 'USD',
    currencySymbol: '$'
};

// Payment state
let currentPaymentSession = null;

// Format price
function formatPrice(amount) {
    return `${PRICING.currencySymbol}${amount.toFixed(2)}`;
}

// Calculate total based on selection
function calculateTotal(photos, option) {
    const count = photos.length;

    if (option === 'unlimited') {
        return PRICING.digitalDownload.unlimited;
    } else if (option === 'bundle10' && count >= 10) {
        return PRICING.digitalDownload.bundle10;
    } else if (option === 'bundle5' && count >= 5) {
        return PRICING.digitalDownload.bundle5;
    } else {
        return count * PRICING.digitalDownload.single;
    }
}

// Get best deal for photo count
function getBestDeal(photoCount) {
    if (photoCount >= 7) {
        return { option: 'unlimited', price: PRICING.digitalDownload.unlimited, savings: (photoCount * PRICING.digitalDownload.single) - PRICING.digitalDownload.unlimited };
    } else if (photoCount >= 4) {
        return { option: 'bundle5', price: PRICING.digitalDownload.bundle5, savings: (5 * PRICING.digitalDownload.single) - PRICING.digitalDownload.bundle5 };
    }
    return null;
}

// Show payment modal
function showPaymentModal(photos, eventName) {
    currentPaymentSession = {
        photos: photos,
        eventName: eventName,
        selectedOption: 'unlimited',
        timestamp: Date.now()
    };

    const photoCount = photos.length;
    const bestDeal = getBestDeal(photoCount);

    const modal = document.createElement('div');
    modal.id = 'payment-modal';
    modal.className = 'modal-overlay active';

    modal.innerHTML = `
        <div class="modal-content payment-modal-content">
            <button class="modal-close" onclick="closePaymentModal()">✕</button>
            
            <div class="payment-header">
                <div class="payment-icon">📸</div>
                <h2 class="payment-title">Get Your Photos</h2>
                <p class="payment-subtitle">${photoCount} photo${photoCount !== 1 ? 's' : ''} found in "${escapeHtml(eventName)}"</p>
            </div>
            
            <div class="payment-options">
                <div class="payment-option ${photoCount >= 7 ? 'recommended' : ''}" onclick="selectPaymentOption('unlimited')" id="option-unlimited">
                    ${photoCount >= 7 ? '<span class="payment-badge">Best Value</span>' : ''}
                    <div class="payment-option-header">
                        <span class="payment-option-title">All Photos</span>
                        <span class="payment-option-price">${formatPrice(PRICING.digitalDownload.unlimited)}</span>
                    </div>
                    <p class="payment-option-desc">Download all ${photoCount} photos without watermarks</p>
                    ${bestDeal && bestDeal.option === 'unlimited' ? `<span class="payment-savings">Save ${formatPrice(bestDeal.savings)}</span>` : ''}
                </div>
                
                <div class="payment-option" onclick="selectPaymentOption('perphoto')" id="option-perphoto">
                    <div class="payment-option-header">
                        <span class="payment-option-title">Per Photo</span>
                        <span class="payment-option-price">${formatPrice(PRICING.digitalDownload.single)}<span class="payment-option-each">/each</span></span>
                    </div>
                    <p class="payment-option-desc">Select specific photos to download</p>
                </div>
            </div>
            
            <div class="payment-print-upsell">
                <div class="print-upsell-icon">🖨️</div>
                <div class="print-upsell-content">
                    <h4>Get Prints Delivered</h4>
                    <p>Professional prints starting at ${formatPrice(PRICING.print.single4x6)}</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="showPrintOptions()">View Options</button>
            </div>
            
            <div class="payment-total">
                <span>Total</span>
                <span id="payment-total-amount">${formatPrice(PRICING.digitalDownload.unlimited)}</span>
            </div>
            
            <button class="btn btn-primary btn-lg payment-submit" onclick="processPayment()">
                💳 Proceed to Payment
            </button>
            
            <div class="payment-secure">
                <span>🔒</span> Secure payment powered by Stripe
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Select payment option
function selectPaymentOption(option) {
    document.querySelectorAll('.payment-option').forEach(el => {
        el.classList.remove('selected');
    });
    document.getElementById(`option-${option}`).classList.add('selected');

    currentPaymentSession.selectedOption = option;

    // Update total
    const total = option === 'unlimited'
        ? PRICING.digitalDownload.unlimited
        : currentPaymentSession.photos.length * PRICING.digitalDownload.single;

    document.getElementById('payment-total-amount').textContent = formatPrice(total);
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('payment-modal');
    if (modal) {
        modal.remove();
    }
    currentPaymentSession = null;
}

// Show print options
function showPrintOptions() {
    showToast('Print options coming soon! Contact us for bulk prints.', 'info');
}

// Process payment (mock for MVP)
async function processPayment() {
    if (!currentPaymentSession) return;

    const btn = document.querySelector('.payment-submit');
    btn.classList.add('btn-loading');
    btn.disabled = true;

    // Simulate payment processing
    await sleep(2000);

    // For MVP, we'll simulate successful payment
    const phone = window.currentDeliveryPhone || 'your phone';
    showToast(`Payment successful! Photos sent to ${phone} and starting download...`, 'success');

    // Record purchase analytics if attendee profile exists
    if (isLoggedIn() && !isPhotographer()) {
        const total = calculateTotal(currentPaymentSession.photos, currentPaymentSession.selectedOption);
        await recordAttendeePurchase(currentUser.uid, currentPaymentSession.photos.length, total);

        // Also add revenue to photographer
        if (window.currentEventPhotographerId) {
            await addPhotographerRevenue(window.currentEventPhotographerId, total);
        }
    }

    // Close modal and trigger download
    closePaymentModal();

    // Download all photos without watermark
    await downloadAllPhotos(window.matchedPhotos, window.currentEventName || 'nexwave-photos', false);
}

// Check if user has paid for this event (MVP: always false, use localStorage in real app)
function hasPaidForEvent(eventId) {
    const paidEvents = storage.get('nexwave_paid_events', []);
    return paidEvents.includes(eventId);
}

// Mark event as paid
function markEventAsPaid(eventId) {
    const paidEvents = storage.get('nexwave_paid_events', []);
    if (!paidEvents.includes(eventId)) {
        paidEvents.push(eventId);
        storage.set('nexwave_paid_events', paidEvents);
    }
}
