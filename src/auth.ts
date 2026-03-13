import { MetabaseClient } from "./client/metabase-client.js";

/**
 * Creates a per-request authenticate handler for HTTP Stream transport.
 * Extracts Metabase credentials from request headers and returns a
 * session-scoped MetabaseClient.
 */
export function createAuthenticateHandler() {
  return (request: any): { metabaseClient: MetabaseClient } => {
    const url = (request.headers['x-metabase-url'] as string) || process.env.METABASE_URL;
    const apiKey = request.headers['x-metabase-api-key'] as string;
    const username = request.headers['x-metabase-username'] as string;
    const password = request.headers['x-metabase-password'] as string;

    if (!url) {
      throw new Response(null, {
        status: 401,
        statusText: 'Missing Metabase URL: provide x-metabase-url header or METABASE_URL env var',
      });
    }
    if (!apiKey && (!username || !password)) {
      throw new Response(null, {
        status: 401,
        statusText: 'Missing credentials: provide x-metabase-api-key or x-metabase-username + x-metabase-password headers',
      });
    }

    const metabaseClient = new MetabaseClient({ url, apiKey, username, password });
    return { metabaseClient };
  };
}

/**
 * Creates a client resolver that returns the appropriate MetabaseClient
 * for the current request context.
 * - HTTP mode: returns the per-session client from ctx.session.metabaseClient
 * - stdio mode: returns the shared defaultClient
 */
export function createClientResolver(defaultClient: MetabaseClient | null) {
  return (ctx?: any): MetabaseClient => {
    const sessionClient = ctx?.session?.metabaseClient;
    if (sessionClient) return sessionClient;
    if (defaultClient) return defaultClient;
    throw new Error('No MetabaseClient available — provide credentials via headers');
  };
}
