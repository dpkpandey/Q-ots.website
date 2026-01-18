// ============================================
// Q-OTS GOOGLE AUTH API - Cloudflare Worker
// OAuth 2.0 with Google
// ============================================

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const env = context.env;

    // Check for required environment variables
    const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
    const SITE_URL = env.SITE_URL || 'https://q-ots-website.pages.dev';

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return new Response(JSON.stringify({ 
            error: 'Google OAuth not configured',
            setup: 'Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Cloudflare environment variables'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const REDIRECT_URI = `${SITE_URL}/api/auth/google/callback`;

    // Check if this is the callback
    if (url.pathname.endsWith('/callback')) {
        return handleCallback(url, env, REDIRECT_URI, SITE_URL);
    }

    // Initiate OAuth flow
    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    // Generate state for CSRF protection
    const state = crypto.randomUUID();

    authUrl.searchParams.set('state', state);

    return Response.redirect(authUrl.toString(), 302);
}

async function handleCallback(url, env, REDIRECT_URI, SITE_URL) {
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        return Response.redirect(`${SITE_URL}?auth_error=${error}`, 302);
    }

    if (!code) {
        return Response.redirect(`${SITE_URL}?auth_error=no_code`, 302);
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                code,
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Token exchange failed:', error);
            return Response.redirect(`${SITE_URL}?auth_error=token_exchange_failed`, 302);
        }

        const tokens = await tokenResponse.json();

        // Get user info
        const userResponse = await fetch(GOOGLE_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        });

        if (!userResponse.ok) {
            return Response.redirect(`${SITE_URL}?auth_error=userinfo_failed`, 302);
        }

        const googleUser = await userResponse.json();

        // Store user in database
        const DB = env.DB;
        if (DB) {
            try {
                await DB.exec(`
                    CREATE TABLE IF NOT EXISTS users (
                        id TEXT PRIMARY KEY,
                        provider TEXT NOT NULL,
                        provider_id TEXT NOT NULL,
                        email TEXT,
                        name TEXT,
                        avatar TEXT,
                        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                        last_login TEXT
                    );
                `);

                const existingUser = await DB.prepare(
                    'SELECT * FROM users WHERE provider = ? AND provider_id = ?'
                ).bind('google', googleUser.id).first();

                if (existingUser) {
                    // Update last login
                    await DB.prepare(
                        'UPDATE users SET last_login = ?, name = ?, avatar = ? WHERE id = ?'
                    ).bind(new Date().toISOString(), googleUser.name, googleUser.picture, existingUser.id).run();
                } else {
                    // Create new user
                    await DB.prepare(`
                        INSERT INTO users (id, provider, provider_id, email, name, avatar, created_at, last_login)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `).bind(
                        crypto.randomUUID(),
                        'google',
                        googleUser.id,
                        googleUser.email,
                        googleUser.name,
                        googleUser.picture,
                        new Date().toISOString(),
                        new Date().toISOString()
                    ).run();
                }
            } catch (e) {
                console.error('Database error:', e);
            }
        }

        // Create user object for client
        const user = {
            id: googleUser.id,
            name: googleUser.name,
            email: googleUser.email,
            avatar: googleUser.picture,
            provider: 'google'
        };

        // Redirect back with user data
        const userData = encodeURIComponent(JSON.stringify(user));
        return Response.redirect(`${SITE_URL}?auth_success=true&user=${userData}`, 302);

    } catch (error) {
        console.error('OAuth error:', error);
        return Response.redirect(`${SITE_URL}?auth_error=server_error`, 302);
    }
}
