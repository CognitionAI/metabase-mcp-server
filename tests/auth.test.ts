import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAuthenticateHandler, createClientResolver } from '../src/auth.js';
import { MetabaseClient } from '../src/client/metabase-client.js';

// ── createClientResolver ────────────────────────────────────────────────────

describe('createClientResolver', () => {
  it('returns the session client when ctx.session.metabaseClient exists', () => {
    const sessionClient = { id: 'session' } as unknown as MetabaseClient;
    const getClient = createClientResolver(null);
    const result = getClient({ session: { metabaseClient: sessionClient } });
    expect(result).toBe(sessionClient);
  });

  it('returns the defaultClient when no session client is present', () => {
    const defaultClient = new MetabaseClient({
      url: 'http://metabase.test',
      apiKey: 'key-default',
    });
    const getClient = createClientResolver(defaultClient);
    expect(getClient({})).toBe(defaultClient);
    expect(getClient(undefined)).toBe(defaultClient);
  });

  it('prefers the session client over the defaultClient', () => {
    const sessionClient = { id: 'session' } as unknown as MetabaseClient;
    const defaultClient = new MetabaseClient({
      url: 'http://metabase.test',
      apiKey: 'key-default',
    });
    const getClient = createClientResolver(defaultClient);
    expect(getClient({ session: { metabaseClient: sessionClient } })).toBe(sessionClient);
  });

  it('throws when both defaultClient is null and no session client', () => {
    const getClient = createClientResolver(null);
    expect(() => getClient()).toThrow('No MetabaseClient available');
    expect(() => getClient({})).toThrow('No MetabaseClient available');
  });
});

// ── createAuthenticateHandler ───────────────────────────────────────────────

describe('createAuthenticateHandler', () => {
  const authenticate = createAuthenticateHandler();

  afterEach(() => {
    delete process.env.METABASE_URL;
  });

  it('returns a MetabaseClient when x-metabase-url + x-metabase-api-key are provided', () => {
    const result = authenticate({
      headers: {
        'x-metabase-url': 'http://metabase.test',
        'x-metabase-api-key': 'test-api-key',
      },
    });
    expect(result.metabaseClient).toBeInstanceOf(MetabaseClient);
  });

  it('returns a MetabaseClient when x-metabase-url + username/password are provided', () => {
    const result = authenticate({
      headers: {
        'x-metabase-url': 'http://metabase.test',
        'x-metabase-username': 'admin@test.com',
        'x-metabase-password': 'secret',
      },
    });
    expect(result.metabaseClient).toBeInstanceOf(MetabaseClient);
  });

  it('falls back to METABASE_URL env var when x-metabase-url header is absent', () => {
    process.env.METABASE_URL = 'http://env-metabase.test';
    const result = authenticate({
      headers: { 'x-metabase-api-key': 'test-api-key' },
    });
    expect(result.metabaseClient).toBeInstanceOf(MetabaseClient);
  });

  it('throws a 401 Response when URL is missing and METABASE_URL is not set', () => {
    expect(() =>
      authenticate({ headers: { 'x-metabase-api-key': 'key' } })
    ).toThrow(Response);

    try {
      authenticate({ headers: { 'x-metabase-api-key': 'key' } });
    } catch (e) {
      expect((e as Response).status).toBe(401);
      expect((e as Response).statusText).toMatch(/Missing Metabase URL/);
    }
  });

  it('throws a 401 Response when credentials are missing', () => {
    try {
      authenticate({ headers: { 'x-metabase-url': 'http://metabase.test' } });
    } catch (e) {
      expect((e as Response).status).toBe(401);
      expect((e as Response).statusText).toMatch(/Missing credentials/);
    }
  });

  it('throws a 401 Response when only username is provided (no password)', () => {
    try {
      authenticate({
        headers: {
          'x-metabase-url': 'http://metabase.test',
          'x-metabase-username': 'admin@test.com',
        },
      });
    } catch (e) {
      expect((e as Response).status).toBe(401);
    }
  });

  it('each call creates an independent MetabaseClient (session isolation)', () => {
    const r1 = authenticate({
      headers: {
        'x-metabase-url': 'http://metabase-a.test',
        'x-metabase-api-key': 'key-a',
      },
    });
    const r2 = authenticate({
      headers: {
        'x-metabase-url': 'http://metabase-b.test',
        'x-metabase-api-key': 'key-b',
      },
    });
    expect(r1.metabaseClient).not.toBe(r2.metabaseClient);
  });
});
