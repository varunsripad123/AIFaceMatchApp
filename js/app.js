/* ============================================
   NEXWAVE - Main Application
   Router and initialization
   ============================================ */

// Current route state
let currentRoute = {
    page: 'home',
    params: null
};

// Route configuration
const routes = {
    'home': { render: renderHomePage, title: 'Nexwave - AI Face Match' },
    'login': { render: renderLoginPage, title: 'Login - Nexwave' },
    'signup': { render: renderSignupPage, title: 'Sign Up - Nexwave' },
    'attendee': { render: renderAttendeePage, title: 'Find Photos - Nexwave' },
    'attendee-event': { render: renderAttendeeEventPage, title: 'Upload Selfie - Nexwave', paramRequired: true },
    'attendee-results': { render: renderAttendeeResultsPage, title: 'Your Photos - Nexwave', paramRequired: true },
    'event': { render: renderAttendeeEventPage, title: 'Find Your Photos - Nexwave', paramRequired: true }, // Direct link from QR code
    'photographer': { render: renderPhotographerPage, title: 'Dashboard - Nexwave' },
    'photographer-create': { render: renderCreateEventPage, title: 'Create Event - Nexwave' },
    'photographer-event': { render: renderPhotographerEventPage, title: 'Event Details - Nexwave', paramRequired: true }
};

// Navigate to a page
function navigate(page, params = null) {
    // Handle combined route like 'attendee-event/abc123'
    if (page.includes('/')) {
        const parts = page.split('/');
        page = parts[0];
        params = parts[1];
    }

    currentRoute = { page, params };

    // Update URL hash
    const hash = params ? `${page}/${params}` : page;
    window.location.hash = hash;

    renderPage();
}

// Render current page
function renderPage() {
    const route = routes[currentRoute.page];

    if (!route) {
        navigate('home');
        return;
    }

    // Update page title
    document.title = route.title;

    // Render page content
    const mainContent = document.getElementById('main-content');

    if (route.paramRequired && currentRoute.params) {
        mainContent.innerHTML = route.render(currentRoute.params);
    } else if (!route.paramRequired) {
        mainContent.innerHTML = route.render();
    } else {
        navigate('home');
        return;
    }

    // Scroll to top
    window.scrollTo(0, 0);

    // Update active nav state
    updateNavAuth();
}

// Parse URL hash
function parseHash() {
    const hash = window.location.hash.slice(1) || 'home';
    const parts = hash.split('/');

    return {
        page: parts[0] || 'home',
        params: parts[1] || null
    };
}

// Handle hash changes
function handleHashChange() {
    const parsed = parseHash();
    currentRoute = parsed;
    renderPage();
}

// Initialize application
async function initApp() {
    console.log('🚀 Initializing Nexwave...');

    // Initialize Firebase first
    try {
        await initFirebase();
        console.log('🔥 Firebase connected');

        // Migrate localStorage data to Firebase (one-time)
        const migrated = storage.get('nexwave_migrated_to_firebase', false);
        if (!migrated) {
            await migrateLocalStorageToFirebase();
            storage.set('nexwave_migrated_to_firebase', true);
        }
    } catch (err) {
        console.warn('⚠️ Firebase not available, using localStorage fallback');
    }

    // Initialize auth
    initAuth();

    // Initialize demo data
    initDemoEvents();

    // Parse initial route
    const parsed = parseHash();
    currentRoute = parsed;

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Initial render
    renderPage();

    console.log('✨ Nexwave ready!');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
