// functions/api/community/posts.js
// Real community posts with D1 database and sorting

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'discussion';
  const sort = url.searchParams.get('sort') || 'recent'; // recent, likes, responses
  const limit = parseInt(url.searchParams.get('limit')) || 20;

  try {
    // Initialize database tables if they don't exist
    await initializeTables(env);

    let query = `
      SELECT 
        p.*,
        u.name as author_name,
        u.avatar as author_avatar,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
        (SELECT COUNT(*) FROM post_responses WHERE post_id = p.id) as responses
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.type = ?
    `;

    // Add sorting
    switch (sort) {
      case 'likes':
        query += ' ORDER BY likes DESC, p.created_at DESC';
        break;
      case 'responses':
        query += ' ORDER BY responses DESC, p.created_at DESC';
        break;
      case 'recent':
      default:
        query += ' ORDER BY p.created_at DESC';
        break;
    }

    query += ` LIMIT ?`;

    const { results } = await env.DB.prepare(query)
      .bind(type, limit)
      .all();

    return new Response(JSON.stringify({ posts: results || [] }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    return new Response(JSON.stringify({ 
      posts: [],
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const { type, title, content, category, tags, url: projectUrl } = await request.json();

    // Get user from session
    const cookies = request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));
    const sessionToken = sessionCookie?.split('=')[1];

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user data from session
    let userData;
    if (env.SESSIONS) {
      const sessionData = await env.SESSIONS.get(sessionToken);
      userData = sessionData ? JSON.parse(sessionData) : null;
    }

    if (!userData) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Initialize database
    await initializeTables(env);

    // Create post
    const postId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO posts (
        id, type, title, content, author_id, 
        category, tags, url, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      postId,
      type,
      title,
      content,
      userData.userId,
      category || null,
      tags || null,
      projectUrl || null
    ).run();

    // Fetch the created post with author info
    const { results } = await env.DB.prepare(`
      SELECT 
        p.*,
        u.name as author_name,
        u.avatar as author_avatar,
        0 as likes,
        0 as responses
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.id = ?
    `).bind(postId).all();

    return new Response(JSON.stringify({ 
      success: true,
      post: results[0]
    }), {
      status: 201,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Create post error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create post',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Like a post
export async function onRequestPut({ request, env }) {
  try {
    const url = new URL(request.url);
    const postId = url.searchParams.get('postId');
    const action = url.searchParams.get('action'); // 'like' or 'unlike'

    if (!postId || !action) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from session
    const cookies = request.headers.get('Cookie') || '';
    const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('session='));
    const sessionToken = sessionCookie?.split('=')[1];

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let userData;
    if (env.SESSIONS) {
      const sessionData = await env.SESSIONS.get(sessionToken);
      userData = sessionData ? JSON.parse(sessionData) : null;
    }

    if (!userData) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await initializeTables(env);

    if (action === 'like') {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO post_likes (post_id, user_id, created_at)
        VALUES (?, ?, datetime('now'))
      `).bind(postId, userData.userId).run();
    } else if (action === 'unlike') {
      await env.DB.prepare(`
        DELETE FROM post_likes WHERE post_id = ? AND user_id = ?
      `).bind(postId, userData.userId).run();
    }

    // Get updated like count
    const { results } = await env.DB.prepare(`
      SELECT COUNT(*) as likes FROM post_likes WHERE post_id = ?
    `).bind(postId).all();

    return new Response(JSON.stringify({ 
      success: true,
      likes: results[0].likes
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Like post error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update like',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Initialize database tables
async function initializeTables(env) {
  if (!env.DB) return;

  try {
    // Create posts table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id TEXT NOT NULL,
        category TEXT,
        tags TEXT,
        url TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `).run();

    // Create post_likes table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS post_likes (
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (post_id, user_id)
      )
    `).run();

    // Create post_responses table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS post_responses (
        id TEXT PRIMARY KEY,
        post_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `).run();

    // Create users table if doesn't exist
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        avatar TEXT,
        provider TEXT,
        last_login TEXT
      )
    `).run();

  } catch (error) {
    console.error('Table initialization error:', error);
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cookie'
    }
  });
}
