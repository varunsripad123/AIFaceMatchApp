/* ============================================
   NEXWAVE - Page Templates
   ============================================ */

// Render Home Page
function renderHomePage() {
    return `
        <div class="page-landing">
            <section class="hero-landing">
                <div class="hero-landing-content">
                    <div class="hero-badge-animated">
                        AI-Powered Face Matching
                    </div>
                    
                    <h1 class="hero-title-3d">
                        Find <span class="hero-title-gradient">Your Photos</span><br>
                        In Seconds
                    </h1>
                    
                    <p class="hero-subtitle-3d">
                        Upload a selfie and our advanced AI instantly finds all your photos 
                        from any event. No more scrolling through thousands of pictures.
                    </p>
                    
                    <div class="hero-cta-3d">
                        <button class="btn btn-primary btn-lg btn-glow" onclick="navigate('attendee')">
                            🔍 Find My Photos
                        </button>
                        <button class="btn btn-secondary btn-lg" onclick="navigate('signup')">
                            📸 I'm a Photographer
                        </button>
                    </div>
                    
                    <div class="features-grid-3d">
                        <div class="feature-card-3d">
                            <div class="feature-icon-3d">⚡</div>
                            <h3 class="feature-title-3d">Lightning Fast</h3>
                            <p class="feature-text-3d">Advanced AI matches your face in seconds across thousands of event photos</p>
                        </div>
                        <div class="feature-card-3d">
                            <div class="feature-icon-3d">🧠</div>
                            <h3 class="feature-title-3d">Smart Matching</h3>
                            <p class="feature-text-3d">Multi-angle recognition with 99% accuracy using state-of-the-art neural networks</p>
                        </div>
                        <div class="feature-card-3d">
                            <div class="feature-icon-3d">📥</div>
                            <h3 class="feature-title-3d">Instant Download</h3>
                            <p class="feature-text-3d">Download all your matched photos with one click, ready to share</p>
                        </div>
                    </div>
                    
                    <div class="stats-section">
                        <div class="stat-item">
                            <div class="stat-value">10K+</div>
                            <div class="stat-label">Photos Matched</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">500+</div>
                            <div class="stat-label">Events</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">99%</div>
                            <div class="stat-label">Accuracy</div>
                        </div>
                    </div>
                </div>
                
                <div class="scroll-indicator">
                    <div class="scroll-mouse"></div>
                    <span>Scroll to explore</span>
                </div>
            </section>
        </div>
    `;
}

// Handle forgot password form
async function handleForgotPassword(event) {
    event.preventDefault();

    const email = document.getElementById('reset-email').value;
    const btn = document.getElementById('reset-btn');

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
        await resetPassword(email);
        // Success toast is shown in auth.js, but we can add another confirmation
        showToast('If an account exists for that email, a reset link has been sent.', 'success');
        navigate('login');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Cleanup Three.js when navigating away from home
function cleanupHomePage() {
    if (typeof destroyThreeScene === 'function') {
        destroyThreeScene();
    }
}

// Render Login Page
function renderLoginPage() {
    return `
        <div class="page-auth">
            <div class="auth-container">
                <div class="auth-header">
                    <div class="auth-logo">✨</div>
                    <h1 class="auth-title">Welcome Back</h1>
                    <p class="auth-subtitle">Sign in to continue to Nexwave</p>
                </div>
                
                <div class="auth-card">
                    <form class="auth-form" onsubmit="handleLogin(event)">
                        <div class="form-group">
                            <label class="form-label" for="login-email">Email</label>
                            <input type="email" id="login-email" class="form-input" 
                                   placeholder="Enter your email" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="login-password">Password</label>
                            <input type="password" id="login-password" class="form-input" 
                                   placeholder="Enter your password" required>
                            <div class="text-right mt-2">
                                <a href="#" onclick="event.preventDefault(); navigate('forgot-password')" class="text-sm text-secondary">Forgot Password?</a>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-lg w-full mt-4" id="login-btn">
                            Sign In
                        </button>
                    </form>
                    
                    <div class="auth-footer">
                        Don't have an account? 
                        <a href="#" onclick="navigate('signup')">Sign up</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Handle login form
async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
        const user = await login(email, password);
        showToast(`Welcome back, ${user.name}!`, 'success');
        navigate(user.role === 'photographer' ? 'photographer' : 'attendee');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Render Forgot Password Page
function renderForgotPasswordPage() {
    return `
        <div class="page-auth">
            <div class="auth-container">
                <div class="auth-header">
                    <div class="auth-logo">✨</div>
                    <h1 class="auth-title">Reset Password</h1>
                    <p class="auth-subtitle">Enter your email to receive a reset link</p>
                </div>

                <div class="auth-card">
                    <form class="auth-form" onsubmit="handleForgotPassword(event)">
                        <div class="form-group">
                            <label class="form-label" for="reset-email">Email</label>
                            <input type="email" id="reset-email" class="form-input"
                                   placeholder="Enter your email" required>
                        </div>

                        <button type="submit" class="btn btn-primary btn-lg w-full" id="reset-btn">
                            Send Reset Link
                        </button>
                    </form>

                    <div class="auth-footer">
                        Remember your password?
                        <a href="#" onclick="navigate('login')">Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render Signup Page
function renderSignupPage() {
    return `
        <div class="page-auth">
            <div class="auth-container">
                <div class="auth-header">
                    <div class="auth-logo">✨</div>
                    <h1 class="auth-title">Create Account</h1>
                    <p class="auth-subtitle">Join Nexwave today</p>
                </div>
                
                <div class="auth-card">
                    <form class="auth-form" onsubmit="handleSignup(event)">
                        <div class="form-group">
                            <label class="form-label" for="signup-name">Full Name</label>
                            <input type="text" id="signup-name" class="form-input" 
                                   placeholder="Enter your name" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="signup-email">Email</label>
                            <input type="email" id="signup-email" class="form-input" 
                                   placeholder="Enter your email" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="signup-phone">Phone Number</label>
                            <input type="tel" id="signup-phone" class="form-input" 
                                   placeholder="+1 (555) 000-0000" required>
                            <p class="form-help">Used for photo delivery via text.</p>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label" for="signup-password">Password</label>
                            <input type="password" id="signup-password" class="form-input" 
                                   placeholder="Create a password (min 6 characters)" required minlength="6">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">I am a...</label>
                            <div class="role-selector">
                                <div class="role-option selected" onclick="selectRole('attendee')" id="role-attendee">
                                    <div class="role-option-icon">🎉</div>
                                    <div class="role-option-title">Event Attendee</div>
                                    <div class="role-option-desc">Find my photos</div>
                                </div>
                                <div class="role-option" onclick="selectRole('photographer')" id="role-photographer">
                                    <div class="role-option-icon">📸</div>
                                    <div class="role-option-title">Photographer</div>
                                    <div class="role-option-desc">Upload event photos</div>
                                </div>
                            </div>
                            <input type="hidden" id="signup-role" value="attendee">
                        </div>

                        <div class="form-group" id="access-code-group" style="display: none;">
                            <label class="form-label" for="signup-code">Photographer Access Code</label>
                            <input type="text" id="signup-code" class="form-input" placeholder="Enter invite code (Required for photographers)">
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-lg" style="width: 100%" id="signup-btn">
                            Create Account
                        </button>
                    </form>
                    
                    <div class="auth-footer">
                        Already have an account? 
                        <a href="#" onclick="navigate('login')">Sign in</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Select role in signup
function selectRole(role) {
    document.querySelectorAll('.role-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(`role-${role}`).classList.add('selected');
    document.getElementById('signup-role').value = role;

    // Show access code for photographers
    const codeGroup = document.getElementById('access-code-group');
    const codeInput = document.getElementById('signup-code');

    if (role === 'photographer') {
        codeGroup.style.display = 'block';
        codeInput.required = true;
        // Scroll into view gently
        setTimeout(() => codeGroup.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
    } else {
        codeGroup.style.display = 'none';
        codeInput.required = false;
        codeInput.value = '';
    }
}

// Handle signup form
async function handleSignup(event) {
    event.preventDefault();

    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const role = document.getElementById('signup-role').value;
    const accessCode = document.getElementById('signup-code')?.value || '';
    const btn = document.getElementById('signup-btn');

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
        const user = await signUp(name, email, password, role, accessCode, phone);
        showToast(`Welcome to Nexwave, ${user.name}!`, 'success');
        navigate(user.role === 'photographer' ? 'photographer' : 'attendee');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Render Attendee Events Page
function renderAttendeePage() {
    // Show loading initially, then load from Firebase
    setTimeout(async () => {
        const container = document.querySelector('.event-grid-container');
        if (!container) return;

        // Load events from Firebase
        const allEvents = await getPublicEventsAsync();

        if (allEvents.length > 0) {
            container.innerHTML = `
                <div class="event-grid">
                    ${allEvents.map(event => renderEventCard(event, `navigate('attendee-event', '${event.id}')`)).join('')}
                </div>
            `;
        } else {
            container.innerHTML = renderEmptyState(
                '📷',
                'No events available',
                'Check back later for upcoming events with photos to browse'
            );
        }
    }, 100);

    return `
        <div class="page-attendee">
            <div class="container">
                <div class="page-header">
                    <h1 class="page-title">Find Your Photos</h1>
                    <p class="page-subtitle">Select an event to search for your photos</p>
                </div>
                
                <div class="event-grid-container">
                    <div style="text-align: center; padding: 60px 20px;">
                        <div class="loading-spinner"></div>
                        <p style="color: var(--text-secondary); margin-top: 16px;">Loading events...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Render Attendee Event Detail (Selfie Upload) Page
function renderAttendeeEventPage(eventId) {
    // Load event from Firebase
    setTimeout(async () => {
        const contentContainer = document.querySelector('.attendee-event-content');
        if (!contentContainer) return;

        const event = await getEventByIdAsync(eventId);

        if (!event) {
            contentContainer.innerHTML = renderEmptyState('❌', 'Event not found', 'This event may have been removed');
            return;
        }

        // Check if user has already entered correct code for this event (stored in sessionStorage)
        const storedCode = sessionStorage.getItem(`event_code_${eventId}`);
        const isVerified = storedCode === event.accessCode;

        if (event.accessCode && !isVerified) {
            // Show access code entry form
            contentContainer.innerHTML = `
                ${renderStepper(1)}
                ${renderBackButton('Back to Events', 'attendee')}
                
                <div class="selfie-upload-container">
                    <div class="page-header" style="text-align: center;">
                        <h1 class="page-title">${escapeHtml(event.name)}</h1>
                        <p class="page-subtitle">Enter the event access code to continue</p>
                    </div>
                    
                    <div class="form-group" style="max-width: 300px; margin: 0 auto;">
                        <input type="text" id="event-access-code" class="form-input" 
                               placeholder="Enter 4-digit code" 
                               pattern="[0-9]{4}" maxlength="4"
                               style="font-size: 2rem; text-align: center; letter-spacing: 1rem;">
                    </div>
                    
                    <button class="btn btn-primary btn-lg" onclick="verifyEventCode('${eventId}')" style="width: 100%; max-width: 300px; margin: 24px auto 0; display: block;">
                        🔓 Unlock Event
                    </button>
                    
                    <p style="text-align: center; color: var(--text-secondary); margin-top: 16px; font-size: 0.875rem;">
                        Ask the photographer for the access code
                    </p>
                </div>
            `;
            return;
        }

        // Show selfie upload (code verified or no code required)
        contentContainer.innerHTML = `
            ${renderStepper(1)}
            ${renderBackButton('Back to Events', 'attendee')}
            
            <div class="selfie-upload-container">
                <div class="page-header" style="text-align: center;">
                    <h1 class="page-title">${escapeHtml(event.name)}</h1>
                    <p class="page-subtitle">Upload a clear selfie to find your photos</p>
                </div>
                
                ${renderSelfieUploader('selfie-upload')}
                
                <div class="form-group" style="margin-top: 24px;">
                    <label class="form-label" for="delivery-phone">Delivery Phone Number</label>
                    <input type="tel" id="delivery-phone" class="form-input" 
                           placeholder="+1 (555) 000-0000" 
                           value="${currentUser?.phone || ''}"
                           required>
                    <p class="form-help">We'll text you a link to your high-res photos after payment.</p>
                </div>
                
                <button class="btn btn-primary btn-lg" onclick="startFaceMatching('${eventId}')" style="width: 100%; margin-top: 16px;">
                    <span class="btn-icon">🔍</span>
                    Find My Photos
                </button>
            </div>
        `;

        // Track visitor for analytics
        if (typeof trackVisitor === 'function') {
            trackVisitor(eventId);
        }
    }, 100);

    return `
        <div class="page-attendee">
            <div class="container attendee-event-content">
                <div style="text-align: center; padding: 60px 20px;">
                    <div class="loading-spinner"></div>
                    <p style="color: var(--text-secondary); margin-top: 16px;">Loading event...</p>
                </div>
            </div>
        </div>
    `;
}

// Verify event access code
async function verifyEventCode(eventId) {
    const codeInput = document.getElementById('event-access-code');
    const enteredCode = codeInput?.value || '';

    if (!/^[0-9]{4}$/.test(enteredCode)) {
        showToast('Please enter a 4-digit code', 'warning');
        return;
    }

    const event = await getEventByIdAsync(eventId);

    if (!event) {
        showToast('Event not found', 'error');
        return;
    }

    if (enteredCode === event.accessCode) {
        // Store verified code in sessionStorage
        sessionStorage.setItem(`event_code_${eventId}`, enteredCode);
        showToast('Access granted! 🎉', 'success');
        // Reload the page to show selfie upload
        navigate('attendee-event', eventId);
    } else {
        showToast('Incorrect code. Please try again.', 'error');
        codeInput.value = '';
        codeInput.focus();
    }
}

// Listen for file uploads on attendee page
document.addEventListener('filesChanged', (e) => {
    if (e.detail.zoneId === 'selfie-upload') {
        const btn = document.getElementById('find-photos-btn');
        if (btn) {
            btn.disabled = e.detail.files.length === 0;
        }
    }
});

// Start face matching process
async function startFaceMatching(eventId) {
    let selfieDataUrls = [];

    // Check new Selfie Uploader first (hidden input with data URL)
    const dataUrlInput = document.getElementById('selfie-upload-data-url');
    if (dataUrlInput && dataUrlInput.value) {
        // Data URL is already in the correct format
        selfieDataUrls = [dataUrlInput.value];
    } else {
        // Fallback to legacy uploader (returns objects with .data property)
        const legacyFiles = getUploadedFiles('selfie-upload');
        selfieDataUrls = legacyFiles.map(f => f.data);
    }

    if (selfieDataUrls.length === 0) {
        showToast('Please take a selfie or upload a photo', 'warning');
        return;
    }

    // Capture and validate phone number
    const phoneInput = document.getElementById('delivery-phone');
    const phoneNumber = phoneInput?.value || '';
    if (!phoneNumber || phoneNumber.trim().length < 10) {
        showToast('Please enter a valid phone number for photo delivery', 'warning');
        phoneInput?.focus();
        return;
    }

    // Store for payment flow
    window.currentDeliveryPhone = phoneNumber.trim();

    const event = await getEventByIdAsync(eventId);
    window.currentEventName = event?.name || 'NexWave Event';

    showProgressModal('Finding Your Photos', [
        'Loading AI models...',
        'Analyzing your selfie...',
        'Searching event photos...',
        'Preparing results...'
    ]);

    try {
        // Step 0: Init face API
        updateProgressStep(0);
        await initFaceApi();
        updateProgressStep(0, true);

        // Steps 1-3: Match faces
        const matches = await findMatchingPhotos(eventId, selfieDataUrls, (progress) => {
            updateProgressStep(progress.step);
        });

        updateProgressStep(3, true);
        await sleep(500);

        hideProgressModal();

        // Track matches in analytics
        if (matches.length > 0 && typeof trackMatch === 'function') {
            trackMatch(eventId, matches.length);
        }

        // Store matches and event context for downloads
        window.matchedPhotos = matches;
        window.currentEventId = eventId;

        // Store photographer ID for download tracking (reuse event from line 454)
        if (event) {
            window.currentEventPhotographerId = event.photographerId;
        }

        navigate('attendee-results', eventId);

    } catch (error) {
        hideProgressModal();
        console.error('Face matching error:', error);

        if (error.message.includes('No faces detected')) {
            showToast('No face detected in selfie. Please try a clearer photo.', 'error');
        } else if (error.message.includes('No processed photos')) {
            showToast('This event has no photos yet. Please check back later.', 'warning');
        } else {
            showToast('Something went wrong. Please try again.', 'error');
        }
    }
}

function renderAttendeeResultsPage(eventId) {
    const matches = window.matchedPhotos || [];
    window.currentDisplayPhotos = matches;

    setTimeout(async () => {
        const container = document.querySelector('.container');
        if (!container) return;

        const event = await getEventByIdAsync(eventId);

        if (!event) {
            container.innerHTML = renderEmptyState('❌', 'Event not found', 'This event may have been removed');
            return;
        }

        if (matches.length === 0) {
            container.innerHTML = `
                ${renderStepper(2)}
                ${renderBackButton('Back to Event', `attendee-event/${eventId}`)}
                ${renderNoMatchFound(event.name, `navigate('attendee-event', '${eventId}')`)}
            `;
            return;
        }

        window.currentEventName = event.name;

        container.innerHTML = `
            ${renderStepper(2)}
            ${renderBackButton('Back to Event', `attendee-event/${eventId}`)}

            <div class="results-header">
                <div>
                    <h1 class="page-title">Your Photos</h1>
                    <p class="results-count">
                        Found <strong>${matches.length}</strong> photo${matches.length !== 1 ? 's' : ''} in "${escapeHtml(event.name)}"
                    </p>
                </div>
            </div>

            <div class="results-payment-cta">
                <h3>🖨️ Print at the Booth</h3>
                <p>Send your photos directly to the printing station.</p>
                <div style="display: flex; gap: var(--space-4); justify-content: center; flex-wrap: wrap; margin-top: var(--space-4);">
                    <button class="btn btn-primary btn-lg" onclick="emailPhotosToBooth()">
                        📧 Send to Printer
                    </button>
                </div>
            </div>

            <p style="text-align: center; color: var(--text-secondary); margin-bottom: var(--space-6);">
                👇 Preview your photos below (watermarked)
            </p>

            ${renderPhotoGallery(matches, {
            showDownload: true, /* Enable downloads since it's free now */
            showMatch: true,
            watermarked: false, /* Remove watermark */
            onPhotoClick: true
        })}
        `;
    }, 100);


    return `
        <div class="page-attendee">
            <div class="container" style="padding: 60px 20px;">
                <div class="loading-spinner"></div>
                <p style="color: var(--text-secondary); margin-top: 16px; text-align: center;">
                    Loading results...
                </p>
            </div>
        </div>
    `;
}

// Render Photographer Dashboard
function renderPhotographerPage() {
    if (!requirePhotographer()) return '';

    // Load async data
    setTimeout(async () => {
        const statsContainer = document.querySelector('.dashboard-stats');
        const eventsContainer = document.querySelector('.event-management');
        const chartContainer = document.querySelector('.dashboard-chart');

        if (!statsContainer || !eventsContainer) return;

        // Fetch stats, events, and user profile in parallel
        const [stats, events, profile] = await Promise.all([
            getPhotographerStatsAsync(currentUser.id || currentUser.uid),
            getEventsByPhotographerAsync(currentUser.id || currentUser.uid),
            getUserProfile(currentUser.uid) // Fetch Firestore profile
        ]);

        // Get local analytics data
        const analyticsData = getPhotographerAnalytics(events);

        // Use Firestore profile stats if available (more accurate), fallback to local
        const profileStats = profile?.photographer || {};
        const totalDownloads = profileStats.totalDownloads || analyticsData.totalDownloads;
        const totalRevenue = profileStats.totalRevenue || 0;

        // Render enhanced stats with the new renderStatCard component
        statsContainer.innerHTML = `
            ${renderStatCard('Total Events', stats.totalEvents, {
            icon: Icons.Camera,
            variant: 'default',
            subtitle: events.length > 0 ? `Latest: ${events[0]?.name?.substring(0, 20) || 'N/A'}...` : ''
        })}
            ${renderStatCard('Total Photos', stats.totalPhotos, {
            icon: Icons.Upload,
            variant: 'primary',
            subtitle: `${stats.processingRate}% processed`
        })}
            ${renderStatCard('Face Matches', analyticsData.totalMatches, {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>`,
            variant: 'accent'
        })}
            ${renderStatCard('Downloads', totalDownloads, {
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
            variant: 'default',
            subtitle: totalRevenue > 0 ? `$${totalRevenue.toFixed(2)} earned` : `${analyticsData.totalVisitors} visitors`
        })}
        `;

        // Render weekly chart
        if (chartContainer) {
            chartContainer.innerHTML = renderWeeklyChart(analyticsData.weeklyStats);
        }

        // Render events
        eventsContainer.innerHTML = `
            <div class="event-management-header">
                <h2 class="heading-4">Your Events</h2>
            </div>
            ${events.length > 0 ? `
                <div class="event-grid">
                    ${events.map(event => {
            const eventAnalytics = getEventAnalytics(event.id);
            return `
                        <div class="event-card" onclick="navigate('photographer-event', '${event.id}')">
                            <div class="event-card-image">
                                <img src="${event.coverImage}" alt="${escapeHtml(event.name)}">
                            </div>
                            <div class="event-card-content">
                                <h3 class="event-card-title">${escapeHtml(event.name)}</h3>
                                <div class="event-card-date">📅 ${formatDate(event.date)}</div>
                                <div class="event-card-stats">
                                    <span class="event-stat">
                                        <span class="event-stat-value">${event.photos.length}</span> photos
                                    </span>
                                    <span class="event-stat" style="color: var(--primary);">
                                        <span class="event-stat-value">${eventAnalytics.matches}</span> matches
                                    </span>
                                </div>
                                <div style="margin-top: 8px;">
                                    <span class="badge ${event.photos.filter(p => p.processed).length === event.photos.length && event.photos.length > 0 ? 'badge-success' : 'badge-warning'}">
                                        ${event.photos.filter(p => p.processed).length}/${event.photos.length} processed
                                    </span>
                                </div>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            ` : renderEmptyState(
                '📅',
                'No events yet',
                'Create your first event to start uploading photos',
                'Create Event',
                "navigate('photographer-create')"
            )}
        `;
    }, 100);

    // Initial loading state
    return `
        <div class="page-attendee">
            <div class="container">
                <div class="dashboard-header">
                    <div>
                        <h1 class="page-title">Photographer Dashboard</h1>
                        <p class="page-subtitle">Welcome back, ${escapeHtml(currentUser.name)}</p>
                    </div>
                    <button class="btn btn-primary" onclick="navigate('photographer-create')">
                        + Create Event
                    </button>
                </div>
                
                <div class="dashboard-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4);">
                    ${Array(4).fill('<div class="stat-card is-loading" style="height: 120px;"></div>').join('')}
                </div>
                
                <div class="dashboard-chart" style="margin-top: var(--space-6);">
                    <div style="height: 200px; background: var(--bg-secondary); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center;">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
                
                <div class="event-management" style="margin-top: var(--space-6);">
                    <div class="loading-spinner" style="margin: 40px auto;"></div>
                </div>
            </div>
        </div>
    `;
}

// Render Create Event Page
function renderCreateEventPage() {
    if (!requirePhotographer()) return '';

    return `
        <div class="create-event-container">
            ${renderBackButton('Back to Dashboard', 'photographer')}
            
            <div class="page-header" style="text-align: center;">
                <h1 class="page-title">Create New Event</h1>
                <p class="page-subtitle">Set up your event to start uploading photos</p>
            </div>
            
            <div class="create-event-form">
                <form onsubmit="handleCreateEvent(event)">
                    <div class="form-group">
                        <label class="form-label" for="event-name">Event Name *</label>
                        <input type="text" id="event-name" class="form-input" 
                               placeholder="e.g., Summer Music Festival 2024" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="event-date">Event Date *</label>
                        <input type="date" id="event-date" class="form-input" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="event-description">Description (optional)</label>
                        <textarea id="event-description" class="form-input" rows="3"
                                  placeholder="Brief description of the event"></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="event-code">Access Code (4 digits) *</label>
                        <input type="text" id="event-code" class="form-input" 
                               placeholder="e.g., 1234" required 
                               pattern="[0-9]{4}" maxlength="4"
                               style="font-size: 1.5rem; text-align: center; letter-spacing: 0.5rem;">
                        <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.5rem;">
                            Attendees will need this code to access photos
                        </p>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-lg" style="width: 100%" id="create-event-btn">
                        Create Event
                    </button>
                </form>
            </div>
        </div>
    `;
}

// Handle create event form
async function handleCreateEvent(event) {
    event.preventDefault();

    const name = document.getElementById('event-name').value;
    const date = document.getElementById('event-date').value;
    const description = document.getElementById('event-description').value;
    const accessCode = document.getElementById('event-code').value;
    const btn = document.getElementById('create-event-btn');

    // Validate access code
    if (!/^[0-9]{4}$/.test(accessCode)) {
        showToast('Please enter a 4-digit access code', 'error');
        return;
    }

    btn.classList.add('btn-loading');
    btn.disabled = true;

    try {
        const newEvent = await createEvent(name, date, description, null, accessCode);
        navigate('photographer-event', newEvent.id);
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// Render Photographer Event Detail Page
function renderPhotographerEventPage(eventId) {
    if (!requirePhotographer()) return '';

    // Load async data
    setTimeout(async () => {
        const container = document.querySelector('.container');
        if (!container) return;

        const event = await getEventByIdAsync(eventId);

        if (!event) {
            container.innerHTML = renderEmptyState('❌', 'Event not found', 'This event may have been removed');
            return;
        }

        if (event.photographerId !== currentUser.id) {
            container.innerHTML = renderEmptyState('🔒', 'Access Denied', 'You can only view your own events');
            return;
        }

        const processedCount = event.photos.filter(p => p.processed).length;
        const totalCount = event.photos.length;
        window.currentDisplayPhotos = event.photos;

        container.innerHTML = `
            ${renderBackButton('Back to Dashboard', 'photographer')}

            <div class="event-detail-header">
                <div>
                    <h1 class="event-detail-title">${escapeHtml(event.name)}</h1>
                    <div class="event-detail-meta">
                        <span class="event-detail-meta-item">📅 ${formatDate(event.date)}</span>
                        <span class="event-detail-meta-item">📷 ${totalCount} photos</span>
                        <span class="event-detail-meta-item">
                            <span class="badge ${processedCount === totalCount && totalCount > 0 ? 'badge-success' : 'badge-info'}">
                                ${processedCount}/${totalCount} processed
                            </span>
                        </span>
                    </div>
                </div>
                <button class="btn btn-secondary btn-share" onclick="showEventQRCode('${eventId}', '${escapeHtml(event.name)}')">
                    📱 Share QR Code
                </button>
            </div>

            <div class="upload-section">
                <h2 class="upload-section-title">Upload Photos</h2>
                ${renderUploadZone('event-photos-upload', {
            multiple: true,
            maxFiles: 100,
            hint: 'Drag and drop photos or click to browse (JPG, PNG, WebP)'
        })}
                
                <div style="margin-top: var(--space-4); display: flex; gap: var(--space-3);">
                    <button class="btn btn-primary" id="upload-photos-btn" onclick="handlePhotoUpload('${eventId}')" disabled>
                        📤 Upload & Process Photos
                    </button>
                    ${totalCount > processedCount ? `
                        <button class="btn btn-secondary" onclick="processRemainingPhotos('${eventId}')">
                            🤖 Process Remaining (${totalCount - processedCount})
                        </button>
                    ` : ''}
                </div>
            </div>

            <div class="photos-section">
                <div class="photos-header">
                    <h2 class="heading-4">Event Photos</h2>
                    <span class="photos-count">${totalCount} photos uploaded</span>
                </div>

                ${renderPhotoGallery(event.photos, {
            showDownload: false,
            showMatch: false,
            watermarked: false,
            onPhotoClick: true
        })}
            </div>
        `;
    }, 100);

    // Initial loading state
    return `
        <div class="page-attendee">
            <div class="container" style="padding: 60px 20px;">
                <div class="loading-spinner"></div>
                <p style="color: var(--text-secondary); margin-top: 16px; text-align: center;">
                    Loading event details...
                </p>
            </div>
        </div>
    `;
}

// Listen for file uploads on photographer page
document.addEventListener('filesChanged', (e) => {
    if (e.detail.zoneId === 'event-photos-upload') {
        const btn = document.getElementById('upload-photos-btn');
        if (btn) {
            btn.disabled = e.detail.files.length === 0;
        }
    }
});

// Handle photo upload
async function handlePhotoUpload(eventId) {
    const files = getUploadedFiles('event-photos-upload');

    if (files.length === 0) {
        showToast('Please select photos to upload', 'warning');
        return;
    }

    showProgressModal('Uploading & Processing Photos', [
        'Uploading to cloud...',
        'Loading AI models...',
        'Detecting faces...',
        'Finalizing...'
    ]);

    try {
        // Step 1: Add photos to event (uploads to cloud)
        updateProgressStep(0);
        const photoData = files.map(f => f.data);
        const uploadedPhotos = await addPhotosToEvent(eventId, photoData);
        updateProgressStep(0, true);

        showToast(`☁️ ${uploadedPhotos.length} photos uploaded to cloud!`, 'success');

        // Step 2: Init face API
        updateProgressStep(1);
        await initFaceApi();
        updateProgressStep(1, true);

        // Step 3: Process faces
        updateProgressStep(2);
        await processEventPhotos(eventId, (progress) => {
            // Could update UI with individual photo progress here
        });
        updateProgressStep(2, true);

        // Step 4: Done
        updateProgressStep(3);
        await sleep(500);
        updateProgressStep(3, true);

        hideProgressModal();
        clearUploadedFiles('event-photos-upload');
        showToast(`${uploadedPhotos.length} photos uploaded and processed!`, 'success');

        // Refresh page
        navigate('photographer-event', eventId);

    } catch (error) {
        hideProgressModal();
        console.error('Upload error:', error);
        showToast(error.message || 'Error uploading photos. Please try again.', 'error');
    }
}

// Process remaining unprocessed photos
async function processRemainingPhotos(eventId) {
    showProgressModal('Processing Photos', [
        'Loading AI models...',
        'Detecting faces...',
        'Saving results...'
    ]);

    try {
        updateProgressStep(0);
        await initFaceApi();
        updateProgressStep(0, true);

        updateProgressStep(1);
        const result = await processEventPhotos(eventId);
        updateProgressStep(1, true);

        updateProgressStep(2);
        await sleep(500);
        updateProgressStep(2, true);

        hideProgressModal();
        showToast(`Processed ${result.processed} photos!`, 'success');

        // Refresh page
        navigate('photographer-event', eventId);

    } catch (error) {
        hideProgressModal();
        console.error('Processing error:', error);
        showToast('Error processing photos. Please try again.', 'error');
    }
}

// Handle Email to Booth
function emailPhotosToBooth() {
    const matches = window.matchedPhotos || [];
    const eventName = window.currentEventName || 'Event';

    if (matches.length === 0) {
        showToast('No photos to send', 'warning');
        return;
    }

    // Prompt for Name
    const userName = prompt("Please enter your name for the print order:");
    if (!userName) return; // User cancelled

    const email = 'photos@nexwave.live';
    const subject = encodeURIComponent(`Print Order: ${userName} - ${eventName}`);

    // Create a list of photo URLs
    const photoLinks = matches.map((m, i) => `Photo ${i + 1}: ${m.data}`).join('\n\n');

    const bodyHeader = encodeURIComponent(`Name: ${userName}\nEvent: ${eventName}\nPhotos: ${matches.length}\n\nPlease print these photos:\n\n`);
    const bodyLinks = encodeURIComponent(photoLinks);

    window.location.href = `mailto:${email}?subject=${subject}&body=${bodyHeader}${bodyLinks}`;

    showToast('Opening email client...', 'success');
}
