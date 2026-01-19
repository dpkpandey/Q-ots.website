// GitHub OAuth Callback Handler
// Path: functions/api/auth/github/callback.js

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
        // Exchange code for token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: env.GITHUB_CLIENT_ID,
                client_secret: env.GITHUB_CLIENT_SECRET,
                code
            })
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error('GitHub token error:', tokens);
            return Response.redirect(`${SITE_URL}/community?auth_error=${tokens.error}`, 302);
        }

        // Get user info
        const userResponse = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Accept': 'application/json',
                'User-Agent': 'Q-OTS-Website'
            }
        });

        const githubUser = await userResponse.json();

        // Get email if not public
        let email = githubUser.email;
        if (!email) {
            try {
                const emailResponse = await fetch('https://api.github.com/user/emails', {
                    headers: {
                        'Authorization': `Bearer ${tokens.access_token}`,
                        'Accept': 'application/json',
                        'User-Agent': 'Q-OTS-Website'
                    }
                });
                const emails = await emailResponse.json();
                const primaryEmail = emails.find(e => e.primary);
                email = primaryEmail?.email || emails[0]?.email;
            } catch (e) {
                // Email might not be accessible
            }
        }

        const user = {
            id: String(githubUser.id),
            name: githubUser.name || githubUser.login,
            email: email,
            avatar: githubUser.avatar_url,
            username: githubUser.login,
            provider: 'github'
        };

        const userData = encodeURIComponent(JSON.stringify(user));
        return Response.redirect(`${SITE_URL}/?auth_success=true&user=${userData}`, 302);

    } catch (err) {
        console.error('GitHub OAuth error:', err);
        return Response.redirect(`${SITE_URL}/community?auth_error=server_error`, 302);
    }
}
