/**
 * Nexwave R2 Upload Worker
 * Handles photo uploads to Cloudflare R2 for the photographer dashboard
 */

interface Env {
	PHOTOS: R2Bucket;
	AUTH_KEY?: string;
}

// CORS headers for browser access
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Key',
	'Access-Control-Max-Age': '86400',
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);
		const path = url.pathname;

		try {
			// Upload endpoint: POST /upload
			if (path === '/upload' && request.method === 'POST') {
				return await handleUpload(request, env);
			}

			// Get file: GET /photos/{filename}
			if (path.startsWith('/photos/') && request.method === 'GET') {
				const key = path.replace('/photos/', '');
				return await handleGet(key, env);
			}

			// List files: GET /list
			if (path === '/list' && request.method === 'GET') {
				return await handleList(request, env);
			}

			// Delete file: DELETE /photos/{filename}
			if (path.startsWith('/photos/') && request.method === 'DELETE') {
				const key = path.replace('/photos/', '');
				return await handleDelete(key, env);
			}

			// Health check
			if (path === '/health') {
				return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
			}

			return jsonResponse({ error: 'Not found' }, 404);
		} catch (error: any) {
			console.error('Worker error:', error);
			return jsonResponse({ error: error.message || 'Internal server error' }, 500);
		}
	},
} satisfies ExportedHandler<Env>;

// Handle file upload
async function handleUpload(request: Request, env: Env): Promise<Response> {
	const contentType = request.headers.get('Content-Type') || '';

	if (contentType.includes('multipart/form-data')) {
		// Handle multipart form upload
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return jsonResponse({ error: 'No file provided' }, 400);
		}

		const filename = `${Date.now()}_${file.name}`;
		await env.PHOTOS.put(filename, file.stream(), {
			httpMetadata: {
				contentType: file.type,
			},
		});

		const origin = new URL(request.url).origin;
		const publicUrl = `${origin}/photos/${filename}`;

		return jsonResponse({
			success: true,
			filename: filename,
			url: publicUrl,
			size: file.size,
		});
	} else if (contentType.includes('application/json')) {
		// Handle base64 JSON upload
		const body = await request.json() as { data: string; filename?: string; contentType?: string };

		if (!body.data) {
			return jsonResponse({ error: 'No data provided' }, 400);
		}

		// Remove data URL prefix if present
		const base64Data = body.data.replace(/^data:image\/\w+;base64,/, '');
		const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

		const filename = body.filename || `${Date.now()}_photo.jpg`;
		await env.PHOTOS.put(filename, binaryData, {
			httpMetadata: {
				contentType: body.contentType || 'image/jpeg',
			},
		});

		const origin = new URL(request.url).origin;
		const publicUrl = `${origin}/photos/${filename}`;

		return jsonResponse({
			success: true,
			filename: filename,
			url: publicUrl,
			size: binaryData.length,
		});
	}

	return jsonResponse({ error: 'Unsupported content type' }, 400);
}

// Handle file retrieval
async function handleGet(key: string, env: Env): Promise<Response> {
	const object = await env.PHOTOS.get(key);

	if (!object) {
		return jsonResponse({ error: 'File not found' }, 404);
	}

	const headers = new Headers(corsHeaders);
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);

	return new Response(object.body, { headers });
}

// Handle file listing
async function handleList(request: Request, env: Env): Promise<Response> {
	const list = await env.PHOTOS.list({ limit: 1000 });
	const origin = new URL(request.url).origin;

	const files = list.objects.map(obj => ({
		key: obj.key,
		size: obj.size,
		uploaded: obj.uploaded,
		url: `${origin}/photos/${obj.key}`,
	}));

	return jsonResponse({ files, count: files.length });
}

// Handle file deletion
async function handleDelete(key: string, env: Env): Promise<Response> {
	await env.PHOTOS.delete(key);
	return jsonResponse({ success: true, deleted: key });
}

// JSON response helper
function jsonResponse(data: any, status: number = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders,
		},
	});
}
