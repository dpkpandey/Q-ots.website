// ============================================
// Q-OTS CONTACT API - Cloudflare Worker
// Contact Form Handler with Email + Database
// ============================================

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}

export async function onRequest(context) {
    if (context.request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    }

    if (context.request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
        const { name, email, subject, message } = await context.request.json();

        // Validation
        if (!name || !email || !subject || !message) {
            return jsonResponse({ error: 'All fields are required' }, 400);
        }

        if (!isValidEmail(email)) {
            return jsonResponse({ error: 'Invalid email address' }, 400);
        }

        const DB = context.env.DB;
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        // Initialize table
        try {
            await DB.exec(`
                CREATE TABLE IF NOT EXISTS contacts (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    message TEXT NOT NULL,
                    status TEXT DEFAULT 'new',
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (e) {
            // Table might exist
        }

        // Store in database
        await DB.prepare(`
            INSERT INTO contacts (id, name, email, subject, message, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(id, name, email, subject, message, now).run();

        // Send email notification via Mailgun, SendGrid, or similar
        // For now, we'll store in DB and could add email later
        
        // Optional: Send via Resend, SendGrid, Mailgun, etc.
        // const RESEND_API_KEY = context.env.RESEND_API_KEY;
        // if (RESEND_API_KEY) {
        //     await sendEmail(RESEND_API_KEY, name, email, subject, message);
        // }

        return jsonResponse({
            success: true,
            message: 'Thank you for your message! We will get back to you soon.',
            id
        });

    } catch (error) {
        console.error('Contact API error:', error);
        return jsonResponse({ error: 'Failed to submit message' }, 500);
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Optional email sending function
async function sendEmail(apiKey, name, email, subject, message) {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            from: 'Q-OTS Contact <contact@q-ots.dev>',
            to: 'dpkarcai@protonmail.com',
            subject: `[Q-OTS Contact] ${subject}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
            `
        })
    });
    
    return response.ok;
}
