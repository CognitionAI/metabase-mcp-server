import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { MetabaseClient } from './metabase-client.js';
import { McpError } from '../types/errors.js';
import type { MetabaseConfig } from '../types/metabase.js';

vi.mock('axios', () => ({
  default: { create: vi.fn() },
}));

const API_KEY_CONFIG: MetabaseConfig = {
  url: 'http://localhost:3000',
  apiKey: 'test-api-key',
};

const CREDENTIALS_CONFIG: MetabaseConfig = {
  url: 'http://localhost:3000',
  username: 'admin',
  password: 'secret',
};

describe('MetabaseClient', () => {
  let mockInstance: {
    defaults: { headers: { common: Record<string, string> } };
    interceptors: { request: { use: ReturnType<typeof vi.fn> } };
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    request: ReturnType<typeof vi.fn>;
  };
  let capturedInterceptor: ((config: any) => Promise<any>) | null;

  beforeEach(() => {
    capturedInterceptor = null;
    mockInstance = {
      defaults: { headers: { common: {} } },
      interceptors: {
        request: {
          use: vi.fn((handler: any) => {
            capturedInterceptor = handler;
          }),
        },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
    };
    vi.mocked(axios.create).mockReturnValue(mockInstance as any);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('throws when no auth credentials provided', () => {
      expect(() => new MetabaseClient({ url: 'http://localhost:3000' })).toThrow(
        'Metabase authentication credentials not provided or incomplete.'
      );
    });

    it('sets X-API-Key header when apiKey is provided', () => {
      new MetabaseClient(API_KEY_CONFIG);
      expect(mockInstance.defaults.headers.common['X-API-Key']).toBe('test-api-key');
    });

    it('does not set session header in username/password mode until first request', () => {
      new MetabaseClient(CREDENTIALS_CONFIG);
      expect(mockInstance.defaults.headers.common['X-Metabase-Session']).toBeUndefined();
    });

    it('registers a request interceptor', () => {
      new MetabaseClient(CREDENTIALS_CONFIG);
      expect(mockInstance.interceptors.request.use).toHaveBeenCalledOnce();
    });

    it('applies extra headers before auth headers', () => {
      new MetabaseClient({
        ...API_KEY_CONFIG,
        extraHeaders: { 'X-Tenant-Id': 'my-org', 'X-Custom': 'value' },
      });
      expect(mockInstance.defaults.headers.common['X-Tenant-Id']).toBe('my-org');
      expect(mockInstance.defaults.headers.common['X-Custom']).toBe('value');
      expect(mockInstance.defaults.headers.common['X-API-Key']).toBe('test-api-key');
    });

    it('does not set any extra headers when extraHeaders is undefined', () => {
      new MetabaseClient(API_KEY_CONFIG);
      const keys = Object.keys(mockInstance.defaults.headers.common);
      expect(keys).toEqual(['X-API-Key']);
    });
  });

  describe('request interceptor (username/password auth)', () => {
    it('passes /api/session requests through without triggering auth', async () => {
      new MetabaseClient(CREDENTIALS_CONFIG);
      const config = { url: '/api/session' };
      const result = await capturedInterceptor!(config);
      expect(result).toBe(config);
      expect(mockInstance.post).not.toHaveBeenCalled();
    });

    it('fetches session token on the first authenticated request', async () => {
      mockInstance.post.mockResolvedValueOnce({ data: { id: 'token-abc' } });
      new MetabaseClient(CREDENTIALS_CONFIG);

      await capturedInterceptor!({ url: '/api/dashboard' });

      expect(mockInstance.post).toHaveBeenCalledWith('/api/session', {
        username: 'admin',
        password: 'secret',
      });
      expect(mockInstance.defaults.headers.common['X-Metabase-Session']).toBe('token-abc');
    });

    it('caches the session token and does not re-authenticate on subsequent requests', async () => {
      mockInstance.post.mockResolvedValueOnce({ data: { id: 'token-abc' } });
      new MetabaseClient(CREDENTIALS_CONFIG);

      await capturedInterceptor!({ url: '/api/dashboard' });
      await capturedInterceptor!({ url: '/api/card' });
      await capturedInterceptor!({ url: '/api/database' });

      expect(mockInstance.post).toHaveBeenCalledTimes(1);
    });

    it('throws McpError when authentication fails', async () => {
      mockInstance.post.mockRejectedValueOnce(new Error('401 Unauthorized'));
      new MetabaseClient(CREDENTIALS_CONFIG);

      await expect(capturedInterceptor!({ url: '/api/dashboard' })).rejects.toThrow(McpError);
    });

    it('skips session fetch in API key mode', async () => {
      new MetabaseClient(API_KEY_CONFIG);

      await capturedInterceptor!({ url: '/api/dashboard' });

      expect(mockInstance.post).not.toHaveBeenCalled();
    });
  });

  describe('dashboard methods', () => {
    it('getDashboards: GET /api/dashboard', async () => {
      const data = [{ id: 1, name: 'Sales' }];
      mockInstance.get.mockResolvedValueOnce({ data });
      const client = new MetabaseClient(API_KEY_CONFIG);

      expect(await client.getDashboards()).toEqual(data);
      expect(mockInstance.get).toHaveBeenCalledWith('/api/dashboard');
    });

    it('getDashboard: GET /api/dashboard/:id', async () => {
      const data = { id: 5, name: 'Revenue', dashcards: [] };
      mockInstance.get.mockResolvedValueOnce({ data });
      const client = new MetabaseClient(API_KEY_CONFIG);

      expect(await client.getDashboard(5)).toEqual(data);
      expect(mockInstance.get).toHaveBeenCalledWith('/api/dashboard/5');
    });

    it('createDashboard: POST /api/dashboard with payload', async () => {
      const payload = { name: 'New Dashboard', collection_id: 1 };
      const created = { id: 10, ...payload };
      mockInstance.post.mockResolvedValueOnce({ data: created });
      const client = new MetabaseClient(API_KEY_CONFIG);

      expect(await client.createDashboard(payload)).toEqual(created);
      expect(mockInstance.post).toHaveBeenCalledWith('/api/dashboard', payload);
    });

    it('deleteDashboard: archives by default (PUT archived:true)', async () => {
      mockInstance.put.mockResolvedValueOnce({ data: {} });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.deleteDashboard(3);

      expect(mockInstance.put).toHaveBeenCalledWith('/api/dashboard/3', { archived: true });
      expect(mockInstance.delete).not.toHaveBeenCalled();
    });

    it('deleteDashboard: hard deletes when hardDelete=true', async () => {
      mockInstance.delete.mockResolvedValueOnce({ data: null });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.deleteDashboard(3, true);

      expect(mockInstance.delete).toHaveBeenCalledWith('/api/dashboard/3');
      expect(mockInstance.put).not.toHaveBeenCalled();
    });

    it('addCardToDashboard: fetches current state then PUTs merged dashcards array', async () => {
      const existingDashboard = {
        id: 1,
        name: 'D',
        tabs: [],
        dashcards: [
          { id: 10, card_id: 5, row: 0, col: 0, size_x: 6, size_y: 4, series: [], visualization_settings: {}, parameter_mappings: [] },
        ],
      };
      mockInstance.get.mockResolvedValueOnce({ data: existingDashboard });
      mockInstance.put.mockResolvedValueOnce({ data: {} });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.addCardToDashboard(1, { card_id: 20, row: 1, col: 0, size_x: 12, size_y: 8 });

      expect(mockInstance.get).toHaveBeenCalledWith('/api/dashboard/1');
      const [endpoint, body] = mockInstance.put.mock.calls[0];
      expect(endpoint).toBe('/api/dashboard/1');
      expect(body.dashcards).toHaveLength(2);
      expect(body.dashcards[1]).toMatchObject({ id: -1, card_id: 20, row: 1, col: 0 });
    });

    it('updateDashcard: merges update into matching dashcard only', async () => {
      const existing = {
        id: 1,
        dashcards: [
          { id: 10, card_id: 5, row: 0, col: 0, size_x: 6, size_y: 4 },
          { id: 11, card_id: 6, row: 1, col: 0, size_x: 6, size_y: 4 },
        ],
      };
      mockInstance.get.mockResolvedValueOnce({ data: existing });
      mockInstance.put.mockResolvedValueOnce({ data: {} });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.updateDashcard(1, 10, { size_x: 12, size_y: 8 });

      const dashcards = mockInstance.put.mock.calls[0][1].dashcards;
      expect(dashcards[0]).toMatchObject({ id: 10, size_x: 12, size_y: 8 });
      expect(dashcards[1]).toMatchObject({ id: 11, size_x: 6, size_y: 4 });
    });

    it('updateDashcard: throws when dashcard id not found', async () => {
      mockInstance.get.mockResolvedValueOnce({ data: { id: 1, dashcards: [] } });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await expect(client.updateDashcard(1, 999, {})).rejects.toThrow(
        'Dashcard with id 999 not found in dashboard 1'
      );
    });

    it('removeCardsFromDashboard: filters out specified dashcard ids', async () => {
      const existing = {
        id: 1,
        dashcards: [
          { id: 10, card_id: 5 },
          { id: 11, card_id: 6 },
          { id: 12, card_id: 7 },
        ],
      };
      mockInstance.get.mockResolvedValueOnce({ data: existing });
      mockInstance.put.mockResolvedValueOnce({ data: {} });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.removeCardsFromDashboard(1, [10, 12]);

      const dashcards = mockInstance.put.mock.calls[0][1].dashcards;
      expect(dashcards).toHaveLength(1);
      expect(dashcards[0].id).toBe(11);
    });
  });

  describe('card methods', () => {
    it('getCard: GET /api/card/:id', async () => {
      const data = { id: 7, name: 'Top Users' };
      mockInstance.get.mockResolvedValueOnce({ data });
      const client = new MetabaseClient(API_KEY_CONFIG);

      expect(await client.getCard(7)).toEqual(data);
      expect(mockInstance.get).toHaveBeenCalledWith('/api/card/7');
    });

    it('deleteCard: archives by default', async () => {
      mockInstance.put.mockResolvedValueOnce({ data: {} });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.deleteCard(7);

      expect(mockInstance.put).toHaveBeenCalledWith('/api/card/7', { archived: true });
    });

    it('deleteCard: hard deletes when hardDelete=true', async () => {
      mockInstance.delete.mockResolvedValueOnce({ data: null });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.deleteCard(7, true);

      expect(mockInstance.delete).toHaveBeenCalledWith('/api/card/7');
    });

    it('executeCard: POSTs to /api/card/:id/query with default options', async () => {
      mockInstance.post.mockResolvedValueOnce({ data: { status: 'completed', data: {} } });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.executeCard(42);

      expect(mockInstance.post).toHaveBeenCalledWith('/api/card/42/query', {
        ignore_cache: false,
      });
    });

    it('executeCard: includes optional fields when provided', async () => {
      mockInstance.post.mockResolvedValueOnce({ data: { status: 'completed', data: {} } });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.executeCard(42, { ignore_cache: true, dashboard_id: 5 });

      expect(mockInstance.post).toHaveBeenCalledWith('/api/card/42/query', {
        ignore_cache: true,
        dashboard_id: 5,
      });
    });
  });

  describe('database methods', () => {
    it('executeQuery: sends correct native query structure to /api/dataset', async () => {
      mockInstance.post.mockResolvedValueOnce({ data: { status: 'completed', row_count: 1, data: {} } });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.executeQuery(2, 'SELECT 1', []);

      expect(mockInstance.post).toHaveBeenCalledWith('/api/dataset', {
        type: 'native',
        native: { query: 'SELECT 1', template_tags: {} },
        parameters: [],
        database: 2,
      });
    });

    it('executeQuery: uses empty parameters array by default', async () => {
      mockInstance.post.mockResolvedValueOnce({ data: { status: 'completed', data: {} } });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.executeQuery(1, 'SELECT count(*) FROM orders');

      const body = mockInstance.post.mock.calls[0][1];
      expect(body.parameters).toEqual([]);
    });

    it('getDatabaseSchemas: GET /api/database/:id/schemas', async () => {
      const data = ['public', 'analytics'];
      mockInstance.get.mockResolvedValueOnce({ data });
      const client = new MetabaseClient(API_KEY_CONFIG);

      expect(await client.getDatabaseSchemas(3)).toEqual(data);
      expect(mockInstance.get).toHaveBeenCalledWith('/api/database/3/schemas');
    });

    it('syncDatabaseSchema: POST /api/database/:id/sync_schema', async () => {
      mockInstance.post.mockResolvedValueOnce({ data: { status: 'ok' } });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.syncDatabaseSchema(3);

      expect(mockInstance.post).toHaveBeenCalledWith('/api/database/3/sync_schema');
    });
  });

  describe('collection methods', () => {
    it('getCollections: GET /api/collection (non-archived by default)', async () => {
      mockInstance.get.mockResolvedValueOnce({ data: [] });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.getCollections();

      expect(mockInstance.get).toHaveBeenCalledWith('/api/collection', { params: {} });
    });

    it('getCollections: passes archived=true when requested', async () => {
      mockInstance.get.mockResolvedValueOnce({ data: [] });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.getCollections(true);

      expect(mockInstance.get).toHaveBeenCalledWith('/api/collection', { params: { archived: true } });
    });
  });

  describe('generic apiCall', () => {
    it('delegates to axiosInstance.request with correct method, url and data', async () => {
      mockInstance.request.mockResolvedValueOnce({ data: { ok: true } });
      const client = new MetabaseClient(API_KEY_CONFIG);

      const result = await client.apiCall('POST', '/api/custom', { key: 'val' });

      expect(mockInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/api/custom',
        data: { key: 'val' },
      });
      expect(result).toEqual({ ok: true });
    });

    it('supports GET without a body', async () => {
      mockInstance.request.mockResolvedValueOnce({ data: [] });
      const client = new MetabaseClient(API_KEY_CONFIG);

      await client.apiCall('GET', '/api/custom');

      expect(mockInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/api/custom',
        data: undefined,
      });
    });
  });
});
