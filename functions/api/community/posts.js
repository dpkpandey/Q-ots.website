// functions/api/community/posts.js
// Community Posts Handler (Discussions, Q&A, Showcase)

export async function onRequestGet(context) {
    try {
        // Return empty array for now (can connect to D1 database later)
        const posts = [];
        
        return jsonResponse(posts);
        
    } catch (error) {
        console.error('❌ Error fetching posts:', error);
        return jsonResponse({ error: 'Failed to fetch posts' }, 500);
    }
}

export async function onRequestPost(context) {
    const { request } = context;
    
    try {
        const { type, title, content, author, author_email } = await request.json();
        
        if (!type || !title || !content || !author) {
            return jsonResponse({ error: 'Required fields missing' }, 400);
        }
        
        console.log('📝 New post:', { type, title, author });
        
        // Here you can store in D1 database
        // For now, just acknowledge it
        
        return jsonResponse({
            success: true,
            message: 'Post created successfully'
        }, 201);
        
    } catch (error) {
        console.error('❌ Error creating post:', error);
        return jsonResponse({ error: 'Failed to create post' }, 500);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
