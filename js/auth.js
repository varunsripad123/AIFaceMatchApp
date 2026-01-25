/* ============================================
   NEXWAVE - Authentication Service
   Firebase Authentication Integration
   ============================================ */

// Auth state
let currentUser = null;
let currentUserProfile = null;
let authListeners = [];
let authInitialized = false;
let authReadyPromise = null;
let authReadyResolve = null;

// Initialize auth with Firebase Auth listener
async function initAuth() {
    if (authInitialized) return authReadyPromise;
    authInitialized = true;

    // Ensure Firebase is ready
    if (!isFirebaseReady()) {
        await initFirebase();
    }

    // Create promise that resolves when first auth state is determined
    authReadyPromise = new Promise(resolve => {
        authReadyResolve = resolve;
    });

    // Set up Firebase Auth state listener
    firebase.auth().onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
            // User is signed in - fetch their profile from Firestore
            const profile = await getUserProfile(firebaseUser.uid);

            if (profile) {
                currentUser = {
                    id: firebaseUser.uid,
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: profile.name,
                    role: profile.role,
                    phone: profile.phone,
                    photoURL: profile.photoURL
                };
                currentUserProfile = profile;
            } else {
                // Profile doesn't exist yet (shouldn't happen normally)
                currentUser = {
                    id: firebaseUser.uid,
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    name: firebaseUser.displayName || 'User',
                    role: 'attendee'
                };
                currentUserProfile = null;
            }
        } else {
            // User is signed out
            currentUser = null;
            currentUserProfile = null;
        }

        notifyAuthChange();

        // Resolve the ready promise on first callback
        if (authReadyResolve) {
            authReadyResolve();
            authReadyResolve = null;
        }
    });

    console.log('🔐 Firebase Auth initialized');
    return authReadyPromise;
}

// Wait for auth to be ready (use this before checking currentUser)
async function waitForAuthReady() {
    if (!authInitialized) await initAuth();
    if (authReadyPromise) await authReadyPromise;
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

// Get current user's full profile
function getCurrentUserProfile() {
    return currentUserProfile;
}

// Check if user is logged in
function isLoggedIn() {
    return currentUser !== null;
}

// Check if user is photographer
function isPhotographer() {
    return currentUser?.role === 'photographer';
}

// Sign up new user with Firebase Auth
async function signUp(name, email, password, role = 'attendee', accessCode = '', phone = '') {
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

    try {
        // Create Firebase Auth user
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;

        // Update display name
        await firebaseUser.updateProfile({ displayName: name.trim() });

        // Create user profile in Firestore
        const profile = await createUserProfile(firebaseUser.uid, {
            email: email.toLowerCase(),
            name: name.trim(),
            role: role,
            phone: phone.trim()
        });

        // Set local state
        currentUser = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: name.trim(),
            role: role,
            phone: phone.trim()
        };
        currentUserProfile = profile;

        notifyAuthChange();
        showToast('Account created successfully!', 'success');

        return currentUser;

    } catch (error) {
        console.error('Signup error:', error);

        // Handle specific Firebase errors
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('An account with this email already exists');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('Password is too weak. Please use at least 6 characters.');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Please enter a valid email address');
        }

        throw error;
    }
}

// Login user with Firebase Auth
async function login(email, password) {
    if (!email || !password) {
        throw new Error('Please enter email and password');
    }

    try {
        const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;

        // Fetch user profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid);

        if (profile) {
            currentUser = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: profile.name,
                role: profile.role,
                photoURL: profile.photoURL
            };
            currentUserProfile = profile;
        } else {
            // Fallback if profile doesn't exist
            currentUser = {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName || 'User',
                role: 'attendee'
            };
            currentUserProfile = null;
        }

        notifyAuthChange();

        return currentUser;

    } catch (error) {
        console.error('Login error:', error);

        // Handle specific Firebase errors
        if (error.code === 'auth/user-not-found') {
            throw new Error('No account found with this email');
        } else if (error.code === 'auth/wrong-password') {
            throw new Error('Incorrect password');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('Please enter a valid email address');
        } else if (error.code === 'auth/too-many-requests') {
            throw new Error('Too many failed attempts. Please try again later.');
        }

        throw new Error('Invalid email or password');
    }
}

// Logout user
async function logout() {
    try {
        await firebase.auth().signOut();
        currentUser = null;
        currentUserProfile = null;
        notifyAuthChange();
        navigate('home');
        showToast('Logged out successfully', 'info');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// Send password reset email
async function resetPassword(email) {
    if (!isValidEmail(email)) {
        throw new Error('Please enter a valid email address');
    }

    try {
        await firebase.auth().sendPasswordResetEmail(email);
        showToast('Password reset email sent!', 'success');
    } catch (error) {
        console.error('Password reset error:', error);

        if (error.code === 'auth/user-not-found') {
            throw new Error('No account found with this email');
        }

        throw new Error('Failed to send reset email');
    }
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

// Legacy functions kept for backward compatibility
function getUsers() {
    return storage.get('nexwave_users', []);
}

function saveUsers(users) {
    storage.set('nexwave_users', users);
}
