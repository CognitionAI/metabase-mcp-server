import { describe, it, expect } from 'vitest';
import { MetabaseClient } from '../src/client/metabase-client.js';

describe('MetabaseClient constructor', () => {
  it('initializes successfully with an API key', () => {
    expect(
      () => new MetabaseClient({ url: 'http://metabase.test', apiKey: 'test-key' })
    ).not.toThrow();
  });

  it('initializes successfully with username and password', () => {
    expect(
      () =>
        new MetabaseClient({
          url: 'http://metabase.test',
          username: 'user@test.com',
          password: 'secret',
        })
    ).not.toThrow();
  });

  it('throws when neither apiKey nor username/password are provided', () => {
    expect(
      () => new MetabaseClient({ url: 'http://metabase.test' })
    ).toThrow('credentials not provided');
  });

  it('throws when only username is provided (no password)', () => {
    expect(
      () =>
        new MetabaseClient({
          url: 'http://metabase.test',
          username: 'user@test.com',
        })
    ).toThrow();
  });

  it('creates distinct instances for different configs (no shared state)', () => {
    const clientA = new MetabaseClient({ url: 'http://a.test', apiKey: 'key-a' });
    const clientB = new MetabaseClient({ url: 'http://b.test', apiKey: 'key-b' });
    expect(clientA).not.toBe(clientB);
  });
});
