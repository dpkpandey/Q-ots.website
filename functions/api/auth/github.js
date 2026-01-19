// functions/api/auth/github.js
// GitHub OAuth handler

export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    
    // Check if this is a callback
    const code = url.searchParams.get('code');
    
    if (!code) {
        // Redirect to GitHub OAuth
        const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
        githubAuthUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
        githubAuthUrl.searchParams.set('redirect_uri', `${env.SITE_URL}/api/auth/github`);
        githubAuthUrl.searchParams.set('scope', 'read:user user:email');
        
        return Response.redirect(githubAuthUrl.toString(), 302);
    }
    
    // Handle callback - exchange code for token
    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: env.GITHUB_CLIENT_ID,
                client_secret: env.GITHUB_CLIENT_SECRET,
                code: code,
                redirect_uri: `${env.SITE_URL}/api/auth/github`
            })
        });
        
        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('Token exchange error:', errorText);
            return new Response(`Authentication failed: ${errorText}`, { status: 400 });
        }
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.error) {
            console.error('GitHub OAuth error:', tokenData.error_description);
            return new Response(`Authentication failed: ${tokenData.error_description}`, { status: 400 });
        }
        
        // Get user info
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Q-OTS-Website'
            }
        });
        
        if (!userResponse.ok) {
            return new Response('Failed to get user info', { status: 400 });
        }
        
        const userData = await userResponse.json();
        
        // Get user email if not public
        let email = userData.email;
        if (!email) {
            const emailResponse = await fetch('https://api.github.com/user/emails', {
                headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Q-OTS-Website'
                }
            });
            
            if (emailResponse.ok) {
                const emails = await emailResponse.json();
                const primaryEmail = emails.find(e => e.primary) || emails[0];
                email = primaryEmail?.email || '';
            }
        }
        
        // Redirect back to homepage with user data
        const redirectUrl = new URL(env.SITE_URL);
        redirectUrl.searchParams.set('auth', 'success');
        redirectUrl.searchParams.set('name', userData.name || userData.login);
        redirectUrl.searchParams.set('email', email);
        redirectUrl.searchParams.set('avatar', userData.avatar_url || '');
        
        return Response.redirect(redirectUrl.toString(), 302);
        
    } catch (error) {
        console.error('OAuth error:', error);
        return new Response(`Authentication error: ${error.message}`, { status: 500 });
    }
}
