/* ============================================
   NEXWAVE - Advanced Face Detection & Matching Service
   Using face-api.js with highest accuracy models
   ============================================ */

// Face API state
let faceApiLoaded = false;
let faceApiLoading = false;
let modelLoadPromise = null;

// Model URLs - using jsDelivr CDN for @vladmandic/face-api (better maintained fork)
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// Advanced configuration
const FACE_CONFIG = {
    // Use SSD MobileNet V1 for detection (most accurate, ~5.4MB model)
    // Alternative: TinyFaceDetector is faster but less accurate
    detector: 'ssd', // 'ssd' or 'tiny'

    // Detection settings
    minConfidence: 0.5,        // Minimum face detection confidence
    maxFaces: 10,              // Max faces to detect per image

    // Matching thresholds (lower = stricter matching)
    matchThreshold: 0.5,       // Primary threshold for face matching (Euclidean distance)
    highConfidenceThreshold: 0.4,  // High confidence match

    // Quality requirements
    minFaceSize: 50,           // Minimum face size in pixels

    // Multi-angle matching boost
    multiAngleBoost: 0.05      // Reduce threshold when multiple selfies match
};

// Initialize face-api.js with best models
async function initFaceApi() {
    if (faceApiLoaded) return true;
    if (faceApiLoading) return modelLoadPromise;

    faceApiLoading = true;

    modelLoadPromise = new Promise(async (resolve, reject) => {
        try {
            if (typeof faceapi === 'undefined') {
                throw new Error('face-api.js not loaded. Please check your internet connection.');
            }

            console.log('🧠 Loading advanced face detection models...');
            const startTime = Date.now();

            // Load all required models for maximum accuracy
            await Promise.all([
                // SSD MobileNet V1 - Most accurate face detector
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),

                // Tiny Face Detector - Faster alternative (loaded as backup)
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),

                // 68-point face landmarks - For face alignment
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),

                // Face Recognition ResNet - 128-dimensional face embeddings
                // This is the key model for accurate matching
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),

                // Age & Gender (optional, for future features)
                faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),

                // Face Expressions (optional, for future features)
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
            ]);

            const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅ Face models loaded in ${loadTime}s`);

            faceApiLoaded = true;
            faceApiLoading = false;
            resolve(true);
        } catch (error) {
            faceApiLoading = false;
            console.error('❌ Error loading face models:', error);
            reject(error);
        }
    });

    return modelLoadPromise;
}

// Check if face-api is ready
function isFaceApiReady() {
    return faceApiLoaded;
}

// Get detector options based on config
function getDetectorOptions() {
    if (FACE_CONFIG.detector === 'ssd') {
        return new faceapi.SsdMobilenetv1Options({
            minConfidence: FACE_CONFIG.minConfidence,
            maxResults: FACE_CONFIG.maxFaces
        });
    } else {
        return new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,  // Larger input = more accurate
            scoreThreshold: FACE_CONFIG.minConfidence
        });
    }
}

// Detect faces with full pipeline for maximum accuracy
async function detectFaces(imageElement) {
    if (!faceApiLoaded) {
        await initFaceApi();
    }

    try {
        const options = getDetectorOptions();

        // Use full pipeline: detection + landmarks + descriptors
        // Landmarks improve alignment before computing descriptors
        const detections = await faceapi
            .detectAllFaces(imageElement, options)
            .withFaceLandmarks()
            .withFaceDescriptors();

        // Filter by minimum face size
        const validDetections = detections.filter(d => {
            const { width, height } = d.detection.box;
            return width >= FACE_CONFIG.minFaceSize && height >= FACE_CONFIG.minFaceSize;
        });

        return validDetections;
    } catch (error) {
        console.error('Face detection error:', error);
        return [];
    }
}

// Assess image quality for face detection
async function assessImageQuality(imageSrc) {
    const img = await loadImage(imageSrc);

    const quality = {
        width: img.width,
        height: img.height,
        isLargeEnough: img.width >= 200 && img.height >= 200,
        aspectRatio: img.width / img.height,
        score: 0
    };

    // Score based on resolution
    if (img.width >= 1000 && img.height >= 1000) quality.score += 3;
    else if (img.width >= 500 && img.height >= 500) quality.score += 2;
    else if (img.width >= 200 && img.height >= 200) quality.score += 1;

    // Penalize extreme aspect ratios
    if (quality.aspectRatio > 0.5 && quality.aspectRatio < 2) quality.score += 1;

    quality.rating = quality.score >= 3 ? 'excellent' : quality.score >= 2 ? 'good' : 'poor';

    return quality;
}

// Extract face descriptors with quality metadata
async function extractFaceDescriptors(imageSrc) {
    // FIX: Proxy R2 images through Worker to handle CORS
    let safeUrl = imageSrc;
    if (imageSrc && imageSrc.includes('r2.dev')) {
        const filename = imageSrc.split('/').pop();
        // Use the worker proxy to get CORS headers
        safeUrl = `https://nexwave-worker.nexwave-api.workers.dev/photos/${filename}`;
    }

    const img = await loadImage(safeUrl);
    const detections = await detectFaces(img);

    return detections.map(d => ({
        descriptor: Array.from(d.descriptor),
        box: {
            x: d.detection.box.x,
            y: d.detection.box.y,
            width: d.detection.box.width,
            height: d.detection.box.height
        },
        landmarks: d.landmarks.positions.map(p => ({ x: p.x, y: p.y })),
        confidence: d.detection.score,
        // Store face size for quality weighting
        faceSize: d.detection.box.width * d.detection.box.height,
        imageWidth: img.width,
        imageHeight: img.height
    }));
}

// Advanced Euclidean distance with normalization
function calculateFaceDistance(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
        return Infinity;
    }

    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
        const diff = descriptor1[i] - descriptor2[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

// Cosine similarity (alternative distance metric)
function calculateCosineSimilarity(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2 || descriptor1.length !== descriptor2.length) {
        return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < descriptor1.length; i++) {
        dotProduct += descriptor1[i] * descriptor2[i];
        norm1 += descriptor1[i] * descriptor1[i];
        norm2 += descriptor2[i] * descriptor2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

// Advanced face matching with multiple strategies
async function matchFaces(selfieDescriptors, eventDescriptors, options = {}) {
    const threshold = options.threshold || FACE_CONFIG.matchThreshold;
    const useMultiAngle = selfieDescriptors.length > 1;

    const matches = [];
    const photoScores = new Map(); // Track best match per photo

    // For each photo in the event
    for (const photoEntry of eventDescriptors) {
        const { photoId, descriptors: photoDescriptors } = photoEntry;

        if (!photoDescriptors || photoDescriptors.length === 0) continue;

        let photoMatches = [];

        // Check each face in the photo
        for (const photoFace of photoDescriptors) {
            let bestMatch = {
                distance: Infinity,
                cosineSim: 0,
                selfieMatches: 0,
                avgDistance: Infinity
            };

            const distancesFromSelfies = [];

            // Compare against all selfie faces
            for (const selfieFace of selfieDescriptors) {
                const distance = calculateFaceDistance(
                    selfieFace.descriptor,
                    photoFace.descriptor
                );

                const cosineSim = calculateCosineSimilarity(
                    selfieFace.descriptor,
                    photoFace.descriptor
                );

                distancesFromSelfies.push({ distance, cosineSim });

                if (distance < bestMatch.distance) {
                    bestMatch.distance = distance;
                    bestMatch.cosineSim = cosineSim;
                }
            }

            // Multi-angle matching: count how many selfies match this face
            const matchingSelfies = distancesFromSelfies.filter(d =>
                d.distance < threshold + 0.1 // Slightly relaxed threshold
            ).length;

            bestMatch.selfieMatches = matchingSelfies;

            // Calculate average distance across all selfies
            const avgDistance = distancesFromSelfies.reduce((sum, d) => sum + d.distance, 0) / distancesFromSelfies.length;
            bestMatch.avgDistance = avgDistance;

            // Effective threshold: stricter if multiple selfies match
            let effectiveThreshold = threshold;
            if (useMultiAngle && matchingSelfies > 1) {
                // Relax threshold slightly when multiple selfies confirm the match
                effectiveThreshold = threshold + FACE_CONFIG.multiAngleBoost;
            }

            // Check if this is a match
            if (bestMatch.distance < effectiveThreshold) {
                photoMatches.push({
                    photoId,
                    faceBox: photoFace.box,
                    distance: bestMatch.distance,
                    cosineSimilarity: bestMatch.cosineSim,
                    selfieMatchCount: matchingSelfies,
                    avgDistance: bestMatch.avgDistance,
                    faceConfidence: photoFace.confidence || 0
                });
            }
        }

        // If this photo has matches, take the best one
        if (photoMatches.length > 0) {
            // Sort by distance (best match first)
            photoMatches.sort((a, b) => a.distance - b.distance);
            const bestPhotoMatch = photoMatches[0];

            // Calculate final confidence score
            const confidence = calculateAdvancedConfidence(bestPhotoMatch, useMultiAngle);

            matches.push({
                photoId: bestPhotoMatch.photoId,
                distance: bestPhotoMatch.distance,
                confidence: confidence,
                cosineSimilarity: bestPhotoMatch.cosineSimilarity,
                selfieMatchCount: bestPhotoMatch.selfieMatchCount,
                faceBox: bestPhotoMatch.faceBox
            });
        }
    }

    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);

    return matches;
}

// Advanced confidence calculation
function calculateAdvancedConfidence(match, useMultiAngle) {
    // Base confidence from distance (0.0 = perfect match, 0.5 = threshold)
    let confidence = Math.max(0, (1 - match.distance / FACE_CONFIG.matchThreshold)) * 100;

    // Boost for high cosine similarity (should be > 0.7 for matches)
    if (match.cosineSimilarity > 0.8) {
        confidence = Math.min(100, confidence * 1.1);
    } else if (match.cosineSimilarity > 0.7) {
        confidence = Math.min(100, confidence * 1.05);
    }

    // Boost for multiple selfie matches (multi-angle confirmation)
    if (useMultiAngle && match.selfieMatchCount > 1) {
        const boost = Math.min(10, match.selfieMatchCount * 3);
        confidence = Math.min(100, confidence + boost);
    }

    // Boost for high face detection confidence
    if (match.faceConfidence > 0.9) {
        confidence = Math.min(100, confidence * 1.02);
    }

    return Math.round(confidence);
}

// Legacy confidence calculation (for display consistency)
function calculateConfidence(distance) {
    const maxDistance = FACE_CONFIG.matchThreshold;
    const confidence = Math.max(0, (1 - distance / maxDistance)) * 100;
    return Math.round(confidence);
}

// Process photos for an event with progress callback
// Process photos for an event with progress callback
async function processEventPhotos(eventId, onProgress = null) {
    // FIX: Use async cloud fetch instead of sync local fetch
    const event = await getEventByIdAsync(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    await initFaceApi();

    const unprocessedPhotos = event.photos.filter(p => !p.processed);
    const total = unprocessedPhotos.length;
    let processed = 0;
    let totalFacesFound = 0;

    console.log(`📸 Processing ${total} photos for event: ${event.name}`);

    for (const photo of unprocessedPhotos) {
        try {
            const descriptors = await extractFaceDescriptors(photo.data);
            // FIX: Await the update
            await updatePhotoDescriptors(eventId, photo.id, descriptors);

            totalFacesFound += descriptors.length;
            processed++;

            if (onProgress) {
                onProgress({
                    current: processed,
                    total: total,
                    photoId: photo.id,
                    facesFound: descriptors.length,
                    totalFaces: totalFacesFound
                });
            }

            console.log(`  ✓ Photo ${processed}/${total}: ${descriptors.length} face(s) detected`);
        } catch (error) {
            console.error(`  ✗ Error processing photo ${photo.id}:`, error);
            await updatePhotoDescriptors(eventId, photo.id, []);
        }

        // Small delay to prevent UI freezing
        await sleep(50);
    }

    console.log(`✅ Processing complete: ${processed} photos, ${totalFacesFound} faces`);

    return { processed, total, totalFacesFound };
}

// Find matching photos with advanced algorithm
async function findMatchingPhotos(eventId, selfieImages, onProgress = null) {
    const event = await getEventByIdAsync(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    await initFaceApi();

    // Step 1: Extract descriptors from all selfies
    if (onProgress) onProgress({ step: 1, message: 'Analyzing your selfie(s)...' });

    console.log(`🔍 Analyzing ${selfieImages.length} selfie(s)...`);

    const allSelfieDescriptors = [];
    for (let i = 0; i < selfieImages.length; i++) {
        const quality = await assessImageQuality(selfieImages[i]);
        console.log(`  Selfie ${i + 1}: ${quality.width}x${quality.height} (${quality.rating})`);

        const descriptors = await extractFaceDescriptors(selfieImages[i]);

        if (descriptors.length === 0) {
            console.warn(`  ⚠ No face detected in selfie ${i + 1}`);
        } else {
            console.log(`  ✓ ${descriptors.length} face(s) detected in selfie ${i + 1}`);
            allSelfieDescriptors.push(...descriptors);
        }
    }

    if (allSelfieDescriptors.length === 0) {
        throw new Error('No faces detected in your selfie(s). Please try again with a clearer photo where your face is visible.');
    }

    // Step 2: Get event photo descriptors
    if (onProgress) onProgress({ step: 2, message: 'Searching event photos...' });

    console.log(`🔎 Looking for event: ${eventId}`);

    // Use async Firebase-aware function
    const eventDescriptors = await getEventDescriptorsAsync(eventId);
    console.log(`📊 Found ${eventDescriptors.length} photos with face descriptors`);

    if (eventDescriptors.length === 0) {
        throw new Error('No processed photos in this event yet. Please ask the photographer to upload photos.');
    }

    console.log(`📷 Searching through ${eventDescriptors.length} photos with faces...`);

    // Step 3: Advanced matching
    if (onProgress) onProgress({ step: 3, message: 'Finding your matches with AI...' });

    const matches = await matchFaces(allSelfieDescriptors, eventDescriptors, {
        threshold: FACE_CONFIG.matchThreshold
    });

    console.log(`🎯 Found ${matches.length} matching photos`);

    // Step 4: Return matched photos with metadata
    if (onProgress) onProgress({ step: 4, message: 'Preparing results...' });

    const matchedPhotos = matches.map(match => {
        const photo = event.photos.find(p => p.id === match.photoId);
        return {
            ...photo,
            matchConfidence: match.confidence,
            matchDistance: match.distance,
            matchDetails: {
                cosineSimilarity: (match.cosineSimilarity * 100).toFixed(1) + '%',
                selfieMatchCount: match.selfieMatchCount,
                faceLocation: match.faceBox
            }
        };
    });

    return matchedPhotos;
}

// Get matching stats
function getMatchingStats() {
    return {
        detector: FACE_CONFIG.detector === 'ssd' ? 'SSD MobileNet V1' : 'Tiny Face Detector',
        threshold: FACE_CONFIG.matchThreshold,
        models: [
            'SSD MobileNet V1 (detection)',
            '68-point Landmarks (alignment)',
            'ResNet Face Recognition (128-dim embeddings)'
        ]
    };
}
