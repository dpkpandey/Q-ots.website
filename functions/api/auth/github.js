// ============================================
// Q-OTS GITHUB AUTH API - Cloudflare Worker
// ============================================

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_URL = 'https://api.github.com/user';

export async function onRequest(context) {
    const url = new URL(context.request.url);
    const env = context.env;
    const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID;
    const GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET;
    const SITE_URL = env.SITE_URL || 'https://q-ots-website.pages.dev';

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return new Response(JSON.stringify({ error: 'GitHub OAuth not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const REDIRECT_URI = `${SITE_URL}/api/auth/github/callback`;

    if (url.pathname.endsWith('/callback')) {
        const code = url.searchParams.get('code');
        if (!code) return Response.redirect(`${SITE_URL}?auth_error=no_code`, 302);

        try {
            const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: REDIRECT_URI
                })
            });

            const tokens = await tokenResponse.json();
            if (tokens.error) return Response.redirect(`${SITE_URL}?auth_error=${tokens.error}`, 302);

            const userResponse = await fetch(GITHUB_USER_URL, {
                headers: {
                    'Authorization': `Bearer ${tokens.access_token}`,
                    'Accept': 'application/json',
                    'User-Agent': 'Q-OTS-App'
                }
            });

            const githubUser = await userResponse.json();

            const user = {
                id: String(githubUser.id),
                name: githubUser.name || githubUser.login,
                email: githubUser.email,
                avatar: githubUser.avatar_url,
                username: githubUser.login,
                provider: 'github'
            };

            const userData = encodeURIComponent(JSON.stringify(user));
            return Response.redirect(`${SITE_URL}?auth_success=true&user=${userData}`, 302);

        } catch (error) {
            console.error('GitHub OAuth error:', error);
            return Response.redirect(`${SITE_URL}?auth_error=server_error`, 302);
        }
    }

    const authUrl = new URL(GITHUB_AUTH_URL);
    authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.set('scope', 'read:user user:email');
    authUrl.searchParams.set('state', crypto.randomUUID());

    return Response.redirect(authUrl.toString(), 302);
}
