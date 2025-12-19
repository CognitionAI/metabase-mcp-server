import { z } from "zod";
import { MetabaseClient } from "../client/metabase-client.js";

export function addCardTools(server: any, metabaseClient: MetabaseClient) {

  /**
   * List all available Metabase cards
   * 
   * Retrieves all cards with optional filtering by source type (e.g., 'models') or model
   * relationships. Use this to discover available cards, find specific cards by type,
   * or get an overview of analytical content.
   * 
   * @param {string} [f] - Filter by source (e.g., 'models')
   * @param {number} [model_id] - Filter by model_id
   * @returns {Promise<string>} JSON string of cards array
   */
  server.addTool({
    name: "list_cards",
    description: "Retrieve all Metabase cards with optional filtering by source type (e.g., 'models') or model relationships - use this to discover available cards, find specific cards by type, or get an overview of all analytical content",
    metadata: { isEssential: true, isRead: true },
    parameters: z.object({
      f: z.string().optional().describe("Filter by source (e.g., 'models')"),
      model_id: z.number().optional().describe("Filter by model_id"),
    }),
    execute: async (args: { f?: string; model_id?: number } = {}) => {
      try {
        const cards = await metabaseClient.getCards(args);
        return JSON.stringify(cards, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to list cards: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Get detailed information about a specific card
   * 
   * Retrieves complete metadata and configuration for a specific Metabase card
   * including query definition, visualization settings, collection location, and permissions.
   * Use this when you need to examine or understand how a particular card is built.
   * 
   * @param {number} card_id - The ID of the card to retrieve
   * @returns {Promise<string>} JSON string of card object with full metadata
   */
  server.addTool({
    name: "get_card",
    description: "Get complete metadata and configuration for a specific Metabase card including query definition, visualization settings, collection location, and permissions - use this when you need to examine or understand how a particular card is built",
    metadata: { isEssential: true, isRead: true },
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
    }),
    execute: async (args: { card_id: number }) => {
      try {
        const card = await metabaseClient.getCard(args.card_id);
        return JSON.stringify(card, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get card ${args.card_id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Create a new Metabase card
   * 
   * Creates a new card with custom query, visualization type,
   * and settings. Use this to programmatically build new analytical cards,
   * dashboard charts, or data exploration queries.
   * 
   * @param {string} name - Card name
   * @param {string} [description] - Optional description
   * @param {object} [dataset_query] - Dataset query object
   * @param {string} [display] - Visualization type
   * @param {object} [visualization_settings] - Chart-specific settings
   * @param {number} [collection_id] - Collection to save the card in
   * @returns {Promise<string>} JSON string of created card object
   */
  server.addTool({
    name: "create_card",
    description: "Create a new Metabase card with custom query, visualization type, and settings - use this to programmatically build new analytical cards, dashboards charts, or data exploration queries",
    metadata: { isWrite: true },
    parameters: z
      .object({
        name: z.string().describe("Card name"),
        description: z.string().optional().describe("Description"),
        dataset_query: z.object({}).passthrough().optional().describe("Dataset query object"),
        display: z.string().optional().describe("Visualization type"),
        visualization_settings: z
          .object({})
          .passthrough()
          .optional()
          .describe("Visualization settings"),
        collection_id: z.number().optional().describe("Collection to save in"),
      })
      .passthrough(),
    execute: async (args: any) => {
      try {
        const card = await metabaseClient.createCard(args);
        return JSON.stringify(card, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to create card: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Update an existing Metabase card
   * 
   * Modifies an existing card's name, description, query definition, visualization type,
   * or settings. Use this to fix broken cards, change chart types, update queries,
   * or move cards between collections.
   * 
   * @param {number} card_id - The ID of the card to update
   * @param {object} updates - Object containing fields to update
   * @param {object} [query_params] - Optional query parameters for update
   * @returns {Promise<string>} JSON string of updated card object
   */
  server.addTool({
    name: "update_card",
    description: "Modify an existing Metabase card's name, description, query definition, visualization type, or settings - use this to fix broken cards, change chart types, update queries, or move cards between collections",
    metadata: { isWrite: true },
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
      updates: z.object({}).passthrough().describe("Fields to update"),
      query_params: z
        .object({})
        .passthrough()
        .optional()
        .describe("Optional query parameters for update"),
    }),
    execute: async (args: {
      card_id: number;
      updates: any;
      query_params?: any;
    }) => {
      try {
        const card = await metabaseClient.updateCard(
          args.card_id,
          args.updates,
          args.query_params
        );
        return JSON.stringify(card, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to update card ${args.card_id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Delete or archive a Metabase card
   * 
   * Removes a card either by archiving (soft delete, preserves history) or permanent deletion.
   * Use this to clean up unused cards, remove broken cards, or organize analytical content.
   * 
   * @param {number} card_id - The ID of the card to delete
   * @param {boolean} [hard_delete=false] - If true, permanently delete; otherwise archive
   * @returns {Promise<string>} JSON string confirming deletion
   */
  server.addTool({
    name: "delete_card",
    description: "Remove a Metabase card either by archiving (soft delete, preserves history) or permanent deletion - use this to clean up unused cards, remove broken cards, or organize analytical content",
    metadata: { isWrite: true },
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
      hard_delete: z
        .boolean()
        .optional()
        .default(false)
        .describe("Hard delete if true, else archive"),
    }),
    execute: async (args: { card_id: number; hard_delete?: boolean }) => {
      try {
        await metabaseClient.deleteCard(args.card_id, args.hard_delete || false);
        return JSON.stringify(
          {
            card_id: args.card_id,
            action: args.hard_delete ? "deleted" : "archived",
            status: "success",
          },
          null,
          2
        );
      } catch (error) {
        throw new Error(
          `Failed to delete card ${args.card_id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Execute a Metabase card query
   * 
   * Runs a card query and returns the actual data results. Use this to get current data
   * from existing cards, refresh analytical insights, or programmatically access
   * query results for further processing.
   * 
   * @param {number} card_id - The ID of the card to execute
   * @param {boolean} [ignore_cache] - Whether to ignore cached results
   * @param {boolean} [collection_preview] - Collection preview flag
   * @param {number} [dashboard_id] - Dashboard ID if executing from dashboard context
   * @param {object} [parameters] - Query parameters
   * @returns {Promise<string>} JSON string of query results
   */
  server.addTool({
    name: "execute_card",
    description: "Run a Metabase card query and return the actual data results - use this to get current data from existing cards, refresh analytical insights, or programmatically access query results for further processing",
    metadata: { isEssential: true },
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
      ignore_cache: z.boolean().optional().describe("Ignore cached results"),
      collection_preview: z
        .boolean()
        .optional()
        .describe("Collection preview flag"),
      dashboard_id: z
        .number()
        .optional()
        .describe("Execute within a dashboard context"),
    }),
    execute: async (args: {
      card_id: number;
      ignore_cache?: boolean;
      collection_preview?: boolean;
      dashboard_id?: number;
    }) => {
      try {
        const result = await metabaseClient.executeCard(args.card_id, {
          ignore_cache: args.ignore_cache,
          collection_preview: args.collection_preview,
          dashboard_id: args.dashboard_id,
        });
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to execute card ${args.card_id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Export Metabase card results in specific format
   * 
   * Executes a card and exports the results in a specific format (CSV, Excel, JSON, etc.).
   * Use this to download data for external analysis, create reports for stakeholders,
   * or integrate query results with other systems.
   * 
   * @param {number} card_id - The ID of the card to export
   * @param {string} export_format - Export format (csv, xlsx, json, etc.)
   * @param {object} [parameters] - Query execution parameters
   * @returns {Promise<string>} Exported data in requested format
   */
  server.addTool({
    name: "export_card_result",
    description: "Execute a Metabase card and export the results in a specific format (CSV, Excel, JSON, etc.) - use this to download data for external analysis, create reports for stakeholders, or integrate query results with other systems",
    metadata: { isEssential: true },
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
      export_format: z.string().describe("Export format (e.g., csv, xlsx, json)"),
      parameters: z.object({}).passthrough().optional().describe("Execution parameters"),
    }),
    execute: async (args: {
      card_id: number;
      export_format: string;
      parameters?: any;
    }) => {
      try {
        const result = await metabaseClient.executeCardQueryWithFormat(
          args.card_id,
          args.export_format,
          args.parameters || {}
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to export card ${args.card_id} as ${
            args.export_format
          }: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Copy an existing Metabase card
   * 
   * Creates a duplicate copy of an existing card with identical query and settings.
   * Use this to create variations of existing cards, build templates for similar analyses,
   * or backup important queries before modifications.
   * 
   * @param {number} card_id - The ID of the card to copy
   * @returns {Promise<string>} JSON string of the newly created card copy
   */
  server.addTool({
    name: "copy_card",
    description: "Create a duplicate copy of an existing Metabase card with identical query and settings - use this to create variations of existing cards, build templates for similar analyses, or backup important queries before modifications",
    metadata: { isWrite: true },
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
    }),
    execute: async (args: { card_id: number }) => {
      try {
        const result = await metabaseClient.copyCard(args.card_id);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to copy card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Find dashboards containing a specific card
   * 
   * Retrieves all dashboards that include a specific Metabase card. Use this to understand
   * where a card is being used, track dependencies before making changes, or find
   * related analytical content.
   * 
   * @param {number} card_id - The ID of the card to search for
   * @returns {Promise<string>} JSON string of dashboards array containing the card
   */
  server.addTool({
    name: "get_card_dashboards",
    description: "Find all dashboards that include a specific Metabase card - use this to understand where a card is being used, track dependencies before making changes, or find related analytical content",
    metadata: { isEssential: true, isRead: true },
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
    }),
    execute: async (args: { card_id: number }) => {
      try {
        const result = await metabaseClient.getCardDashboards(args.card_id);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get dashboards for card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * List embeddable Metabase cards
   * 
   * Retrieves all cards configured for embedding in external applications.
   * Requires admin privileges. Use this to audit embedded content, manage external
   * integrations, or review public-facing analytics.
   * 
   * @returns {Promise<string>} JSON string of embeddable cards array
   */
  server.addTool({
    name: "list_embeddable_cards",
    description: "Retrieve all Metabase cards configured for embedding in external applications (requires admin privileges) - use this to audit embedded content, manage external integrations, or review public-facing analytics",
    metadata: { isRead: true },
    execute: async () => {
      try {
        const result = await metabaseClient.getEmbeddableCards();
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to list embeddable cards: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Create public link for a card
   * 
   * Generates a publicly accessible URL for a Metabase card that can be viewed
   * without authentication. Requires admin privileges. Use this to share analytical
   * insights with external stakeholders, create public reports, or embed charts in websites.
   * 
   * @param {number} card_id - The ID of the card to make public
   * @returns {Promise<string>} JSON string containing the public URL
   */
  server.addTool({
    name: "create_card_public_link",
    description: "Generate a publicly accessible URL for a Metabase card that can be viewed without authentication (requires admin privileges) - use this to share analytical insights with external stakeholders, create public reports, or embed charts in websites",
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
    }),
    execute: async (args: { card_id: number }) => {
      try {
        const result = await metabaseClient.createCardPublicLink(args.card_id);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to create public link for card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Delete public link for a card
   * 
   * Removes public access to a Metabase card by deleting its public URL.
   * Requires admin privileges. Use this to revoke external access to sensitive data,
   * clean up unused public links, or update security permissions.
   * 
   * @param {number} card_id - The ID of the card to remove public access from
   * @returns {Promise<string>} JSON string confirming deletion
   */
  server.addTool({
    name: "delete_card_public_link",
    description: "Remove public access to a Metabase card by deleting its public URL (requires admin privileges) - use this to revoke external access to sensitive data, clean up unused public links, or update security permissions",
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
    }),
    execute: async (args: { card_id: number }) => {
      try {
        const result = await metabaseClient.deleteCardPublicLink(args.card_id);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to delete public link for card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * List public Metabase cards
   * 
   * Retrieves all cards that have public URLs enabled. Requires admin privileges.
   * Use this to audit publicly accessible content, review security settings,
   * or manage external data sharing.
   * 
   * @returns {Promise<string>} JSON string of public cards array
   */
  server.addTool({
    name: "list_public_cards",
    description: "Retrieve all Metabase cards that have public URLs enabled (requires admin privileges) - use this to audit publicly accessible content, review security settings, or manage external data sharing",
    metadata: { isRead: true },
    execute: async () => {
      try {
        const result = await metabaseClient.getPublicCards();
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to list public cards: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Move multiple cards to different location
   * 
   * Relocates multiple Metabase cards to a different collection or dashboard for better
   * organization. Use this to reorganize analytical content, group related cards,
   * or clean up workspace structure.
   * 
   * @param {number[]} card_ids - Array of card IDs to move
   * @param {number} [collection_id] - Target collection ID
   * @param {number} [dashboard_id] - Target dashboard ID
   * @returns {Promise<string>} JSON string confirming the move operation
   */
  server.addTool({
    name: "move_cards",
    description: "Relocate multiple Metabase cards to a different collection or dashboard for better organization - use this to reorganize analytical content, group related cards, or clean up workspace structure",
    metadata: { isWrite: true },
    parameters: z.object({
      card_ids: z.array(z.number()).describe("Card IDs to move"),
      collection_id: z.number().optional().describe("Target collection ID"),
      dashboard_id: z.number().optional().describe("Target dashboard ID"),
    }),
    execute: async (args: {
      card_ids: number[];
      collection_id?: number;
      dashboard_id?: number;
    }) => {
      try {
        const result = await metabaseClient.moveCards(
          args.card_ids,
          args.collection_id,
          args.dashboard_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to move cards: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Move cards to a specific collection
   * 
   * Bulk transfers multiple Metabase cards to a specific collection for organizational
   * purposes. Use this to categorize cards by team, project, or topic, or to implement
   * content governance policies.
   * 
   * @param {number[]} card_ids - Array of card IDs to move
   * @param {number} [collection_id] - Target collection ID
   * @returns {Promise<string>} JSON string confirming the move operation
   */
  server.addTool({
    name: "move_cards_to_collection",
    description: "Bulk transfer multiple Metabase cards to a specific collection for organizational purposes - use this to categorize cards by team, project, or topic, or to implement content governance policies",
    metadata: { isWrite: true },
    parameters: z.object({
      card_ids: z.array(z.number()).describe("Card IDs to move"),
      collection_id: z.number().optional().describe("Target collection ID"),
    }),
    execute: async (args: { card_ids: number[]; collection_id?: number }) => {
      try {
        const result = await metabaseClient.moveCardsToCollection(
          args.card_ids,
          args.collection_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to move cards to collection: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Execute card with pivot table formatting
   * 
   * Runs a Metabase card with pivot table formatting to cross-tabulate data with rows
   * and columns. Use this to create summary tables, analyze data relationships,
   * or generate matrix-style reports from existing cards.
   * 
   * @param {number} card_id - The ID of the card to execute with pivot formatting
   * @param {object} [parameters] - Query execution parameters
   * @returns {Promise<string>} JSON string of pivot table results
   */
  server.addTool({
    name: "execute_pivot_card_query",
    description: "Run a Metabase card with pivot table formatting to cross-tabulate data with rows and columns - use this to create summary tables, analyze data relationships, or generate matrix-style reports from existing cards",
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
      parameters: z.object({}).passthrough().optional().describe("Execution parameters"),
    }),
    execute: async (args: { card_id: number; parameters?: any }) => {
      try {
        const result = await metabaseClient.executePivotCardQuery(
          args.card_id,
          args.parameters || {}
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to execute pivot query for card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get available parameter values for a card
   * 
   * Retrieves all available values for a specific parameter in a Metabase card.
   * Use this to populate dropdown filters, validate parameter inputs, or understand
   * what data options are available for interactive cards.
   * 
   * @param {number} card_id - The ID of the card
   * @param {string} param_key - The parameter key to get values for
   * @returns {Promise<string>} JSON string of available parameter values
   */
  server.addTool({
    name: "get_card_param_values",
    description: "Retrieve all available values for a specific parameter in a Metabase card - use this to populate dropdown filters, validate parameter inputs, or understand what data options are available for interactive cards",
    metadata: { isRead: true },
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
      param_key: z.string().describe("Parameter key"),
    }),
    execute: async (args: { card_id: number; param_key: string }) => {
      try {
        const result = await metabaseClient.getCardParamValues(
          args.card_id,
          args.param_key
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get parameter values for card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Search parameter values for a card
   * 
   * Searches and filters available parameter values for a Metabase card using a text query.
   * Use this to find specific parameter options in large datasets, help users locate
   * filter values, or implement autocomplete functionality.
   * 
   * @param {number} card_id - The ID of the card
   * @param {string} param_key - The parameter key to search within
   * @param {string} query - Search query text
   * @returns {Promise<string>} JSON string of matching parameter values
   */
  server.addTool({
    name: "search_card_param_values",
    description: "Search and filter available parameter values for a Metabase card using a text query - use this to find specific parameter options in large datasets, help users locate filter values, or implement autocomplete functionality",
    metadata: { isRead: true },
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
      param_key: z.string().describe("Parameter key"),
      query: z.string().describe("Search query"),
    }),
    execute: async (args: {
      card_id: number;
      param_key: string;
      query: string;
    }) => {
      try {
        const result = await metabaseClient.searchCardParamValues(
          args.card_id,
          args.param_key,
          args.query
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to search parameter values for card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get parameter value remapping for a card
   * 
   * Retrieves how parameter values are remapped or transformed for display in a Metabase card.
   * Use this to understand data transformations, debug parameter issues, or see how
   * raw values are presented to users.
   * 
   * @param {number} card_id - The ID of the card
   * @param {string} param_key - The parameter key
   * @param {string} value - The parameter value to check remapping for
   * @returns {Promise<string>} JSON string of remapping information
   */
  server.addTool({
    name: "get_card_param_remapping",
    description: "Retrieve how parameter values are remapped or transformed for display in a Metabase card - use this to understand data transformations, debug parameter issues, or see how raw values are presented to users",
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
      param_key: z.string().describe("Parameter key"),
      value: z.string().describe("Parameter value to remap"),
    }),
    execute: async (args: {
      card_id: number;
      param_key: string;
      value: string;
    }) => {
      try {
        const result = await metabaseClient.getCardParamRemapping(
          args.card_id,
          args.param_key,
          args.value
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get parameter remapping for card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get query metadata for a card
   * 
   * Retrieves structural metadata about a Metabase card's underlying query including
   * column types, field information, and data schema. Use this to understand card structure,
   * validate data types, or build dynamic interfaces.
   * 
   * @param {number} card_id - The ID of the card
   * @returns {Promise<string>} JSON string of query metadata
   */
  server.addTool({
    name: "get_card_query_metadata",
    description: "Retrieve structural metadata about a Metabase card's underlying query including column types, field information, and data schema - use this to understand card structure, validate data types, or build dynamic interfaces",
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
    }),
    execute: async (args: { card_id: number }) => {
      try {
        const result = await metabaseClient.getCardQueryMetadata(args.card_id);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get query metadata for card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get time series data or related suggestions for a card
   * 
   * Retrieves time series data or related card suggestions for a Metabase card.
   * Use this to get chronological data trends, find similar cards, or discover
   * related analytical content for dashboard building.
   * 
   * @param {number} card_id - The ID of the card
   * @param {string|number} [last_cursor] - Pagination cursor for results
   * @param {string} [query] - Filter query for suggestions
   * @param {number[]} [exclude_ids] - Card IDs to exclude from suggestions
   * @returns {Promise<string>} JSON string of time series data or card suggestions
   */
  server.addTool({
    name: "get_card_series",
    description: "Retrieve time series data or related card suggestions for a Metabase card - use this to get chronological data trends, find similar cards, or discover related analytical content for dashboard building",
    parameters: z.object({
      card_id: z.number().describe("Card ID"),
      last_cursor: z
        .union([z.string(), z.number()])
        .optional()
        .describe("Pagination cursor"),
      query: z.string().optional().describe("Filter query"),
      exclude_ids: z
        .array(z.number())
        .optional()
        .describe("IDs to exclude"),
    }),
    execute: async (args: {
      card_id: number;
      last_cursor?: string | number;
      query?: string;
      exclude_ids?: number[];
    }) => {
      try {
        const result = await metabaseClient.getCardSeries(args.card_id, {
          last_cursor: args.last_cursor,
          query: args.query,
          exclude_ids: args.exclude_ids,
        });
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get series for card ${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });
}
