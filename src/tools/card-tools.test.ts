import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { addCardTools } from './card-tools.js';

describe('card-tools - API call correctness', () => {
  let mockServer: any;
  let mockMetabaseClient: any;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    registeredTools = new Map();
    mockServer = {
      addTool: vi.fn((tool) => {
        registeredTools.set(tool.name, tool);
      }),
    };
    mockMetabaseClient = {
      createCard: vi.fn(),
      getCard: vi.fn(),
      getCards: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
      executeCard: vi.fn(),
      copyCard: vi.fn(),
      moveCards: vi.fn(),
      moveCardsToCollection: vi.fn(),
      executeCardQueryWithFormat: vi.fn(),
      executePivotCardQuery: vi.fn(),
      getCardDashboards: vi.fn(),
      getEmbeddableCards: vi.fn(),
      createCardPublicLink: vi.fn(),
      deleteCardPublicLink: vi.fn(),
      getPublicCards: vi.fn(),
      getCardParamValues: vi.fn(),
      searchCardParamValues: vi.fn(),
      getCardParamRemapping: vi.fn(),
      getCardQueryMetadata: vi.fn(),
      getCardSeries: vi.fn(),
    };
    addCardTools(mockServer, mockMetabaseClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create_card should send correct API payload', () => {
    it('should require dataset_query.database to prevent NOT NULL constraint violations', async () => {
      const tool = registeredTools.get('create_card');

      // This was the exact bug: database_id was null causing:
      // ERROR: null value in column "database_id" of relation "report_card" violates not-null constraint
      const validPayload = {
        name: 'My Card',
        dataset_query: {
          database: 3, // Required! Must specify the database ID
          type: 'native',
          native: {
            query: 'SELECT * FROM some_table',
          },
        },
        display: 'table',
      };

      mockMetabaseClient.createCard.mockResolvedValueOnce({ id: 1 });
      await tool.execute(validPayload);

      const sentPayload = mockMetabaseClient.createCard.mock.calls[0][0];

      // Verify database ID is passed through correctly
      expect(sentPayload.dataset_query.database).toBe(3);
      expect(sentPayload.dataset_query.type).toBe('native');
    });

    it('should NOT pass through unexpected fields that could break Metabase', async () => {
      const tool = registeredTools.get('create_card');

      // LLMs might add extra fields - these should NOT be passed to Metabase
      const argsWithExtraFields = {
        name: 'Test Card',
        dataset_query: {
          database: 1,
          type: 'native',
          native: { query: 'SELECT 1' },
        },
        display: 'table',
        visualization_settings: {},
        // Extra fields that could confuse Metabase:
        _meta: { source: 'llm' },
        __typename: 'Card',
        extra_field: 'should not be sent',
      };

      mockMetabaseClient.createCard.mockResolvedValueOnce({ id: 1 });
      await tool.execute(argsWithExtraFields);

      const sentPayload = mockMetabaseClient.createCard.mock.calls[0][0];

      // These extra fields should NOT be in the payload sent to Metabase
      expect(sentPayload).not.toHaveProperty('_meta');
      expect(sentPayload).not.toHaveProperty('__typename');
      expect(sentPayload).not.toHaveProperty('extra_field');

      // Valid fields should still be present
      expect(sentPayload).toHaveProperty('name', 'Test Card');
      expect(sentPayload).toHaveProperty('dataset_query');
      expect(sentPayload).toHaveProperty('display', 'table');
    });

    it('should provide default visualization_settings if not provided', async () => {
      const tool = registeredTools.get('create_card');

      const argsWithoutVizSettings = {
        name: 'Test Card',
        dataset_query: {
          database: 1,
          type: 'native',
          native: { query: 'SELECT 1' },
        },
        display: 'table',
        // visualization_settings intentionally omitted
      };

      mockMetabaseClient.createCard.mockResolvedValueOnce({ id: 1 });
      await tool.execute(argsWithoutVizSettings);

      const sentPayload = mockMetabaseClient.createCard.mock.calls[0][0];

      // Should have a default empty object for visualization_settings
      expect(sentPayload).toHaveProperty('visualization_settings');
      expect(sentPayload.visualization_settings).toEqual({});
    });

    it('should only include valid Metabase card fields', async () => {
      const tool = registeredTools.get('create_card');

      const validPayload = {
        name: 'Test Card',
        description: 'A test card',
        dataset_query: {
          database: 1,
          type: 'native',
          native: { query: 'SELECT 1' },
        },
        display: 'table',
        visualization_settings: { 'table.pivot': true },
        collection_id: 5,
      };

      mockMetabaseClient.createCard.mockResolvedValueOnce({ id: 1 });
      await tool.execute(validPayload);

      const sentPayload = mockMetabaseClient.createCard.mock.calls[0][0];

      // All valid fields should be included
      expect(Object.keys(sentPayload).sort()).toEqual([
        'collection_id',
        'dataset_query',
        'description',
        'display',
        'name',
        'visualization_settings',
      ]);
    });
  });
});

describe('card-tools', () => {
  let mockServer: any;
  let mockMetabaseClient: any;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    registeredTools = new Map();

    mockServer = {
      addTool: vi.fn((tool) => {
        registeredTools.set(tool.name, tool);
      }),
    };

    mockMetabaseClient = {
      createCard: vi.fn(),
      getCard: vi.fn(),
      getCards: vi.fn(),
      updateCard: vi.fn(),
      deleteCard: vi.fn(),
      executeCard: vi.fn(),
      copyCard: vi.fn(),
      moveCards: vi.fn(),
      moveCardsToCollection: vi.fn(),
      executeCardQueryWithFormat: vi.fn(),
      executePivotCardQuery: vi.fn(),
      getCardDashboards: vi.fn(),
      getEmbeddableCards: vi.fn(),
      createCardPublicLink: vi.fn(),
      deleteCardPublicLink: vi.fn(),
      getPublicCards: vi.fn(),
      getCardParamValues: vi.fn(),
      searchCardParamValues: vi.fn(),
      getCardParamRemapping: vi.fn(),
      getCardQueryMetadata: vi.fn(),
      getCardSeries: vi.fn(),
    };

    addCardTools(mockServer, mockMetabaseClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create_card tool', () => {
    it('should register the create_card tool', () => {
      expect(registeredTools.has('create_card')).toBe(true);
    });

    it('should pass all arguments directly to createCard', async () => {
      const tool = registeredTools.get('create_card');
      const args = {
        name: 'Test Card',
        dataset_query: {
          database: 1,
          type: 'native',
          native: { query: 'SELECT * FROM users' },
        },
        display: 'table',
        visualization_settings: {},
        collection_id: 5,
      };

      mockMetabaseClient.createCard.mockResolvedValueOnce({ id: 123, ...args });

      await tool.execute(args);

      // This is the key test - verify EXACTLY what gets passed to createCard
      expect(mockMetabaseClient.createCard).toHaveBeenCalledWith(args);
      expect(mockMetabaseClient.createCard).toHaveBeenCalledTimes(1);
    });

    it('should NOT include any extra metadata in the payload', async () => {
      const tool = registeredTools.get('create_card');
      const args = {
        name: 'Test Card',
        dataset_query: { database: 1, type: 'native', native: { query: 'SELECT 1' } },
        display: 'table',
        visualization_settings: {},
      };

      mockMetabaseClient.createCard.mockResolvedValueOnce({ id: 1 });

      await tool.execute(args);

      const passedArgs = mockMetabaseClient.createCard.mock.calls[0][0];
      const passedKeys = Object.keys(passedArgs);

      // Should only contain the keys we passed, nothing extra
      expect(passedKeys).toEqual(expect.arrayContaining(['name', 'dataset_query', 'display', 'visualization_settings']));
      expect(passedKeys.length).toBe(4);
    });

    it('should preserve complex nested dataset_query structures', async () => {
      const tool = registeredTools.get('create_card');
      const complexQuery = {
        database: 1,
        type: 'query',
        query: {
          'source-table': 2,
          filter: ['and', ['=', ['field', 10, null], 'active'], ['>', ['field', 20, null], 100]],
          aggregation: [['count'], ['sum', ['field', 30, null]]],
          breakout: [['field', 40, { 'temporal-unit': 'month' }]],
          'order-by': [['desc', ['aggregation', 0]]],
          limit: 100,
        },
      };

      const args = {
        name: 'Complex Card',
        dataset_query: complexQuery,
        display: 'bar',
        visualization_settings: {
          'graph.dimensions': ['CREATED_AT'],
          'graph.metrics': ['count', 'sum'],
        },
      };

      mockMetabaseClient.createCard.mockResolvedValueOnce({ id: 456 });

      await tool.execute(args);

      const passedArgs = mockMetabaseClient.createCard.mock.calls[0][0];

      // Verify deep nested structure is preserved exactly
      expect(passedArgs.dataset_query).toEqual(complexQuery);
      expect(passedArgs.dataset_query.query['source-table']).toBe(2);
      expect(passedArgs.dataset_query.query.filter[0]).toBe('and');
    });

    it('should include FULL error details when API returns an error', async () => {
      const tool = registeredTools.get('create_card');

      const metabaseErrorBody = {
        message: 'Invalid query: column "nonexistent" does not exist',
        errors: {
          dataset_query: 'Query validation failed',
        },
        type: 'invalid-query',
      };

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
          data: metabaseErrorBody,
        } as any
      );

      mockMetabaseClient.createCard.mockRejectedValueOnce(axiosError);

      try {
        await tool.execute({
          name: 'Bad Card',
          dataset_query: { database: 1, type: 'native', native: { query: 'SELECT nonexistent FROM table' } },
          display: 'table',
          visualization_settings: {},
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Failed to create card');
        // MUST include the Metabase API error details for debugging
        expect(errorMessage).toContain('Invalid query');
      }
    });

    it('should handle errors with detailed response body', async () => {
      const tool = registeredTools.get('create_card');

      const detailedError = {
        message: 'You must specify a database',
        errors: { database: 'required' },
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
          data: detailedError,
        } as any
      );

      mockMetabaseClient.createCard.mockRejectedValueOnce(axiosError);

      try {
        await tool.execute({
          name: 'Card Without Database',
          display: 'table',
          visualization_settings: {},
        });
        expect.fail('Should have thrown');
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('Failed to create card');
        // MUST include the Metabase API error details
        expect(errorMessage).toContain('You must specify a database');
      }
    });
  });

});
