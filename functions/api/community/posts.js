// ============================================
// Q-OTS COMMUNITY API - Cloudflare Worker
// Posts CRUD with D1 Database
// ============================================

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

export async function onRequest(context) {
    // Handle CORS
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    const { request, env } = context;
    const url = new URL(request.url);
    const DB = env.DB;  // D1 Database binding

    // Initialize database tables if needed
    try {
        await DB.exec(`
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                author_id TEXT,
                author_name TEXT,
                author_avatar TEXT,
                url TEXT,
                tags TEXT,
                category TEXT,
                likes INTEGER DEFAULT 0,
                comments INTEGER DEFAULT 0,
                views INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS comments (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                author_id TEXT,
                author_name TEXT,
                author_avatar TEXT,
                content TEXT NOT NULL,
                likes INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (post_id) REFERENCES posts(id)
            );
            
            CREATE TABLE IF NOT EXISTS likes (
                id TEXT PRIMARY KEY,
                post_id TEXT,
                comment_id TEXT,
                user_id TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
    } catch (e) {
        // Tables might already exist
    }

    try {
        switch (request.method) {
            case 'GET':
                return handleGet(url, DB);
            case 'POST':
                return handlePost(request, DB);
            case 'PUT':
                return handlePut(request, DB);
            case 'DELETE':
                return handleDelete(request, DB);
            default:
                return jsonResponse({ error: 'Method not allowed' }, 405);
        }
    } catch (error) {
        console.error('Community API error:', error);
        return jsonResponse({ error: 'Internal server error' }, 500);
    }
}

async function handleGet(url, DB) {
    const type = url.searchParams.get('type');
    const postId = url.searchParams.get('id');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (postId) {
        // Get single post with comments
        const post = await DB.prepare(
            'SELECT * FROM posts WHERE id = ?'
        ).bind(postId).first();

        if (!post) {
            return jsonResponse({ error: 'Post not found' }, 404);
        }

        // Increment views
        await DB.prepare(
            'UPDATE posts SET views = views + 1 WHERE id = ?'
        ).bind(postId).run();

        // Get comments
        const comments = await DB.prepare(
            'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC'
        ).bind(postId).all();

        return jsonResponse({
            post: { ...post, views: post.views + 1 },
            comments: comments.results || []
        });
    }

    // List posts
    let query = 'SELECT * FROM posts';
    const params = [];

    if (type) {
        query += ' WHERE type = ?';
        params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = DB.prepare(query);
    const result = await stmt.bind(...params).all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM posts';
    if (type) {
        countQuery += ' WHERE type = ?';
    }
    const countStmt = type ? DB.prepare(countQuery).bind(type) : DB.prepare(countQuery);
    const countResult = await countStmt.first();

    return jsonResponse({
        posts: result.results || [],
        total: countResult?.total || 0,
        limit,
        offset
    });
}

async function handlePost(request, DB) {
    const data = await request.json();
    const { type, title, content, author_id, author_name, author_avatar, url, tags, category } = data;

    if (!type || !title || !content) {
        return jsonResponse({ error: 'Type, title, and content are required' }, 400);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await DB.prepare(`
        INSERT INTO posts (id, type, title, content, author_id, author_name, author_avatar, url, tags, category, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
        id, type, title, content,
        author_id || null,
        author_name || 'Anonymous',
        author_avatar || null,
        url || null,
        tags || null,
        category || null,
        now, now
    ).run();

    return jsonResponse({
        success: true,
        post: { id, type, title, content, author_name, created_at: now }
    }, 201);
}

async function handlePut(request, DB) {
    const data = await request.json();
    const { id, title, content, tags, category } = data;

    if (!id) {
        return jsonResponse({ error: 'Post ID required' }, 400);
    }

    const now = new Date().toISOString();

    const updates = [];
    const params = [];

    if (title) { updates.push('title = ?'); params.push(title); }
    if (content) { updates.push('content = ?'); params.push(content); }
    if (tags !== undefined) { updates.push('tags = ?'); params.push(tags); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(id);

    await DB.prepare(`
        UPDATE posts SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();

    return jsonResponse({ success: true });
}

async function handleDelete(request, DB) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return jsonResponse({ error: 'Post ID required' }, 400);
    }

    // Delete comments first
    await DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(id).run();
    
    // Delete likes
    await DB.prepare('DELETE FROM likes WHERE post_id = ?').bind(id).run();
    
    // Delete post
    await DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();

    return jsonResponse({ success: true });
}
