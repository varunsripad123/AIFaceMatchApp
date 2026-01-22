/* ============================================
   NEXWAVE - Cloudflare R2 Storage Service
   Unlimited storage for professional photos
   ============================================ */

const R2_WORKER_URL = 'https://nexwave-worker.nexwave-api.workers.dev';
const R2_PUBLIC_URL = 'https://pub-480c13562e3442c99230dc7b06e210a2.r2.dev';

// Upload image to R2 via Worker
async function uploadToCloud(base64Data, name = 'photo') {
    try {
        const response = await fetch(`${R2_WORKER_URL}/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: base64Data,
                filename: name,
                contentType: 'image/jpeg'
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();

        if (result.success) {
            return {
                success: true,
                id: result.filename,
                url: result.url,
                displayUrl: result.url,
                thumbUrl: result.url,
                size: result.size
            };
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('R2 upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Upload multiple images to cloud with progress
async function uploadMultipleToCloud(base64Array, onProgress = null) {
    const results = [];
    const total = base64Array.length;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < total; i++) {
        const filename = `nexwave_${Date.now()}_${i}.jpg`;
        let result = await uploadToCloud(base64Array[i], filename);

        // Retry once if failed
        if (!result.success) {
            console.log(`Retrying upload ${i + 1}...`);
            await sleep(1000);
            result = await uploadToCloud(base64Array[i], `${filename}_retry`);
        }

        results.push(result);

        if (result.success) {
            successCount++;
        } else {
            failCount++;
            console.error(`Failed to upload photo ${i + 1}:`, result.error);
        }

        if (onProgress) {
            onProgress({
                current: i + 1,
                total: total,
                success: result.success,
                successCount: successCount,
                failCount: failCount
            });
        }

        // Delay between uploads to avoid overwhelming
        if (i < total - 1) {
            await sleep(200);
        }
    }

    console.log(`Upload complete: ${successCount} success, ${failCount} failed`);

    return results;
}

// List all files in R2 bucket
async function listCloudFiles() {
    try {
        const response = await fetch(`${R2_WORKER_URL}/list`);
        if (!response.ok) throw new Error('Failed to list files');
        return await response.json();
    } catch (error) {
        console.error('R2 list error:', error);
        return { files: [], count: 0 };
    }
}

// Delete file from R2
async function deleteCloudFile(filename) {
    try {
        const response = await fetch(`${R2_WORKER_URL}/photos/${filename}`, {
            method: 'DELETE'
        });
        return response.ok;
    } catch (error) {
        console.error('R2 delete error:', error);
        return false;
    }
}

// Check if cloud storage is available
function isCloudStorageAvailable() {
    return R2_WORKER_URL && R2_WORKER_URL.length > 0;
}

// Get public URL for a file
function getCloudFileUrl(filename) {
    return `${R2_PUBLIC_URL}/${filename}`;
}
