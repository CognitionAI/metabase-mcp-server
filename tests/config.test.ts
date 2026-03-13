import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, validateConfig } from '../src/utils/config.js';

describe('loadConfig', () => {
  const ENV_KEYS = ['METABASE_URL', 'METABASE_API_KEY', 'METABASE_USERNAME', 'METABASE_PASSWORD'];
  let saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    ENV_KEYS.forEach((k) => delete process.env[k]);
  });

  afterEach(() => {
    ENV_KEYS.forEach((k) => {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });

  it('loads config with API key', () => {
    process.env.METABASE_URL = 'http://metabase.test';
    process.env.METABASE_API_KEY = 'my-api-key';
    const config = loadConfig();
    expect(config.url).toBe('http://metabase.test');
    expect(config.apiKey).toBe('my-api-key');
  });

  it('loads config with username/password', () => {
    process.env.METABASE_URL = 'http://metabase.test';
    process.env.METABASE_USERNAME = 'user@test.com';
    process.env.METABASE_PASSWORD = 'secret';
    const config = loadConfig();
    expect(config.username).toBe('user@test.com');
    expect(config.password).toBe('secret');
  });

  it('throws when METABASE_URL is missing', () => {
    process.env.METABASE_API_KEY = 'key';
    expect(() => loadConfig()).toThrow('METABASE_URL');
  });

  it('throws when neither API key nor username/password are set', () => {
    process.env.METABASE_URL = 'http://metabase.test';
    expect(() => loadConfig()).toThrow();
  });
});

describe('validateConfig', () => {
  it('passes for valid config with API key', () => {
    expect(() =>
      validateConfig({ url: 'http://metabase.test', apiKey: 'key' })
    ).not.toThrow();
  });

  it('passes for valid config with username/password', () => {
    expect(() =>
      validateConfig({
        url: 'http://metabase.test',
        username: 'user@test.com',
        password: 'secret',
      })
    ).not.toThrow();
  });

  it('throws for missing URL', () => {
    expect(() =>
      validateConfig({ url: '', apiKey: 'key' })
    ).toThrow('URL is required');
  });

  it('throws for invalid URL format', () => {
    expect(() =>
      validateConfig({ url: 'not-a-url', apiKey: 'key' })
    ).toThrow('Invalid Metabase URL');
  });

  it('throws when neither API key nor username/password are provided', () => {
    expect(() =>
      validateConfig({ url: 'http://metabase.test' })
    ).toThrow();
  });
});
