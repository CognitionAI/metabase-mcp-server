import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseToolFilterOptions } from '../src/utils/tool-filters.js';

describe('parseToolFilterOptions', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv.slice();
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('defaults to essential mode when no flags are passed', () => {
    process.argv = ['node', 'server.js'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'essential' });
  });

  it('returns essential mode for --essential flag', () => {
    process.argv = ['node', 'server.js', '--essential'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'essential' });
  });

  it('returns write mode for --write flag', () => {
    process.argv = ['node', 'server.js', '--write'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'write' });
  });

  it('returns all mode for --all flag', () => {
    process.argv = ['node', 'server.js', '--all'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'all' });
  });

  it('--all takes priority over --write', () => {
    process.argv = ['node', 'server.js', '--write', '--all'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'all' });
  });

  it('--all takes priority over --essential', () => {
    process.argv = ['node', 'server.js', '--essential', '--all'];
    expect(parseToolFilterOptions()).toEqual({ mode: 'all' });
  });
});
