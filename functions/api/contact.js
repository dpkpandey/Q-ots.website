// functions/api/contact.js
// Contact form submission handler

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
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Store in database
    if (env.DB) {
      try {
        // Create table if doesn't exist
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'new'
          )
        `).run();
        
        // Insert contact submission
        await env.DB.prepare(`
          INSERT INTO contacts (name, email, subject, message, status)
          VALUES (?, ?, ?, ?, 'new')
        `).bind(
          data.name,
          data.email,
          data.subject,
          data.message
        ).run();
        
        // Optional: Send email notification (requires email service)
        // This would need additional setup with a service like SendGrid, Mailgun, etc.
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Thank you for your message! We will get back to you soon.'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
        
      } catch (dbError) {
        console.error('Database error:', dbError);
        
        // Still return success to user but log error
        return new Response(JSON.stringify({
          success: true,
          message: 'Message received'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } else {
      // No database configured - just return success
      return new Response(JSON.stringify({
        success: true,
        message: 'Message received'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle OPTIONS request for CORS
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
