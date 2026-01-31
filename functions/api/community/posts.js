// functions/api/community/posts.js
// Community posts API using Cloudflare Pages Functions + D1 (SQLite) + optional KV sessions.
//
// Routes (same file):
//   GET    /api/community/posts?type=discussion&sort=recent&limit=20
//   POST   /api/community/posts
//   PUT    /api/community/posts?postId=...&action=like|unlike
//   OPTIONS /api/community/posts
//
// Env/Binds:
//   - D1 binding: DB  (REQUIRED)
//   - KV binding: SESSIONS (OPTIONAL, for authenticated posting/likes)
//   - Env var REQUIRE_AUTH = "true" to enforce session for POST/PUT (default: false)
//   - Env var ALLOWED_ORIGINS = "https://q-ots-website.pages.dev,https://yourdomain.com" (optional)

export async function onRequestOptions({ request, env }) {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

export async function onRequestGet({ request, env }) {
  // Ensure DB is bound
  if (!env.DB) {
    return json(
      { ok: false, posts: [], error: "Missing D1 binding 'DB'. Bind your D1 to Pages as variable name DB and redeploy." },
      500,
      corsHeaders(request, env)
    );
  }

  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "discussion").slice(0, 40);
  const sort = (url.searchParams.get("sort") || "recent").slice(0, 20); // recent, likes, responses
  const limit = clampInt(url.searchParams.get("limit"), 20, 1, 100);

  try {
    await ensureSchema(env);

    // NOTE: likes/responses are computed via subqueries, so ORDER BY alias works in SQLite.
    // If you ever see an SQLite error about alias ordering, replace ORDER BY likes with ORDER BY (SELECT COUNT(*)).
    let query = `
      SELECT
        p.id,
        p.type,
        p.title,
        p.content,
        p.author_id,
        p.category,
        p.tags,
        p.url,
        p.created_at,
        p.updated_at,
        u.name   AS author_name,
        u.avatar AS author_avatar,
        (SELECT COUNT(*) FROM post_likes     WHERE post_id = p.id) AS likes,
        (SELECT COUNT(*) FROM post_responses WHERE post_id = p.id) AS responses
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      WHERE p.type = ?
    `;

    if (sort === "likes") query += ` ORDER BY likes DESC, p.created_at DESC`;
    else if (sort === "responses") query += ` ORDER BY responses DESC, p.created_at DESC`;
    else query += ` ORDER BY p.created_at DESC`;

    query += ` LIMIT ?`;

    const { results } = await env.DB.prepare(query).bind(type, limit).all();

    // Keep compatibility with your current frontend:
    // - returns { posts: [...] } (object). Your chat.js must use data.posts, not data.map(...)
    return json(
      { ok: true, posts: results || [], meta: { type, sort, limit } },
      200,
      corsHeaders(request, env)
    );
  } catch (error) {
    console.error("Get posts error:", error);
    return json(
      { ok: false, posts: [], error: "Failed to load posts", details: String(error?.message || error) },
      500,
      corsHeaders(request, env)
    );
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json(
      { ok: false, error: "Missing D1 binding 'DB'. Bind D1 to Pages as DB and redeploy." },
      500,
      corsHeaders(request, env)
    );
  }

  try {
    await ensureSchema(env);

    // Auth mode:
    // - If REQUIRE_AUTH="true": must have valid session in KV (env.SESSIONS) + session cookie
    // - Else: allow anonymous posts (author_id="anon")
    const requireAuth = String(env.REQUIRE_AUTH || "").toLowerCase() === "true";
    const user = await getUserFromSession(request, env); // may be null

    if (requireAuth && !user) {
      return json({ ok: false, error: "Not authenticated" }, 401, corsHeaders(request, env));
    }

    const body = await request.json().catch(() => ({}));
    const type = String(body.type || "discussion").slice(0, 40);
    const content = String(body.content || "").trim();
    const titleRaw = body.title ? String(body.title).trim() : "";
    const title = (titleRaw || inferTitleFromContent(content) || "Untitled").slice(0, 120);

    const category = body.category != null ? String(body.category).slice(0, 80) : null;
    const tags = body.tags != null ? String(body.tags).slice(0, 200) : null;
    const projectUrl = body.url != null ? String(body.url).slice(0, 300) : null;

    if (!content) {
      return json({ ok: false, error: "content required" }, 400, corsHeaders(request, env));
    }

    const postId = crypto.randomUUID();
    const authorId = user?.userId || user?.id || "anon";

    await env.DB
      .prepare(`
        INSERT INTO posts (
          id, type, title, content, author_id,
          category, tags, url, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `)
      .bind(postId, type, title, content, authorId, category, tags, projectUrl)
      .run();

    // Return created post (with computed counts)
    const created = await env.DB
      .prepare(`
        SELECT
          p.*,
          u.name AS author_name,
          u.avatar AS author_avatar,
          (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) AS likes,
          (SELECT COUNT(*) FROM post_responses WHERE post_id = p.id) AS responses
        FROM posts p
        LEFT JOIN users u ON p.author_id = u.id
        WHERE p.id = ?
      `)
      .bind(postId)
      .first();

    return json(
      { ok: true, post: created },
      201,
      corsHeaders(request, env)
    );
  } catch (error) {
    console.error("Create post error:", error);
    return json(
      { ok: false, error: "Failed to create post", details: String(error?.message || error) },
      500,
      corsHeaders(request, env)
    );
  }
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) {
    return json(
      { ok: false, error: "Missing D1 binding 'DB'. Bind D1 to Pages as DB and redeploy." },
      500,
      corsHeaders(request, env)
    );
  }

  try {
    await ensureSchema(env);

    const url = new URL(request.url);
    const postId = url.searchParams.get("postId");
    const action = url.searchParams.get("action"); // like | unlike

    if (!postId || !action) {
      return json({ ok: false, error: "Missing postId/action" }, 400, corsHeaders(request, env));
    }

    const requireAuth = String(env.REQUIRE_AUTH || "").toLowerCase() === "true";
    const user = await getUserFromSession(request, env);

    // If strict mode, require session. Otherwise derive a stable anonymous id.
    const userId = user?.userId || user?.id || (requireAuth ? null : await anonUserId(request));

    if (!userId) {
      return json({ ok: false, error: "Not authenticated" }, 401, corsHeaders(request, env));
    }

    if (action === "like") {
      await env.DB
        .prepare(`
          INSERT OR IGNORE INTO post_likes (post_id, user_id, created_at)
          VALUES (?, ?, datetime('now'))
        `)
        .bind(postId, userId)
        .run();
    } else if (action === "unlike") {
      await env.DB
        .prepare(`DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`)
        .bind(postId, userId)
        .run();
    } else {
      return json({ ok: false, error: "Invalid action. Use like or unlike." }, 400, corsHeaders(request, env));
    }

    const row = await env.DB
      .prepare(`SELECT COUNT(*) AS likes FROM post_likes WHERE post_id = ?`)
      .bind(postId)
      .first();

    return json(
      { ok: true, postId, likes: Number(row?.likes || 0) },
      200,
      corsHeaders(request, env)
    );
  } catch (error) {
    console.error("Like/unlike error:", error);
    return json(
      { ok: false, error: "Failed to update like", details: String(error?.message || error) },
      500,
      corsHeaders(request, env)
    );
  }
}

/* ------------------------- Helpers ------------------------- */

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

function corsHeaders(request, env) {
  // Same-origin calls don't need CORS, but it won't hurt.
  // If you ever use credentials cross-origin, you MUST NOT return "*".
  const origin = request.headers.get("Origin");
  const allowed = String(env.ALLOWED_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  let allowOrigin = "*";
  if (origin && allowed.length) {
    allowOrigin = allowed.includes(origin) ? origin : "null";
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
    "Access-Control-Max-Age": "86400",
  };
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(";").forEach(part => {
    const i = part.indexOf("=");
    if (i === -1) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    out[k] = v;
  });
  return out;
}

async function getUserFromSession(request, env) {
  // Expects cookie "session=<token>" and KV binding env.SESSIONS containing JSON.
  if (!env.SESSIONS) return null;

  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const token = cookies.session;
  if (!token) return null;

  const raw = await env.SESSIONS.get(token);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clampInt(value, def, min, max) {
  const n = parseInt(String(value ?? ""), 10);
  if (Number.isNaN(n)) return def;
  return Math.max(min, Math.min(max, n));
}

function inferTitleFromContent(content) {
  if (!content) return "";
  const oneLine = content.replace(/\s+/g, " ").trim();
  return oneLine.length > 0 ? oneLine.slice(0, 60) : "";
}

async function anonUserId(request) {
  // Best-effort stable ID for anonymous likes to prevent infinite repeat likes.
  const ip =
    request.headers.get("CF-Connecting-IP") ||
    (request.headers.get("X-Forwarded-For") || "").split(",")[0].trim() ||
    "0.0.0.0";
  const ua = request.headers.get("User-Agent") || "ua";
  const input = `${ip}|${ua}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const b = new Uint8Array(digest);
  // base64url-ish short id
  let s = "";
  for (let i = 0; i < 12; i++) s += b[i].toString(16).padStart(2, "0");
  return `anon_${s}`;
}

async function ensureSchema(env) {
  // Create tables if missing + add missing columns if DB was created by older versions.
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS post_likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id)
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS post_responses (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      avatar TEXT,
      provider TEXT,
      last_login TEXT
    )
  `).run();

  // Lightweight "migration": add missing columns to posts if needed
  const cols = await env.DB.prepare(`PRAGMA table_info(posts)`).all();
  const names = new Set((cols.results || []).map(r => r.name));

  // If you had an older posts table without some columns, this prevents 500 SQL errors.
  const addCol = async (name, ddl) => {
    if (!names.has(name)) {
      await env.DB.prepare(`ALTER TABLE posts ADD COLUMN ${ddl}`).run();
    }
  };

  await addCol("type", "type TEXT NOT NULL DEFAULT 'discussion'");
  await addCol("title", "title TEXT NOT NULL DEFAULT 'Untitled'");
  await addCol("content", "content TEXT NOT NULL DEFAULT ''");
  await addCol("author_id", "author_id TEXT NOT NULL DEFAULT 'anon'");
  await addCol("category", "category TEXT");
  await addCol("tags", "tags TEXT");
  await addCol("url", "url TEXT");
  await addCol("created_at", "created_at TEXT NOT NULL DEFAULT (datetime('now'))");
  await addCol("updated_at", "updated_at TEXT NOT NULL DEFAULT (datetime('now'))");

  // Helpful indexes
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_posts_type_created ON posts(type, created_at DESC)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_likes_post ON post_likes(post_id)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_resp_post ON post_responses(post_id)`).run();
}
