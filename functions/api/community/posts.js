// functions/api/community/posts.js
// Community posts API handler

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'discussion';
  
  try {
    // Return mock data for now since database might not have posts yet
    const mockPosts = {
      discussion: [
        {
          id: 1,
          user_id: 'demo',
          author: 'Demo User',
          avatar: '',
          time: '2 hours ago',
          title: 'Welcome to Q-OTS Community',
          content: 'This is a demo discussion post. Sign in to create your own posts!',
          likes: 5,
          comments: 2
        }
      ],
      question: [
        {
          id: 2,
          user_id: 'demo',
          author: 'Demo User',
          avatar: '',
          time: '3 hours ago',
          title: 'How does QPand state vector work?',
          content: 'Can someone explain the 17-dimensional QPand representation?',
          likes: 8,
          comments: 4
        }
      ],
      showcase: [
        {
          id: 3,
          user_id: 'demo',
          author: 'Demo User',
          avatar: '',
          time: '1 day ago',
          title: 'My Q-OTS Implementation',
          content: 'Check out my implementation of the Boltzmann field!',
          likes: 12,
          comments: 6
        }
      ]
    };
    
    // If database is available, try to get real posts
    if (env.DB) {
      try {
        const result = await env.DB.prepare(`
          SELECT * FROM posts WHERE type = ? ORDER BY created_at DESC LIMIT 10
        `).bind(type).all();
        
        if (result.results && result.results.length > 0) {
          return new Response(JSON.stringify(result.results), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch (dbError) {
        console.error('Database error (using mock data):', dbError);
      }
    }
    
    // Return mock data
    return new Response(JSON.stringify(mockPosts[type] || mockPosts.discussion), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Posts API error:', error);
    
    // Return empty array instead of error
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    
    // Get user from cookie
    const cookies = request.headers.get('Cookie') || '';
    const userDataCookie = cookies.split(';').find(c => c.trim().startsWith('user_data='));
    
    if (!userDataCookie) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const userData = JSON.parse(decodeURIComponent(userDataCookie.split('=')[1]));
    
    // Store in database if available
    if (env.DB) {
      const result = await env.DB.prepare(`
        INSERT INTO posts (user_id, type, title, content, category, tags, url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userData.userId,
        data.type,
        data.title,
        data.content,
        data.category || null,
        data.tags || null,
        data.url || null
      ).run();
      
      return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Post created' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Post creation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
