#!/usr/bin/env node
/**
 * OAuth 2.0 Gateway for MCP
 *
 * Implements the Authorization Code + PKCE flow so Claude.ai (and other
 * OAuth-capable MCP clients) can connect without pre-sharing credentials.
 *
 * Flow:
 *   1. Claude.ai discovers /oauth/authorize via /.well-known/oauth-authorization-server
 *   2. Claude.ai redirects user to /oauth/authorize  →  HTML form (Metabase URL + key)
 *   3. User submits  →  server stores creds under a temp code  →  redirect back to client
 *   4. Claude.ai POSTs /oauth/token with code  →  server returns signed JWT
 *   5. Claude.ai calls /mcp with  Authorization: Bearer <JWT>
 *   6. Gateway validates JWT, injects x-metabase-* headers, proxies to FastMCP
 *
 * Environment variables:
 *   GATEWAY_URL     Public base URL of this gateway  (e.g. https://mcp.example.com)
 *   GATEWAY_PORT    Port to listen on                (default: 8080)
 *   MCP_UPSTREAM    FastMCP HTTP Stream URL           (default: http://localhost:8011)
 *   JWT_SECRET      Secret for signing tokens        (auto-generated if absent — don't use auto in prod)
 *   TOKEN_EXPIRY    JWT expiry                       (default: 8h)
 */

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { URL } from 'url';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase();

function log(level: 'info' | 'warn' | 'error' | 'debug', msg: string) {
  if (level === 'debug' && LOG_LEVEL !== 'debug') return;
  const ts = new Date().toISOString();
  console.error(`${ts} [${level.toUpperCase()}] ${msg}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Config ───────────────────────────────────────────────────────────────────

const GATEWAY_URL  = (process.env.GATEWAY_URL  || 'http://localhost:8080').replace(/\/$/, '');
const GATEWAY_PORT = parseInt(process.env.GATEWAY_PORT || '8080');
const MCP_UPSTREAM = (process.env.MCP_UPSTREAM  || 'http://localhost:8011').replace(/\/$/, '');
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY   || '8h';

if (!process.env.JWT_SECRET) {
  log('warn', 'JWT_SECRET is not set — using a random secret that will change on restart. Set JWT_SECRET in production.');
}
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// ── Pending authorization codes (in-memory, 10-min TTL) ─────────────────────

interface PendingCode {
  metabase_url: string;
  metabase_api_key?: string;
  metabase_username?: string;
  metabase_password?: string;
  code_challenge?: string;   // PKCE
  redirect_uri: string;
  expires: number;
}

const pendingCodes = new Map<string, PendingCode>();

setInterval(() => {
  const now = Date.now();
  for (const [code, data] of pendingCodes) {
    if (data.expires < now) pendingCodes.delete(code);
  }
}, 5 * 60 * 1000);

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function verifyPkce(verifier: string, challenge: string): boolean {
  const computed = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return computed === challenge;
}

// ── Dynamic client registration (RFC 7591) ───────────────────────────────────
// Clients (e.g. Claude.ai) register automatically before starting the OAuth flow.
// We accept any registration and return a client_id; we don't validate client
// credentials because security comes from the Metabase credentials in the form.

const registeredClients = new Map<string, { redirect_uris: string[] }>();

app.post('/oauth/register', (req: Request, res: Response) => {
  const { redirect_uris, client_name } = req.body;
  if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    res.status(400).json({ error: 'invalid_client_metadata', error_description: 'redirect_uris required' });
    return;
  }
  const client_id = crypto.randomBytes(16).toString('hex');
  registeredClients.set(client_id, { redirect_uris });
  log('debug', `Client registered: ${client_name || 'unnamed'} (${client_id})`);
  res.status(201).json({
    client_id,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris,
    grant_types: ['authorization_code'],
    response_types: ['code'],
    token_endpoint_auth_method: 'none',
  });
});

// ── OAuth Discovery ──────────────────────────────────────────────────────────

app.get('/.well-known/oauth-authorization-server', (_req: Request, res: Response) => {
  res.json({
    issuer: GATEWAY_URL,
    authorization_endpoint: `${GATEWAY_URL}/oauth/authorize`,
    token_endpoint: `${GATEWAY_URL}/oauth/token`,
    registration_endpoint: `${GATEWAY_URL}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
  });
});

// Required by some clients that probe for OpenID Connect
app.get('/.well-known/openid-configuration', (_req: Request, res: Response) => {
  res.json({
    issuer: GATEWAY_URL,
    authorization_endpoint: `${GATEWAY_URL}/oauth/authorize`,
    token_endpoint: `${GATEWAY_URL}/oauth/token`,
    registration_endpoint: `${GATEWAY_URL}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
  });
});

// ── Authorization endpoint ───────────────────────────────────────────────────

app.get('/oauth/authorize', (req: Request, res: Response) => {
  const { redirect_uri, state, code_challenge, code_challenge_method } = req.query as Record<string, string>;

  if (!redirect_uri) {
    res.status(400).send('Missing redirect_uri');
    return;
  }

  const safeRedirect = escapeHtml(redirect_uri);
  const safeState    = escapeHtml(state || '');
  const safeChallenge = escapeHtml(code_challenge || '');
  const safeMethod   = escapeHtml(code_challenge_method || '');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Conectar Metabase · MCP</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 1rem;
    }
    .card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,.10);
      padding: 2rem;
      width: 100%;
      max-width: 420px;
    }
    h1 { font-size: 1.25rem; margin-bottom: .25rem; }
    p.subtitle { color: #666; font-size: .875rem; margin-bottom: 1.5rem; }
    label { display: block; font-size: .875rem; font-weight: 500; margin-bottom: .25rem; margin-top: 1rem; }
    input[type=text], input[type=password], input[type=url] {
      width: 100%; padding: .6rem .75rem;
      border: 1px solid #d1d5db; border-radius: 8px;
      font-size: .875rem; outline: none;
    }
    input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.15); }
    .divider { display: flex; align-items: center; gap: .5rem; margin: 1.25rem 0 .5rem; color: #9ca3af; font-size: .75rem; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
    button {
      margin-top: 1.5rem; width: 100%;
      background: #6366f1; color: #fff;
      border: none; border-radius: 8px;
      padding: .75rem; font-size: 1rem; font-weight: 500;
      cursor: pointer; transition: background .15s;
    }
    button:hover { background: #4f46e5; }
    .error { color: #dc2626; font-size: .8rem; margin-top: .5rem; display: none; }
    .error.visible { display: block; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Conectar Metabase</h1>
    <p class="subtitle">Ingresa las credenciales de tu instancia de Metabase para continuar.</p>

    <form method="POST" action="/oauth/authorize" id="form">
      <input type="hidden" name="redirect_uri"          value="${safeRedirect}">
      <input type="hidden" name="state"                 value="${safeState}">
      <input type="hidden" name="code_challenge"        value="${safeChallenge}">
      <input type="hidden" name="code_challenge_method" value="${safeMethod}">

      <label for="metabase_url">URL de Metabase</label>
      <input type="url" id="metabase_url" name="metabase_url"
             placeholder="https://analytics.example.com" required>

      <label for="metabase_api_key">API Key</label>
      <input type="password" id="metabase_api_key" name="metabase_api_key"
             placeholder="mb_xxxxxxxx">

      <div class="divider">o usa usuario y contraseña</div>

      <label for="metabase_username">Usuario</label>
      <input type="text" id="metabase_username" name="metabase_username"
             placeholder="admin@example.com">

      <label for="metabase_password">Contraseña</label>
      <input type="password" id="metabase_password" name="metabase_password">

      <p class="error" id="err">Debes ingresar una API Key o usuario + contraseña.</p>

      <button type="submit">Conectar</button>
    </form>
  </div>
  <script>
    document.getElementById('form').addEventListener('submit', function(e) {
      var key = document.getElementById('metabase_api_key').value.trim();
      var user = document.getElementById('metabase_username').value.trim();
      var pass = document.getElementById('metabase_password').value.trim();
      if (!key && !(user && pass)) {
        e.preventDefault();
        document.getElementById('err').classList.add('visible');
      }
    });
  </script>
</body>
</html>`);
});

app.post('/oauth/authorize', (req: Request, res: Response) => {
  const {
    redirect_uri,
    state,
    code_challenge,
    code_challenge_method,
    metabase_url,
    metabase_api_key,
    metabase_username,
    metabase_password,
  } = req.body as Record<string, string>;

  if (!redirect_uri) {
    res.status(400).send('Missing redirect_uri');
    return;
  }
  if (!metabase_url) {
    res.status(400).send('Metabase URL is required');
    return;
  }
  if (!metabase_api_key && !(metabase_username && metabase_password)) {
    res.status(400).send('API key or username + password required');
    return;
  }

  const code = crypto.randomBytes(32).toString('hex');
  pendingCodes.set(code, {
    metabase_url,
    metabase_api_key:   metabase_api_key   || undefined,
    metabase_username:  metabase_username  || undefined,
    metabase_password:  metabase_password  || undefined,
    code_challenge:     code_challenge_method === 'S256' ? code_challenge : undefined,
    redirect_uri,
    expires: Date.now() + 10 * 60 * 1000,
  });

  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set('code', code);
  if (state) redirectUrl.searchParams.set('state', state);
  res.redirect(redirectUrl.toString());
});

// ── Token endpoint ───────────────────────────────────────────────────────────

app.post('/oauth/token', (req: Request, res: Response) => {
  const { grant_type, code, code_verifier } = req.body as Record<string, string>;

  if (grant_type !== 'authorization_code') {
    res.status(400).json({ error: 'unsupported_grant_type' });
    return;
  }
  if (!code) {
    res.status(400).json({ error: 'invalid_request', error_description: 'Missing code' });
    return;
  }

  const pending = pendingCodes.get(code);
  if (!pending || pending.expires < Date.now()) {
    pendingCodes.delete(code);
    res.status(400).json({ error: 'invalid_grant', error_description: 'Code expired or not found' });
    return;
  }

  // PKCE verification (required when code_challenge was provided)
  if (pending.code_challenge) {
    if (!code_verifier) {
      res.status(400).json({ error: 'invalid_grant', error_description: 'Missing code_verifier' });
      return;
    }
    if (!verifyPkce(code_verifier, pending.code_challenge)) {
      pendingCodes.delete(code);
      res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
      return;
    }
  }

  pendingCodes.delete(code);

  const payload: Record<string, string> = { metabase_url: pending.metabase_url };
  if (pending.metabase_api_key)  payload.metabase_api_key  = pending.metabase_api_key;
  if (pending.metabase_username) payload.metabase_username = pending.metabase_username;
  if (pending.metabase_password) payload.metabase_password = pending.metabase_password;

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY } as jwt.SignOptions);

  res.json({
    access_token: token,
    token_type: 'bearer',
    expires_in: 8 * 60 * 60,
  });
});

// ── MCP proxy ────────────────────────────────────────────────────────────────
// Validate Bearer JWT and inject x-metabase-* headers before proxying to FastMCP.

// ── MCP proxy ────────────────────────────────────────────────────────────────
// Manual HTTP proxy so we have full control over streaming and path handling.

app.use('/mcp', (req: Request, res: Response) => {
  const start = Date.now();
  const session = (req.headers['mcp-session-id'] as string || '').slice(0, 8) || '-';
  const method = (req.body as any)?.method || '-';
  res.on('finish', () => {
    log('info', `${req.method} /mcp session=${session} method=${method} status=${res.statusCode} ms=${Date.now() - start}`);
  });
  const auth = req.headers['authorization'] as string | undefined;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Bearer token required' });
    return;
  }

  let payload: Record<string, string>;
  try {
    payload = jwt.verify(auth.slice(7), JWT_SECRET) as Record<string, string>;
  } catch {
    res.status(401).json({ error: 'invalid_token', error_description: 'Token invalid or expired' });
    return;
  }

  const upstream = new URL(MCP_UPSTREAM);
  const upstreamPath = '/mcp' + (req.url === '/' ? '' : req.url);

  const proxyHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (k === 'authorization') continue;
    if (typeof v === 'string') proxyHeaders[k] = v;
    else if (Array.isArray(v)) proxyHeaders[k] = v[0];
  }
  proxyHeaders['x-metabase-url'] = payload.metabase_url;
  if (payload.metabase_api_key)  proxyHeaders['x-metabase-api-key']  = payload.metabase_api_key;
  if (payload.metabase_username) proxyHeaders['x-metabase-username'] = payload.metabase_username;
  if (payload.metabase_password) proxyHeaders['x-metabase-password'] = payload.metabase_password;
  proxyHeaders['host'] = upstream.host;

  const isGet = req.method === 'GET';

  // express.json() already consumed req body — send it as string if present.
  const bodyStr = !isGet && req.body && Object.keys(req.body).length > 0
    ? JSON.stringify(req.body)
    : undefined;

  if (bodyStr) {
    proxyHeaders['content-length'] = Buffer.byteLength(bodyStr).toString();
  } else {
    // Remove any stale content-length/transfer-encoding for GET or bodyless requests
    delete proxyHeaders['content-length'];
    delete proxyHeaders['transfer-encoding'];
  }

  // Disable socket timeout for SSE (long-lived streams)
  if (res.socket) res.socket.setTimeout(0);

  const proxyReq = http.request({
    hostname: upstream.hostname,
    port:     upstream.port || 80,
    method:   req.method,
    path:     upstreamPath,
    headers:  proxyHeaders,
  }, (proxyRes) => {
    // For SSE, disable socket timeout on the upstream side too
    if (proxyRes.socket) proxyRes.socket.setTimeout(0);

    // Filter hop-by-hop headers that must not be forwarded to avoid double-encoding
    const hopByHop = new Set(['transfer-encoding', 'connection', 'keep-alive', 'proxy-connection', 'upgrade', 'te', 'trailer']);
    const responseHeaders: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(proxyRes.headers)) {
      if (!hopByHop.has(k.toLowerCase()) && v !== undefined) {
        responseHeaders[k] = v as string | string[];
      }
    }

    res.writeHead(proxyRes.statusCode || 200, responseHeaders);
    // Flush headers immediately (critical for SSE)
    res.flushHeaders();
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.setTimeout(0); // no timeout for SSE

  proxyReq.on('error', (err) => {
    log('error', `Proxy error: ${err.message}`);
    if (!res.headersSent) res.status(502).json({ error: 'upstream_error' });
  });

  if (bodyStr) {
    proxyReq.end(bodyStr);
  } else {
    proxyReq.end();
  }
});

// ── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', upstream: MCP_UPSTREAM });
});

export { app };

// ── Start ────────────────────────────────────────────────────────────────────

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  app.listen(GATEWAY_PORT, () => {
    log('INFO', `OAuth MCP gateway on port ${GATEWAY_PORT}`);
    log('INFO', `Proxying /mcp  →  ${MCP_UPSTREAM}/mcp`);
    log('INFO', `Public URL: ${GATEWAY_URL}`);
  });
}
