/* ============================================
   NEXWAVE - Authentication Service
   ============================================ */

const AUTH_STORAGE_KEY = 'nexwave_auth';
const USERS_STORAGE_KEY = 'nexwave_users';

// Auth state
let currentUser = null;
let authListeners = [];

// Initialize auth from storage
function initAuth() {
    const savedAuth = storage.get(AUTH_STORAGE_KEY);
    if (savedAuth) {
        currentUser = savedAuth;
    }
    updateNavAuth();
}

// Subscribe to auth changes
function onAuthChange(callback) {
    authListeners.push(callback);
    return () => {
        authListeners = authListeners.filter(cb => cb !== callback);
    };
}

// Notify auth listeners
function notifyAuthChange() {
    authListeners.forEach(cb => cb(currentUser));
    updateNavAuth();
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Check if user is photographer
function isPhotographer() {
    return currentUser?.role === 'photographer';
}

// Get all users from storage
function getUsers() {
    return storage.get(USERS_STORAGE_KEY, []);
}

// Save users to storage
function saveUsers(users) {
    storage.set(USERS_STORAGE_KEY, users);
}

// Sign up new user
async function signUp(name, email, password, role = 'attendee', accessCode = '') {
    // Simulate network delay
    await sleep(800);

    // Validate inputs
    if (!name || name.trim().length < 2) {
        throw new Error('Name must be at least 2 characters');
    }

    if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
    }

    if (!isValidPassword(password)) {
        throw new Error('Password must be at least 6 characters');
    }

    if (!['attendee', 'photographer'].includes(role)) {
        throw new Error('Invalid role selected');
    }

    // Security Check: Require Invite Code for Photographers
    if (role === 'photographer') {
        const correctCode = 'NEXWAVE2024'; // Hardcoded secret for MVP
        if (accessCode !== correctCode) {
            throw new Error('Invalid Access Code. Please request an invite to join as a photographer.');
        }
    }

    // Check if email already exists
    const users = getUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        throw new Error('An account with this email already exists');
    }

    // Create new user
    const newUser = {
        id: generateId(),
        name: name.trim(),
        email: email.toLowerCase(),
        password: password, // In production, this should be hashed
        role: role,
        createdAt: new Date().toISOString()
    };

    // Save user locally
    users.push(newUser);
    saveUsers(users);

    // Save user to Cloud (Firebase)
    if (isFirebaseReady()) {
        try {
            await createUserInCloud(newUser);
        } catch (err) {
            console.error('Failed to create user in cloud:', err);
            // Continue with local user
        }
    }

    // Auto login
    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;

    currentUser = userWithoutPassword;
    storage.set(AUTH_STORAGE_KEY, currentUser);
    notifyAuthChange();

    return currentUser;
}

// Login user
async function login(email, password) {
    // Simulate network delay
    await sleep(600);

    if (!email || !password) {
        throw new Error('Please enter email and password');
    }

    let user = null;

    // 1. Try Cloud Login
    if (isFirebaseReady()) {
        try {
            const cloudUser = await getUserByEmailFromCloud(email);
            if (cloudUser && cloudUser.password === password) {
                user = cloudUser;
            }
        } catch (err) {
            console.error('Cloud login failed, falling back to local:', err);
        }
    }

    // 2. Try Local Login (Fallback)
    if (!user) {
        const users = getUsers();
        user = users.find(u =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password
        );
    }

    if (!user) {
        throw new Error('Invalid email or password');
    }

    // Set current user (without password)
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    currentUser = userWithoutPassword;
    storage.set(AUTH_STORAGE_KEY, currentUser);
    notifyAuthChange();

    return currentUser;
}

// Logout user
function logout() {
    currentUser = null;
    storage.remove(AUTH_STORAGE_KEY);
    notifyAuthChange();
    navigate('home');
}

// Update nav based on auth state
function updateNavAuth() {
    const navLinks = document.getElementById('nav-links');
    if (!navLinks) return;

    if (currentUser) {
        const initial = currentUser.name.charAt(0).toUpperCase();
        navLinks.innerHTML = `
            <button class="nav-link" onclick="navigate('${isPhotographer() ? 'photographer' : 'attendee'}')">
                Dashboard
            </button>
            <div class="nav-user">
                <div class="nav-avatar">${initial}</div>
                <span>${escapeHtml(currentUser.name)}</span>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="logout()" style="color: var(--text-secondary);">
                Logout
            </button>
        `;
    } else {
        navLinks.innerHTML = `
            <button class="nav-link" onclick="navigate('login')">Login</button>
            <button class="btn btn-primary btn-sm" onclick="navigate('signup')">Sign Up</button>
        `;
    }
}

// Toggle user menu dropdown
function toggleUserMenu() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

// Require authentication - redirect to login if not logged in
function requireAuth() {
    if (!isLoggedIn()) {
        showToast('Please login to continue', 'warning');
        navigate('login');
        return false;
    }
    return true;
}

// Require photographer role
function requirePhotographer() {
    if (!requireAuth()) return false;

    if (!isPhotographer()) {
        showToast('This page is only for photographers', 'error');
        navigate('home');
        return false;
    }
    return true;
}
