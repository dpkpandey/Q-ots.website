// functions/api/contact.js
// Contact Form Handler

export async function onRequestPost(context) {
    const { request } = context;
    
    try {
        const { name, email, subject, message } = await request.json();
        
        if (!name || !email || !subject || !message) {
            return jsonResponse({ error: 'All fields are required' }, 400);
        }
        
        console.log('📧 Contact form submission from:', email);
        
        // Here you can:
        // 1. Store in D1 database
        // 2. Send email via SendGrid/Resend/etc
        // 3. Send to Discord webhook
        // For now, just log it
        
        console.log('Contact form data:', { name, email, subject });
        
        return jsonResponse({ 
            success: true,
            message: 'Thank you! We will get back to you soon.'
        });
        
    } catch (error) {
        console.error('❌ Contact form error:', error);
        return jsonResponse({ error: 'Failed to process request' }, 500);
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
