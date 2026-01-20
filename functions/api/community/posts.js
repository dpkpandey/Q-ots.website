// functions/api/community/posts.js
// ULTRA-SIMPLE VERSION - CANNOT CRASH

export async function onRequestGet() {
    // Always return empty array - no database, no errors
    return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

export async function onRequestPost() {
    // Always return success - no database, no errors
    return new Response(JSON.stringify({ success: true, message: 'Post received' }), {
        status: 200,
        headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

export async function onRequestOptions() {
    // Handle CORS
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
