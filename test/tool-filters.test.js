import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { parseToolFilterOptions } from '../dist/utils/tool-filters.js';

const serverPath = fileURLToPath(new URL('../dist/server.js', import.meta.url));

function parse(args) {
  const originalArgv = process.argv;
  process.argv = [process.execPath, serverPath, ...args];
  try {
    return parseToolFilterOptions();
  } finally {
    process.argv = originalArgv;
  }
}

test('supported modes retain their defaults and precedence', () => {
  for (const [args, mode] of [
    [[], 'essential'],
    [['--essential'], 'essential'],
    [['--write'], 'write'],
    [['--all'], 'all'],
    [['--essential', '--write'], 'write'],
    [['--write', '--all'], 'all'],
    [['--all', '--write', '--essential'], 'all'],
  ]) {
    assert.deepEqual(parse(args), { mode });
  }
});

for (const args of [
  ['--read'],
  ['--read', '--essential'],
  ['--read', '--write'],
  ['--all', '--read'],
]) {
  test(`removed flag is rejected: ${args.join(' ')}`, () => {
    assert.throws(() => parse(args), /--read is no longer supported/);
  });
}

test('CLI rejects --read before loading configuration or starting MCP', () => {
  const env = { ...process.env };
  for (const key of ['METABASE_URL', 'METABASE_API_KEY', 'METABASE_USERNAME', 'METABASE_PASSWORD']) {
    delete env[key];
  }
  const result = spawnSync(process.execPath, [serverPath, '--read'], {
    env,
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--read is no longer supported/);
  assert.match(result.stderr, /No read-only mode is available/);
  assert.doesNotMatch(result.stderr, /environment variable is required|Tool filtering mode/);
  assert.equal(result.stdout, '');
});

test('MCP tool lists preserve the documented supported modes', { timeout: 20000 }, async () => {
  const namesByMode = {};
  for (const args of [[], ['--essential'], ['--write'], ['--all']]) {
    const client = new Client({ name: 'tool-filter-test', version: '1.0.0' }, { capabilities: {} });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverPath, ...args],
      env: { ...process.env, METABASE_URL: 'http://127.0.0.1:1', METABASE_API_KEY: 'test-only' },
      stderr: 'ignore',
    });
    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      namesByMode[args[0] ?? 'default'] = tools.map(tool => tool.name).sort();
    } finally {
      await client.close();
    }
  }
  assert.deepEqual(namesByMode.default, namesByMode['--essential']);
  assert.ok(namesByMode['--essential'].includes('create_dashboard'));
  assert.ok(namesByMode['--write'].includes('list_dashboards'));
  assert.ok(namesByMode['--write'].includes('create_dashboard'));
  assert.ok(namesByMode['--all'].includes('get_metabase_playground_link'));
  assert.ok(!namesByMode['--write'].includes('get_metabase_playground_link'));
  assert.ok(namesByMode['--write'].every(name => namesByMode['--all'].includes(name)));
});
