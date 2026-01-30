// functions/api/community/posts.js
// Community posts API handler

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'discussion';
  
  try {
    // Mock data for demo
    const mockPosts = {
      discussion: [
        {
          id: 1,
          author: 'Research Team',
          avatar: '',
          time: '2 hours ago',
          title: 'Welcome to Q-OTS Community',
          content: 'This is a demo discussion post. Sign in to create your own posts and join the conversation!',
          likes: 5,
          comments: 2
        }
      ],
      question: [
        {
          id: 2,
          author: 'Curious Researcher',
          avatar: '',
          time: '3 hours ago',
          title: 'How does the QPand state vector work?',
          content: 'Can someone explain the 17-dimensional QPand representation in more detail?',
          likes: 8,
          comments: 4
        }
      ],
      showcase: [
        {
          id: 3,
          author: 'Developer',
          avatar: '',
          time: '1 day ago',
          title: 'My Q-OTS Implementation',
          content: 'Check out my implementation of the Boltzmann field tracking!',
          likes: 12,
          comments: 6
        }
      ]
    };
    
    // Try to get real posts from database
    if (env.DB) {
      try {
        const result = await env.DB.prepare(`
          SELECT 
            p.*,
            u.name as author,
            u.avatar,
            (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments
          FROM posts p
          LEFT JOIN users u ON p.user_id = u.id
          WHERE p.type = ?
          ORDER BY p.created_at DESC
          LIMIT 20
        `).bind(type).all();
        
        if (result.results && result.results.length > 0) {
          // Format time
          const posts = result.results.map(post => ({
            ...post,
            time: formatTime(post.created_at)
          }));
          
          return new Response(JSON.stringify(posts), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }
    
    // Return mock data
    return new Response(JSON.stringify(mockPosts[type] || []), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('Posts API error:', error);
    
    // Return empty array on error
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
    
    // Store in database
    if (env.DB) {
      try {
        const result = await env.DB.prepare(`
          INSERT INTO posts (user_id, type, title, content, category, tags, url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          userData.userId,
          data.type,
          data.title,
          data.content,
          data.category || null,
          data.tags || null,
          data.url || null
        ).run();
        
        return new Response(JSON.stringify({ 
          success: true, 
          id: result.meta.last_row_id 
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Post created (database not available)' 
    }), {
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

// Helper function to format time
function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now - then) / 1000); // seconds
  
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
  return `${Math.floor(diff / 604800)} weeks ago`;
}
