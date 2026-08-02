import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, validateConfig, isPiiFilterEnabled } from './config.js';

describe('loadConfig', () => {
  beforeEach(() => {
    Object.keys(process.env)
      .filter(k => k.startsWith('METABASE_'))
      .forEach(k => delete process.env[k]);
  });

  it('throws when METABASE_URL is missing', () => {
    expect(() => loadConfig()).toThrow('METABASE_URL environment variable is required');
  });

  it('throws when URL is set but no auth provided', () => {
    process.env.METABASE_URL = 'http://localhost:3000';
    expect(() => loadConfig()).toThrow(
      'Either (METABASE_URL and METABASE_API_KEY) or (METABASE_URL, METABASE_USERNAME, and METABASE_PASSWORD) environment variables are required'
    );
  });

  it('throws when only username is provided without password', () => {
    process.env.METABASE_URL = 'http://localhost:3000';
    process.env.METABASE_USERNAME = 'admin';
    expect(() => loadConfig()).toThrow();
  });

  it('loads config with API key auth', () => {
    process.env.METABASE_URL = 'http://localhost:3000';
    process.env.METABASE_API_KEY = 'my-key';
    const config = loadConfig();
    expect(config.url).toBe('http://localhost:3000');
    expect(config.apiKey).toBe('my-key');
    expect(config.username).toBeUndefined();
    expect(config.password).toBeUndefined();
  });

  it('loads config with username/password auth', () => {
    process.env.METABASE_URL = 'http://localhost:3000';
    process.env.METABASE_USERNAME = 'admin';
    process.env.METABASE_PASSWORD = 'secret';
    const config = loadConfig();
    expect(config.url).toBe('http://localhost:3000');
    expect(config.username).toBe('admin');
    expect(config.password).toBe('secret');
    expect(config.apiKey).toBeUndefined();
  });

  it('returns undefined extraHeaders when no METABASE_HEADER_* vars set', () => {
    process.env.METABASE_URL = 'http://localhost:3000';
    process.env.METABASE_API_KEY = 'key';
    expect(loadConfig().extraHeaders).toBeUndefined();
  });

  it('parses a single METABASE_HEADER_* var', () => {
    process.env.METABASE_URL = 'http://localhost:3000';
    process.env.METABASE_API_KEY = 'key';
    process.env.METABASE_HEADER_AUTHORIZATION = 'Bearer token';
    expect(loadConfig().extraHeaders).toEqual({ AUTHORIZATION: 'Bearer token' });
  });

  it('converts underscores to hyphens in header name', () => {
    process.env.METABASE_URL = 'http://localhost:3000';
    process.env.METABASE_API_KEY = 'key';
    process.env.METABASE_HEADER_X_TENANT_ID = 'my-org';
    expect(loadConfig().extraHeaders).toEqual({ 'X-TENANT-ID': 'my-org' });
  });

  it('parses multiple METABASE_HEADER_* vars', () => {
    process.env.METABASE_URL = 'http://localhost:3000';
    process.env.METABASE_API_KEY = 'key';
    process.env.METABASE_HEADER_AUTHORIZATION = 'Bearer token';
    process.env.METABASE_HEADER_X_TENANT_ID = 'my-org';
    expect(loadConfig().extraHeaders).toEqual({
      AUTHORIZATION: 'Bearer token',
      'X-TENANT-ID': 'my-org',
    });
  });
});

describe('validateConfig', () => {
  it('throws when url is empty', () => {
    expect(() => validateConfig({ url: '' })).toThrow('Metabase URL is required');
  });

  it('throws when no auth credentials provided', () => {
    expect(() => validateConfig({ url: 'http://localhost:3000' })).toThrow(
      'Either API key or username/password combination is required'
    );
  });

  it('throws when URL format is invalid', () => {
    expect(() => validateConfig({ url: 'not-a-url', apiKey: 'key' })).toThrow(
      'Invalid Metabase URL format'
    );
  });

  it('passes with valid API key config', () => {
    expect(() => validateConfig({ url: 'http://localhost:3000', apiKey: 'key' })).not.toThrow();
  });

  it('passes with valid username/password config', () => {
    expect(() =>
      validateConfig({ url: 'http://localhost:3000', username: 'u', password: 'p' })
    ).not.toThrow();
  });

  it('passes with HTTPS URL', () => {
    expect(() =>
      validateConfig({ url: 'https://metabase.example.com', apiKey: 'key' })
    ).not.toThrow();
  });
});

describe('isPiiFilterEnabled', () => {
  const original = process.env.METABASE_PII_FILTER;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.METABASE_PII_FILTER;
    } else {
      process.env.METABASE_PII_FILTER = original;
    }
  });

  it('returns true when env var is not set', () => {
    delete process.env.METABASE_PII_FILTER;
    expect(isPiiFilterEnabled()).toBe(true);
  });

  it('returns true when env var is "true"', () => {
    process.env.METABASE_PII_FILTER = 'true';
    expect(isPiiFilterEnabled()).toBe(true);
  });

  it('returns false when env var is "false"', () => {
    process.env.METABASE_PII_FILTER = 'false';
    expect(isPiiFilterEnabled()).toBe(false);
  });
});
