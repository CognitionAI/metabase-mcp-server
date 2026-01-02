import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { MetabaseClient } from './metabase-client.js';

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      create: vi.fn(() => ({
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        request: vi.fn(),
        defaults: {
          headers: {
            common: {},
          },
        },
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
      })),
    },
  };
});

describe('MetabaseClient', () => {
  let client: MetabaseClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a fresh mock for each test
    mockAxiosInstance = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };

    (axios.create as any).mockReturnValue(mockAxiosInstance);

    client = new MetabaseClient({
      url: 'http://localhost:3000',
      apiKey: 'test-api-key',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCard', () => {
    it('should send the card payload correctly to the API', async () => {
      const cardPayload = {
        name: 'Test Card',
        dataset_query: {
          database: 1,
          type: 'native',
          native: {
            query: 'SELECT * FROM users',
          },
        },
        display: 'table',
        visualization_settings: {},
      };

      const expectedResponse = { id: 123, ...cardPayload };
      mockAxiosInstance.post.mockResolvedValueOnce({ data: expectedResponse });

      const result = await client.createCard(cardPayload);

      // Verify the exact payload sent to axios
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/card', cardPayload);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);

      // Verify the response
      expect(result).toEqual(expectedResponse);
    });

    it('should preserve nested object structure in dataset_query', async () => {
      const complexPayload = {
        name: 'Complex Query Card',
        dataset_query: {
          database: 1,
          type: 'query',
          query: {
            'source-table': 2,
            filter: ['=', ['field', 10, null], 'active'],
            aggregation: [['count']],
            breakout: [['field', 20, null]],
          },
        },
        display: 'bar',
        visualization_settings: {
          'graph.dimensions': ['CATEGORY'],
          'graph.metrics': ['count'],
        },
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: { id: 456, ...complexPayload } });

      await client.createCard(complexPayload);

      // Verify the exact structure is preserved
      const [endpoint, sentPayload] = mockAxiosInstance.post.mock.calls[0];
      expect(endpoint).toBe('/api/card');
      expect(sentPayload).toEqual(complexPayload);

      // Deep equality check for nested objects
      expect(sentPayload.dataset_query.query['source-table']).toBe(2);
      expect(sentPayload.dataset_query.query.filter).toEqual(['=', ['field', 10, null], 'active']);
    });

    it('should handle API errors and preserve error response body', async () => {
      const errorResponseBody = {
        message: 'Invalid query: database 999 does not exist',
        errors: {
          database: 'Database not found',
        },
      };

      // Create an AxiosError with a response containing the error body
      const axiosError = new AxiosError(
        'Request failed with status code 500',
        'ERR_BAD_RESPONSE',
        undefined,
        undefined,
        {
          status: 500,
          statusText: 'Internal Server Error',
          headers: new AxiosHeaders(),
          config: { headers: new AxiosHeaders() },
          data: errorResponseBody,
        } as any
      );

      mockAxiosInstance.post.mockRejectedValueOnce(axiosError);

      // Currently, the error loses the response body - this test documents the bug
      try {
        await client.createCard({
          name: 'Bad Card',
          dataset_query: { database: 999 },
          display: 'table',
          visualization_settings: {},
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        // The error is an AxiosError and SHOULD have the response data
        expect(error).toBeInstanceOf(AxiosError);
        const axiosErr = error as AxiosError;
        expect(axiosErr.response?.data).toEqual(errorResponseBody);
        expect(axiosErr.response?.status).toBe(500);
      }
    });

    it('should not modify or add extra properties to the payload', async () => {
      const payload = {
        name: 'Simple Card',
        dataset_query: {
          database: 1,
          type: 'native',
          native: { query: 'SELECT 1' },
        },
        display: 'table',
        visualization_settings: {},
      };

      mockAxiosInstance.post.mockResolvedValueOnce({ data: { id: 1 } });

      await client.createCard(payload);

      const [, sentPayload] = mockAxiosInstance.post.mock.calls[0];

      // Verify no extra properties were added
      const payloadKeys = Object.keys(sentPayload);
      const expectedKeys = Object.keys(payload);
      expect(payloadKeys.sort()).toEqual(expectedKeys.sort());
    });
  });

  describe('error handling', () => {
    it('should expose full error details from Metabase API responses', async () => {
      const metabaseError = {
        message: 'You do not have permissions to do that.',
        type: 'permission-denied',
      };

      const axiosError = new AxiosError(
        'Request failed with status code 403',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          status: 403,
          statusText: 'Forbidden',
          headers: new AxiosHeaders(),
          config: { headers: new AxiosHeaders() },
          data: metabaseError,
        } as any
      );

      mockAxiosInstance.get.mockRejectedValueOnce(axiosError);

      try {
        await client.getCard(123);
        expect.fail('Should have thrown');
      } catch (error) {
        const axiosErr = error as AxiosError;
        // Error should contain the response data so callers can get detailed error info
        expect(axiosErr.response?.data).toEqual(metabaseError);
      }
    });
  });
});

describe('Error message extraction', () => {
  it('should extract meaningful error message from AxiosError response', () => {
    const metabaseErrorResponse = {
      message: 'Card with that name already exists',
      errors: { name: 'Must be unique' },
    };

    const axiosError = new AxiosError(
      'Request failed with status code 400',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 400,
        statusText: 'Bad Request',
        headers: new AxiosHeaders(),
        config: { headers: new AxiosHeaders() },
        data: metabaseErrorResponse,
      } as any
    );

    // This helper function should exist to extract useful error messages
    const extractedMessage = extractErrorMessage(axiosError);

    // The extracted message should include the Metabase error details
    expect(extractedMessage).toContain('Card with that name already exists');
  });
});

// Helper function that SHOULD exist to extract error messages properly
function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data;
    if (typeof data === 'object' && data !== null) {
      if ('message' in data) {
        return String(data.message);
      }
      if ('error' in data) {
        return String(data.error);
      }
      // Return stringified data if it has content
      return JSON.stringify(data);
    }
    if (typeof data === 'string') {
      return data;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}
