import { describe, it, expect, afterEach } from 'vitest';
import { parseToolFilterOptions } from './tool-filters.js';

describe('parseToolFilterOptions', () => {
  const originalArgv = process.argv.slice();

  afterEach(() => {
    process.argv.length = 0;
    process.argv.push(...originalArgv);
  });

  it('defaults to essential mode when no flags given', () => {
    process.argv = ['node', 'server.js'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'essential' });
  });

  it('returns essential mode with explicit --essential flag', () => {
    process.argv = ['node', 'server.js', '--essential'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'essential' });
  });

  it('returns all mode with --all flag', () => {
    process.argv = ['node', 'server.js', '--all'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'all' });
  });

  it('returns write mode with --write flag', () => {
    process.argv = ['node', 'server.js', '--write'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'write' });
  });

  it('--all takes priority over --write', () => {
    process.argv = ['node', 'server.js', '--all', '--write'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'all' });
  });

  it('--write takes priority over --essential', () => {
    process.argv = ['node', 'server.js', '--write', '--essential'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'write' });
  });

  it('ignores unrelated flags', () => {
    process.argv = ['node', 'server.js', '--verbose', '--port=3000'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'essential' });
  });
});
