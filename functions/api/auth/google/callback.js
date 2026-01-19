// Google OAuth Callback Handler
// Path: functions/api/auth/google/callback.js

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const env = context.env;
    
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');
    const SITE_URL = env.SITE_URL || url.origin;

    if (error) {
        return Response.redirect(`${SITE_URL}/community?auth_error=${error}`, 302);
    }

    if (!code) {
        return Response.redirect(`${SITE_URL}/community?auth_error=no_code`, 302);
    }

    try {
        const REDIRECT_URI = `${SITE_URL}/api/auth/google/callback`;

        // Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error('Token error:', tokens);
            return Response.redirect(`${SITE_URL}/community?auth_error=token_failed`, 302);
        }

        // Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': `Bearer ${tokens.access_token}` }
        });

        const googleUser = await userResponse.json();

        const user = {
            id: googleUser.id,
            name: googleUser.name,
            email: googleUser.email,
            avatar: googleUser.picture,
            provider: 'google'
        };

        const userData = encodeURIComponent(JSON.stringify(user));
        return Response.redirect(`${SITE_URL}/?auth_success=true&user=${userData}`, 302);

    } catch (err) {
        console.error('OAuth error:', err);
        return Response.redirect(`${SITE_URL}/community?auth_error=server_error`, 302);
    }
}
