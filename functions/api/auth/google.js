// functions/api/auth/google.js
// Google OAuth handler

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    
    // Check if this is a callback
    const code = url.searchParams.get('code');
    
    if (!code) {
        // Redirect to Google OAuth
        const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        googleAuthUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
        googleAuthUrl.searchParams.set('redirect_uri', `${env.SITE_URL}/api/auth/google`);
        googleAuthUrl.searchParams.set('response_type', 'code');
        googleAuthUrl.searchParams.set('scope', 'email profile');
        googleAuthUrl.searchParams.set('access_type', 'offline');
        googleAuthUrl.searchParams.set('prompt', 'consent');
        
        return Response.redirect(googleAuthUrl.toString(), 302);
    }
    
    // Handle callback - exchange code for token
    try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: env.GOOGLE_CLIENT_ID,
                client_secret: env.GOOGLE_CLIENT_SECRET,
                redirect_uri: `${env.SITE_URL}/api/auth/google`,
                grant_type: 'authorization_code'
            })
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange error:', errorText);
            return new Response(`Authentication failed: ${errorText}`, { status: 400 });
        }
        
        const tokenData = await tokenResponse.json();
        
        // Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });
        
        if (!userResponse.ok) {
            return new Response('Failed to get user info', { status: 400 });
        }
        
        const userData = await userResponse.json();
        
        // Redirect back to homepage with user data
        const redirectUrl = new URL(env.SITE_URL);
        redirectUrl.searchParams.set('auth', 'success');
        redirectUrl.searchParams.set('name', userData.name || '');
        redirectUrl.searchParams.set('email', userData.email || '');
        redirectUrl.searchParams.set('avatar', userData.picture || '');
        
        return Response.redirect(redirectUrl.toString(), 302);
        
    } catch (error) {
        console.error('OAuth error:', error);
        return new Response(`Authentication error: ${error.message}`, { status: 500 });
    }
}
