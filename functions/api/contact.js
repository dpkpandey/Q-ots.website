// functions/api/contact.js
// Contact form API handler

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.email || !data.subject || !data.message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Store in database
    if (env.DB) {
      try {
        await env.DB.prepare(`
          INSERT INTO contacts (name, email, subject, message, created_at, status)
          VALUES (?, ?, ?, ?, datetime('now'), 'new')
        `).bind(
          data.name,
          data.email,
          data.subject,
          data.message
        ).run();
        
        console.log('✅ Contact form submitted:', data.email);
        
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Message sent successfully'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        throw dbError;
      }
    }
    
    // If no database, just return success
    console.log('⚠️  Contact form submitted (no database):', data.email);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Message received (database not available)'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('❌ Contact form error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to send message',
      details: error.message
    }), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
}
