// functions/api/contact.js
// Contact form handler with email notifications to dpkai@protonmail.com

export async function onRequestPost({ request, env }) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ 
        error: 'All fields are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Save to database
    if (env.DB) {
      try {
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        `).run();

        await env.DB.prepare(`
          INSERT INTO contacts (id, name, email, subject, message, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(
          crypto.randomUUID(),
          name,
          email,
          subject,
          message
        ).run();
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
    }

    // Send email notification (if email service configured)
    // You can integrate with SendGrid, Resend, or any email service here
    // For now, we'll log it
    const emailContent = `
New Contact Form Submission
==========================

From: ${name} (${email})
Subject: ${subject}

Message:
${message}

Sent: ${new Date().toISOString()}
    `;

    console.log('Contact form submission:', emailContent);

    // TODO: Send email to dpkai@protonmail.com using email service
    // Example with fetch to external email API:
    /*
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@q-ots.com',
        to: 'dpkai@protonmail.com',
        subject: `Q-OTS Contact: ${subject}`,
        text: emailContent
      })
    });
    */

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Thank you! Your message has been received. We will get back to you soon.' 
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to submit form. Please try again.',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
