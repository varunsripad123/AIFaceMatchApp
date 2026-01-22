/* ============================================
   NEXWAVE - Firebase Integration
   Cross-browser sync for events, users, and face descriptors
   ============================================ */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCPA8c12gE8k6oCulOvI9aA5CXdJmsZYUs",
    authDomain: "photos-7b55b.firebaseapp.com",
    projectId: "photos-7b55b",
    storageBucket: "photos-7b55b.firebasestorage.app",
    messagingSenderId: "303188803026",
    appId: "1:303188803026:web:ba81aede4f8e9462211c0b"
};

// Firebase state
let firebaseApp = null;
let db = null;
let firebaseReady = false;

// Initialize Firebase
async function initFirebase() {
    if (firebaseReady) return true;

    try {
        // Initialize Firebase app
        firebaseApp = firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();

        // Enable persistence for offline support
        try {
            await db.enablePersistence({ synchronizeTabs: true });
        } catch (err) {
            console.warn('Firestore persistence error:', err.code);
        }

        firebaseReady = true;
        console.log('🔥 Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        return false;
    }
}

// Check if Firebase is ready
function isFirebaseReady() {
    return firebaseReady && db !== null;
}

// ============================================
// EVENTS COLLECTION
// ============================================

// Get all events from Firestore
async function getEventsFromCloud() {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const snapshot = await db.collection('events').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

// Get public events (for attendees)
async function getPublicEventsFromCloud() {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const snapshot = await db.collection('events')
            .where('isPublic', '==', true)
            .get();

        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(e => e.photos && e.photos.length > 0);
    } catch (error) {
        console.error('Error fetching public events:', error);
        return [];
    }
}

// Get single event by ID
async function getEventFromCloud(eventId) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const doc = await db.collection('events').doc(eventId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching event:', error);
        return null;
    }
}

// Get events by photographer
async function getEventsByPhotographerFromCloud(photographerId) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const snapshot = await db.collection('events')
            .where('photographerId', '==', photographerId)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching photographer events:', error);
        return [];
    }
}

// Create new event
async function createEventInCloud(eventData) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const docRef = await db.collection('events').add({
            ...eventData,
            photos: [],
            faceDescriptors: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Event created in cloud:', docRef.id);
        return { id: docRef.id, ...eventData };
    } catch (error) {
        console.error('Error creating event:', error);
        throw error;
    }
}

// Update event
async function updateEventInCloud(eventId, updates) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        await db.collection('events').doc(eventId).update({
            ...updates,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Event updated:', eventId);
        return true;
    } catch (error) {
        console.error('Error updating event:', error);
        throw error;
    }
}

// Delete event
async function deleteEventFromCloud(eventId) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        await db.collection('events').doc(eventId).delete();
        console.log('✅ Event deleted:', eventId);
        return true;
    } catch (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}

// Add photos to event
async function addPhotosToEventInCloud(eventId, photoDataArray) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) {
            throw new Error('Event not found');
        }

        const newPhotos = photoDataArray.map((photoData, i) => ({
            id: generateId(),
            data: photoData, // This is now a cloud URL from R2
            uploadedAt: new Date().toISOString(),
            processed: false
        }));

        await eventRef.update({
            photos: firebase.firestore.FieldValue.arrayUnion(...newPhotos),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log(`✅ ${newPhotos.length} photos added to event`);
        return newPhotos;
    } catch (error) {
        console.error('Error adding photos:', error);
        throw error;
    }
}

// Update photo descriptors (face data)
async function updatePhotoDescriptorsInCloud(eventId, photoId, descriptors) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const eventRef = db.collection('events').doc(eventId);
        const eventDoc = await eventRef.get();

        if (!eventDoc.exists) return false;

        const eventData = eventDoc.data();

        // Update the photo's processed status
        const photos = eventData.photos.map(p =>
            p.id === photoId ? { ...p, processed: true, faceCount: descriptors.length } : p
        );

        // Add or update face descriptors
        let faceDescriptors = eventData.faceDescriptors || [];
        const existingIndex = faceDescriptors.findIndex(d => d.photoId === photoId);

        const descriptorEntry = { photoId, descriptors };

        if (existingIndex >= 0) {
            faceDescriptors[existingIndex] = descriptorEntry;
        } else {
            faceDescriptors.push(descriptorEntry);
        }

        await eventRef.update({ photos, faceDescriptors });

        return true;
    } catch (error) {
        console.error('Error updating descriptors:', error);
        return false;
    }
}

// Get event face descriptors
async function getEventDescriptorsFromCloud(eventId) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const doc = await db.collection('events').doc(eventId).get();
        if (doc.exists) {
            return doc.data().faceDescriptors || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching descriptors:', error);
        return [];
    }
}

// ============================================
// USERS COLLECTION
// ============================================

// Get user by email
async function getUserByEmailFromCloud(email) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const snapshot = await db.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// Create user
async function createUserInCloud(userData) {
    if (!isFirebaseReady()) await initFirebase();

    try {
        const docRef = await db.collection('users').add({
            ...userData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ User created:', docRef.id);
        return { id: docRef.id, ...userData };
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
}

// ============================================
// MIGRATION: LocalStorage to Firebase
// ============================================

async function migrateLocalStorageToFirebase() {
    if (!isFirebaseReady()) await initFirebase();

    console.log('🔄 Starting migration from localStorage to Firebase...');

    // Migrate events
    const localEvents = storage.get('nexwave_events', []);
    for (const event of localEvents) {
        try {
            // Check if event already exists in Firebase
            const existingEvent = await getEventFromCloud(event.id);
            if (!existingEvent) {
                await db.collection('events').doc(event.id).set({
                    ...event,
                    migratedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`  ✓ Migrated event: ${event.name}`);
            }
        } catch (err) {
            console.error(`  ✗ Failed to migrate event: ${event.name}`, err);
        }
    }

    // Migrate users
    const localUsers = storage.get('nexwave_users', []);
    for (const user of localUsers) {
        try {
            const existingUser = await getUserByEmailFromCloud(user.email);
            if (!existingUser) {
                await createUserInCloud(user);
                console.log(`  ✓ Migrated user: ${user.email}`);
            }
        } catch (err) {
            console.error(`  ✗ Failed to migrate user: ${user.email}`, err);
        }
    }

    console.log('✅ Migration complete!');
}
