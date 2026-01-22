/* ============================================
   NEXWAVE - Event Management Service
   Uses Firebase when available, localStorage as fallback
   ============================================ */

const EVENTS_STORAGE_KEY = 'nexwave_events';

// Cache for events (to avoid excessive Firebase reads)
let eventsCache = null;
let eventsCacheTime = 0;
const CACHE_DURATION = 5000; // 5 seconds

// Get all events (Firebase or localStorage)
async function getEventsAsync() {
    if (isFirebaseReady()) {
        // Use cache if fresh
        if (eventsCache && Date.now() - eventsCacheTime < CACHE_DURATION) {
            return eventsCache;
        }
        const events = await getEventsFromCloud();
        eventsCache = events;
        eventsCacheTime = Date.now();
        return events;
    }
    return storage.get(EVENTS_STORAGE_KEY, []);
}

// Sync version for backwards compatibility
function getEvents() {
    if (eventsCache) return eventsCache;
    return storage.get(EVENTS_STORAGE_KEY, []);
}

// Save events (localStorage only - Firebase uses direct updates)
function saveEvents(events) {
    storage.set(EVENTS_STORAGE_KEY, events);
    eventsCache = events;
    eventsCacheTime = Date.now();
}

// Clear events cache
function clearEventsCache() {
    eventsCache = null;
    eventsCacheTime = 0;
}

// Get event by ID
async function getEventByIdAsync(eventId) {
    if (isFirebaseReady()) {
        return await getEventFromCloud(eventId);
    }
    const events = getEvents();
    return events.find(e => e.id === eventId) || null;
}

// Sync version for backwards compatibility
function getEventById(eventId) {
    const events = getEvents();
    return events.find(e => e.id === eventId) || null;
}

// Get events by photographer
async function getEventsByPhotographerAsync(photographerId) {
    if (isFirebaseReady()) {
        return await getEventsByPhotographerFromCloud(photographerId);
    }
    const events = getEvents();
    return events.filter(e => e.photographerId === photographerId);
}

function getEventsByPhotographer(photographerId) {
    const events = getEvents();
    return events.filter(e => e.photographerId === photographerId);
}

// Get public events (for attendees)
async function getPublicEventsAsync() {
    if (isFirebaseReady()) {
        return await getPublicEventsFromCloud();
    }
    const events = getEvents();
    return events.filter(e => e.isPublic && e.photos.length > 0);
}

function getPublicEvents() {
    const events = getEvents();
    return events.filter(e => e.isPublic && e.photos.length > 0);
}

// Create new event
async function createEvent(name, date, description = '', coverImage = null) {
    await sleep(500);

    if (!requirePhotographer()) {
        throw new Error('Only photographers can create events');
    }

    if (!name || name.trim().length < 3) {
        throw new Error('Event name must be at least 3 characters');
    }

    if (!date) {
        throw new Error('Please select an event date');
    }

    const eventData = {
        name: name.trim(),
        date: date,
        description: description.trim(),
        coverImage: coverImage || getPlaceholderImage(800, 450, name),
        photographerId: currentUser.id,
        photographerName: currentUser.name,
        photos: [],
        faceDescriptors: [],
        isPublic: true
    };

    // Use Firebase if available
    if (isFirebaseReady()) {
        try {
            const event = await createEventInCloud(eventData);
            clearEventsCache();
            showToast('Event created successfully!', 'success');
            return event;
        } catch (err) {
            console.error('Firebase create failed:', err);
        }
    }

    // Fallback to localStorage
    const event = {
        id: generateId(),
        ...eventData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const events = getEvents();
    events.push(event);
    saveEvents(events);

    showToast('Event created successfully!', 'success');
    return event;
}

// Update event
async function updateEvent(eventId, updates) {
    await sleep(300);

    const events = getEvents();
    const index = events.findIndex(e => e.id === eventId);

    if (index === -1) {
        throw new Error('Event not found');
    }

    // Check ownership
    if (events[index].photographerId !== currentUser?.id) {
        throw new Error('You can only edit your own events');
    }

    events[index] = {
        ...events[index],
        ...updates,
        updatedAt: new Date().toISOString()
    };

    saveEvents(events);
    return events[index];
}

// Delete event
async function deleteEvent(eventId) {
    await sleep(300);

    const events = getEvents();
    const event = events.find(e => e.id === eventId);

    if (!event) {
        throw new Error('Event not found');
    }

    if (event.photographerId !== currentUser?.id) {
        throw new Error('You can only delete your own events');
    }

    const filteredEvents = events.filter(e => e.id !== eventId);
    saveEvents(filteredEvents);

    showToast('Event deleted', 'success');
}

// Add photos to event (using cloud storage)
async function addPhotosToEvent(eventId, photoDataArray) {
    const events = getEvents();
    const index = events.findIndex(e => e.id === eventId);

    if (index === -1) {
        throw new Error('Event not found');
    }

    // Upload photos to cloud
    console.log(`☁️ Uploading ${photoDataArray.length} photos to cloud...`);

    const uploadResults = await uploadMultipleToCloud(photoDataArray, (progress) => {
        console.log(`  Uploaded ${progress.current}/${progress.total}`);
    });

    // Filter successful uploads
    const successfulUploads = uploadResults.filter(r => r.success);
    const failedCount = uploadResults.length - successfulUploads.length;

    if (failedCount > 0) {
        showToast(`${failedCount} photos failed to upload`, 'warning');
    }

    if (successfulUploads.length === 0) {
        throw new Error('All uploads failed. Please check your internet connection.');
    }

    const newPhotos = successfulUploads.map((result, i) => ({
        id: generateId(),
        // Store cloud URLs instead of base64 data
        data: result.url,              // Full resolution URL
        displayUrl: result.displayUrl,  // Display size URL
        thumbUrl: result.thumbUrl,      // Thumbnail URL
        cloudId: result.id,
        uploadedAt: new Date().toISOString(),
        processed: false
    }));

    events[index].photos.push(...newPhotos);
    events[index].updatedAt = new Date().toISOString();

    // Update cover image if first photos
    if (events[index].photos.length === newPhotos.length && newPhotos[0]?.displayUrl) {
        events[index].coverImage = newPhotos[0].displayUrl;
    }

    saveEvents(events);

    console.log(`✅ ${successfulUploads.length} photos uploaded to cloud!`);

    return newPhotos;
}

// Update photo face descriptors
async function updatePhotoDescriptors(eventId, photoId, descriptors) {
    // Use Firebase if available
    if (isFirebaseReady()) {
        const result = await updatePhotoDescriptorsInCloud(eventId, photoId, descriptors);
        clearEventsCache();
        return result;
    }

    // Fallback to localStorage
    const events = getEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex === -1) return false;

    const photoIndex = events[eventIndex].photos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) return false;

    events[eventIndex].photos[photoIndex].processed = true;
    events[eventIndex].photos[photoIndex].faceCount = descriptors.length;

    // Store descriptors separately (they can be large)
    const descriptorEntry = {
        photoId: photoId,
        descriptors: descriptors
    };

    const existingDescIndex = events[eventIndex].faceDescriptors.findIndex(d => d.photoId === photoId);
    if (existingDescIndex >= 0) {
        events[eventIndex].faceDescriptors[existingDescIndex] = descriptorEntry;
    } else {
        events[eventIndex].faceDescriptors.push(descriptorEntry);
    }

    saveEvents(events);
    return true;
}

// Get photo descriptors for an event
async function getEventDescriptorsAsync(eventId) {
    if (isFirebaseReady()) {
        return await getEventDescriptorsFromCloud(eventId);
    }
    const event = getEventById(eventId);
    if (!event) return [];
    return event.faceDescriptors || [];
}

// Sync version for backwards compatibility
function getEventDescriptors(eventId) {
    const event = getEventById(eventId);
    if (!event) return [];
    return event.faceDescriptors || [];
}

// Delete photo from event
async function deletePhoto(eventId, photoId) {
    const events = getEvents();
    const eventIndex = events.findIndex(e => e.id === eventId);

    if (eventIndex === -1) {
        throw new Error('Event not found');
    }

    events[eventIndex].photos = events[eventIndex].photos.filter(p => p.id !== photoId);
    events[eventIndex].faceDescriptors = events[eventIndex].faceDescriptors.filter(d => d.photoId !== photoId);
    events[eventIndex].updatedAt = new Date().toISOString();

    saveEvents(events);
}

// Get event statistics for photographer
async function getPhotographerStatsAsync(photographerId) {
    const events = await getEventsByPhotographerAsync(photographerId);
    const totalEvents = events.length;
    const totalPhotos = events.reduce((sum, e) => sum + e.photos.length, 0);
    const processedPhotos = events.reduce((sum, e) =>
        sum + e.photos.filter(p => p.processed).length, 0);

    return {
        totalEvents,
        totalPhotos,
        processedPhotos,
        processingRate: totalPhotos > 0 ? Math.round((processedPhotos / totalPhotos) * 100) : 0
    };
}

// Initialize with demo data if empty
function initDemoEvents() {
    const events = getEvents();
    if (events.length > 0) return;

    // Create demo photographer if doesn't exist
    const users = getUsers();
    let demoPhotographer = users.find(u => u.email === 'demo@nexwave.com');

    if (!demoPhotographer) {
        demoPhotographer = {
            id: 'demo_photographer',
            name: 'Demo Photographer',
            email: 'demo@nexwave.com',
            password: 'demo123',
            role: 'photographer',
            createdAt: new Date().toISOString()
        };
        users.push(demoPhotographer);
        saveUsers(users);
    }

    // Create demo events
    const demoEvents = [
        {
            id: 'demo_event_1',
            name: 'Tech Conference 2024',
            date: '2024-12-15',
            description: 'Annual technology conference with keynotes and networking',
            coverImage: getPlaceholderImage(800, 450, 'Tech Conference'),
            photographerId: 'demo_photographer',
            photographerName: 'Demo Photographer',
            photos: [],
            faceDescriptors: [],
            isPublic: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'demo_event_2',
            name: 'Summer Music Festival',
            date: '2024-12-20',
            description: 'Three days of amazing live performances',
            coverImage: getPlaceholderImage(800, 450, 'Music Festival'),
            photographerId: 'demo_photographer',
            photographerName: 'Demo Photographer',
            photos: [],
            faceDescriptors: [],
            isPublic: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            id: 'demo_event_3',
            name: 'Corporate Gala Night',
            date: '2024-12-25',
            description: 'Annual celebration with awards and entertainment',
            coverImage: getPlaceholderImage(800, 450, 'Gala Night'),
            photographerId: 'demo_photographer',
            photographerName: 'Demo Photographer',
            photos: [],
            faceDescriptors: [],
            isPublic: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    ];

    saveEvents(demoEvents);
}
