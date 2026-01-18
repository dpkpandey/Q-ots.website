// ============================================
// Q-OTS GOOGLE AUTH API - Cloudflare Pages Function / Worker
// OAuth 2.0 with Google (Authorization Code flow)
// FIXES INCLUDED:
//  1) No hard-coded SITE_URL: uses request origin (works on prod + preview)
//  2) Proper state CSRF protection using HttpOnly cookie
//  3) Safer redirect: does NOT put full user JSON in query string
//     - sets a short-lived session cookie instead
//  4) Clears state cookie after callback
// ============================================

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

// Cookie helpers
function parseCookies(cookieHeader = "") {
  const out = {};
  cookieHeader.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) return;
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function setCookie(headers, name, value, opts = {}) {
  const {
    path = "/",
    maxAge,
    httpOnly = true,
    secure = true,
    sameSite = "Lax",
  } = opts;

  let c = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${sameSite}`;
  if (typeof maxAge === "number") c += `; Max-Age=${maxAge}`;
  if (httpOnly) c += `; HttpOnly`;
  if (secure) c += `; Secure`;
  headers.append("Set-Cookie", c);
}

function clearCookie(headers, name) {
  headers.append(
    "Set-Cookie",
    `${name}=; Path=/; Max-Age=0; SameSite=Lax; HttpOnly; Secure`
  );
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const env = context.env;

  // Required environment variables
  const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;

  // Session signing secret (recommended)
  // You can keep it optional, but for production you should set it.
  const SESSION_SECRET = env.SESSION_SECRET || env.AUTH_SECRET || env.NEXTAUTH_SECRET;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return new Response(
      JSON.stringify({
        error: "Google OAuth not configured",
        setup:
          "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Cloudflare environment variables",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // IMPORTANT: derive base URL from current request origin
  // Works for production and preview domains.
  const SITE_URL = url.origin;

  // IMPORTANT: this MUST match what you register in Google Console
  // for each domain you intend to use (prod and any preview you're testing).
  const REDIRECT_URI = `${SITE_URL}/api/auth/google/callback`;

  // Route detection
  const isCallback = url.pathname.endsWith("/callback");

  if (isCallback) {
    return handleCallback(context, url, env, { SITE_URL, REDIRECT_URI, SESSION_SECRET });
  }

  // Initiate OAuth flow
  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  // State for CSRF protection
  const state = crypto.randomUUID();
  authUrl.searchParams.set("state", state);

  // Redirect to Google and store state in HttpOnly cookie (10 minutes)
  const headers = new Headers();
  setCookie(headers, "g_state", state, { maxAge: 600, httpOnly: true, secure: true, sameSite: "Lax" });

  headers.set("Location", authUrl.toString());
  return new Response(null, { status: 302, headers });
}

async function handleCallback(context, url, env, { SITE_URL, REDIRECT_URI, SESSION_SECRET }) {
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const returnedState = url.searchParams.get("state");

  const cookieHeader = context.request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const storedState = cookies.g_state || null;

  // Always clear state cookie on callback
  const headers = new Headers();
  clearCookie(headers, "g_state");

  if (error) {
    headers.set("Location", `${SITE_URL}/?auth_error=${encodeURIComponent(error)}`);
    return new Response(null, { status: 302, headers });
  }

  if (!code) {
    headers.set("Location", `${SITE_URL}/?auth_error=no_code`);
    return new Response(null, { status: 302, headers });
  }

  // CSRF check
  if (!returnedState || !storedState || returnedState !== storedState) {
    headers.set("Location", `${SITE_URL}/?auth_error=bad_state`);
    return new Response(null, { status: 302, headers });
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Token exchange failed:", errText);
      headers.set("Location", `${SITE_URL}/?auth_error=token_exchange_failed`);
      return new Response(null, { status: 302, headers });
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      const errText = await userResponse.text();
      console.error("Userinfo failed:", errText);
      headers.set("Location", `${SITE_URL}/?auth_error=userinfo_failed`);
      return new Response(null, { status: 302, headers });
    }

    const googleUser = await userResponse.json();

    // Optional: Store/update user in D1 if bound
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
          CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
        `);

        const existingUser = await DB.prepare(
          "SELECT * FROM users WHERE provider = ? AND provider_id = ?"
        )
          .bind("google", googleUser.id)
          .first();

        if (existingUser) {
          await DB.prepare(
            "UPDATE users SET last_login = ?, name = ?, avatar = ? WHERE id = ?"
          )
            .bind(
              new Date().toISOString(),
              googleUser.name || null,
              googleUser.picture || null,
              existingUser.id
            )
            .run();
        } else {
          await DB.prepare(
            `INSERT INTO users (id, provider, provider_id, email, name, avatar, created_at, last_login)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
            .bind(
              crypto.randomUUID(),
              "google",
              googleUser.id,
              googleUser.email || null,
              googleUser.name || null,
              googleUser.picture || null,
              new Date().toISOString(),
              new Date().toISOString()
            )
            .run();
        }
      } catch (e) {
        console.error("Database error:", e);
      }
    }

    // Build a minimal session payload
    const session = {
      provider: "google",
      id: googleUser.id,
      email: googleUser.email || null,
      name: googleUser.name || null,
      avatar: googleUser.picture || null,
      iat: Date.now(),
    };

    // Store session safely:
    // Option A (best): sign/encrypt session; here we do a lightweight HMAC signature if SESSION_SECRET exists
    let sessionValue = JSON.stringify(session);

    if (SESSION_SECRET) {
      const sig = await hmacSHA256Base64Url(SESSION_SECRET, sessionValue);
      sessionValue = `${b64urlEncode(sessionValue)}.${sig}`;
    } else {
      // If you don't set SESSION_SECRET, we still set a cookie,
      // but it's unsigned (not recommended for production).
      sessionValue = b64urlEncode(sessionValue);
    }

    // Set session cookie (8 hours). Adjust as needed.
    setCookie(headers, "qots_session", sessionValue, {
      maxAge: 8 * 60 * 60,
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });

    // Redirect back cleanly
    headers.set("Location", `${SITE_URL}/?auth_success=true`);
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error("OAuth error:", err);
    headers.set("Location", `${SITE_URL}/?auth_error=server_error`);
    return new Response(null, { status: 302, headers });
  }
}

// ---------- Minimal signing utilities (no external libs) ----------

function b64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmacSHA256Base64Url(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const bytes = new Uint8Array(sigBuf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
