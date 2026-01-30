import { z } from "zod";
import { MetabaseClient } from "../client/metabase-client.js";

export function addDashboardTools(server: any, metabaseClient: MetabaseClient) {
  /**
   * List all available dashboards
   *
   * Retrieves all dashboards with their basic metadata. Use this to discover
   * available dashboards, get an overview of analytical content, or find specific
   * dashboards by browsing the complete list.
   *
   * @returns {Promise<string>} JSON string of dashboards array
   */
  server.addTool({
    name: "list_dashboards",
    description:
      "Retrieve all Metabase dashboards - use this to discover available dashboards, get an overview of analytical content, or find specific dashboards",
    metadata: { isEssential: true, isRead: true },
    execute: async () => {
      try {
        const dashboards = await metabaseClient.getDashboards();
        return JSON.stringify(dashboards, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to fetch dashboards: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get detailed information about a specific dashboard
   *
   * Retrieves complete dashboard metadata including cards, layout, parameters,
   * and settings. Use this to examine dashboard structure, understand card
   * arrangements, or get configuration details.
   *
   * @param {number} dashboard_id - The ID of the dashboard to retrieve
   * @returns {Promise<string>} JSON string of dashboard object with full metadata
   */
  server.addTool({
    name: "get_dashboard",
    description:
      "Retrieve detailed information about a specific Metabase dashboard including cards, layout, and settings - use this to examine dashboard structure or get configuration details",
    metadata: { isEssential: true, isRead: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard to retrieve"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        const dashboard = await metabaseClient.getDashboard(args.dashboard_id);
        return JSON.stringify(dashboard, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to fetch dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get all cards within a specific dashboard
   *
   * Retrieves all cards contained in a dashboard with their positioning
   * and configuration. Use this to analyze dashboard content, understand card
   * relationships, or extract specific visualizations.
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @returns {Promise<string>} JSON string of cards array from the dashboard
   */
  server.addTool({
    name: "get_dashboard_cards",
    description:
      "Retrieve all cards within a specific Metabase dashboard - use this to analyze dashboard content, understand data sources, or examine card configurations",
    metadata: { isEssential: true, isRead: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        const dashboard = await metabaseClient.getDashboard(args.dashboard_id);
        const cards = dashboard.dashcards || [];
        return JSON.stringify(cards, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to fetch cards for dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get related entities for a dashboard
   *
   * Retrieves entities related to a dashboard such as similar dashboards,
   * related cards, or connected data sources. Use this to discover related
   * content, find similar analytical views, or understand dashboard relationships.
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @returns {Promise<string>} JSON string of related entities
   */
  server.addTool({
    name: "get_dashboard_related",
    description:
      "Retrieve entities related to a Metabase dashboard - use this to discover related content, find similar analytical views, or understand dashboard relationships",
    metadata: { isRead: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        const result = await metabaseClient.getDashboardRelatedEntities(
          args.dashboard_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to fetch related entities for dashboard ${
            args.dashboard_id
          }: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Get revision history for a dashboard
   *
   * Retrieves the complete revision history showing all changes made to a dashboard
   * over time. Use this to track dashboard evolution, review past changes,
   * or restore previous versions.
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @returns {Promise<string>} JSON string of dashboard revisions
   */
  server.addTool({
    name: "get_dashboard_revisions",
    description:
      "Retrieve revision history for a Metabase dashboard - use this to track dashboard evolution, review past changes, or restore previous versions",
    metadata: { isRead: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        const result = await metabaseClient.getDashboardRevisions(
          args.dashboard_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to fetch revisions for dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * List embeddable dashboards
   *
   * Retrieves all dashboards configured for embedding in external applications.
   * Requires superuser privileges. Use this to audit embedded content, manage
   * external integrations, or review public-facing analytics.
   *
   * @returns {Promise<string>} JSON string of embeddable dashboards array
   */
  server.addTool({
    name: "list_embeddable_dashboards",
    metadata: { isRead: true },
    description:
      "Retrieve all Metabase dashboards configured for embedding (requires superuser) - use this to audit embedded content or manage external integrations",
    execute: async () => {
      try {
        const dashboards = await metabaseClient.getEmbeddableDashboards();
        return JSON.stringify(dashboards, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to fetch embeddable dashboards: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * List public dashboards
   *
   * Retrieves all dashboards that have public URLs enabled. Requires superuser
   * privileges. Use this to audit publicly accessible content, review security
   * settings, or manage external data sharing.
   *
   * @returns {Promise<string>} JSON string of public dashboards array
   */
  server.addTool({
    name: "list_public_dashboards",
    metadata: { isRead: true },
    description:
      "Retrieve all Metabase dashboards with public URLs enabled (requires superuser) - use this to audit publicly accessible content or review security settings",
    execute: async () => {
      try {
        const dashboards = await metabaseClient.getPublicDashboards();
        return JSON.stringify(dashboards, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to fetch public dashboards: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Create a new dashboard
   *
   * Creates a new dashboard with specified name, description, and optional settings.
   * Use this to build new analytical views, organize related cards into cohesive
   * reports, or establish new monitoring interfaces.
   *
   * @param {string} name - Name of the dashboard
   * @param {string} [description] - Optional description
   * @param {number} [collection_id] - Collection to save the dashboard in
   * @returns {Promise<string>} JSON string of created dashboard object
   */
  server.addTool({
    name: "create_dashboard",
    description:
      "Create a new Metabase dashboard - use this to build new analytical views, organize related cards, or establish monitoring interfaces",
    metadata: { isWrite: true, isEssential: true },
    parameters: z.object({
      name: z.string().describe("Name of the dashboard (required)"),
      description: z
        .string()
        .optional()
        .describe("Description of the dashboard"),
      parameters: z
        .array(z.object({}).passthrough())
        .optional()
        .describe("Dashboard parameters array"),
      collection_id: z
        .number()
        .optional()
        .describe("Collection ID to save dashboard in"),
      collection_position: z
        .number()
        .optional()
        .describe("Position within the collection"),
    }).strict(),
    execute: async (args: {
      name: string;
      description?: string;
      parameters?: any[];
      collection_id?: number;
      collection_position?: number;
    }) => {
      try {
        const dashboard = await metabaseClient.createDashboard(args);
        return JSON.stringify(dashboard, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to create dashboard: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Create a public link for dashboard sharing
   *
   * Generates a publicly accessible URL for a dashboard that can be shared with
   * external users without requiring Metabase authentication. Requires superuser
   * privileges. Use this for external reporting, client dashboards, or public data sharing.
   *
   * @param {number} dashboard_id - The ID of the dashboard to make public
   * @returns {Promise<string>} JSON string with public link details
   */
  server.addTool({
    name: "create_public_link",
    description:
      "Generate publicly accessible URL for a dashboard (requires superuser) - use this for external reporting, client dashboards, or public data sharing",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        const result = await metabaseClient.createDashboardPublicLink(
          args.dashboard_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to create public link for dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Create a copy of an existing dashboard
   *
   * Duplicates a dashboard with all its cards, layout, and configuration.
   * Optionally customize the name, description, and collection for the copy.
   * Use this to create dashboard templates, backup important dashboards,
   * or create variations of existing analytical views.
   *
   * @param {number} from_dashboard_id - The ID of the dashboard to copy
   * @param {string} [name] - Name for the new dashboard copy
   * @param {string} [description] - Description for the new dashboard copy
   * @param {number} [collection_id] - Collection ID for the new dashboard
   * @param {number} [collection_position] - Position within the collection
   * @returns {Promise<string>} JSON string of the copied dashboard object
   */
  server.addTool({
    name: "copy_dashboard",
    metadata: { isWrite: true },
    description:
      "Create a copy of an existing dashboard with all cards and layout - use this to create templates, backups, or variations of analytical views",
    parameters: z.object({
      from_dashboard_id: z.number().describe("The ID of the dashboard to copy"),
      name: z.string().optional().describe("Name for the new dashboard copy"),
      description: z
        .string()
        .optional()
        .describe("Description for the new dashboard copy"),
      collection_id: z
        .number()
        .optional()
        .describe("Collection ID for the new dashboard"),
      collection_position: z
        .number()
        .optional()
        .describe("Position within the collection"),
    }).strict(),
    execute: async (args: {
      from_dashboard_id: number;
      name?: string;
      description?: string;
      collection_id?: number;
      collection_position?: number;
    }) => {
      try {
        const { from_dashboard_id, ...copyData } = args;
        const dashboard = await metabaseClient.copyDashboard(
          from_dashboard_id,
          copyData
        );
        return JSON.stringify(dashboard, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to copy dashboard ${args.from_dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Add a card to a dashboard
   *
   * Adds an existing card (question/visualization) to a dashboard with optional
   * parameter mappings and series configuration. Use this to build comprehensive
   * dashboards by combining multiple analytical views and visualizations.
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @param {number} [cardId] - The ID of the card to add
   * @param {number} [dashboard_tab_id] - The tab ID to add the card to (for dashboards with tabs)
   * @param {number} [row] - Row position for the card
   * @param {number} [col] - Column position for the card
   * @param {number} [size_x] - Width of the card
   * @param {number} [size_y] - Height of the card
   * @param {Array} [parameter_mappings] - Parameter mappings for the card
   * @param {Array} [series] - Series data for the card
   * @returns {Promise<string>} JSON string of the added card configuration
   */
  server.addTool({
    name: "add_card_to_dashboard",
    description:
      "Add an existing card to a dashboard with optional parameter mappings - use this to build comprehensive dashboards by combining multiple visualizations",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
      cardId: z
        .number()
        .nullable()
        .optional()
        .describe("The ID of the card to add (null for text/virtual cards)"),
      dashboard_tab_id: z
        .number()
        .optional()
        .describe("The tab ID to add the card to (for dashboards with tabs)"),
      row: z.number().optional().describe("Row position for the card"),
      col: z.number().optional().describe("Column position for the card"),
      size_x: z.number().optional().describe("Width of the card"),
      size_y: z.number().optional().describe("Height of the card"),
      visualization_settings: z
        .object({})
        .passthrough()
        .optional()
        .describe("Visualization settings (required for text cards)"),
      parameter_mappings: z
        .array(z.any())
        .optional()
        .describe("Parameter mappings for the card - fully preserved including nested arrays like target"),
      series: z
        .array(z.object({}).passthrough())
        .optional()
        .describe("Series data for the card"),
    }).strict(),
    execute: async (args: {
      dashboard_id: number;
      cardId?: number | null;
      dashboard_tab_id?: number;
      row?: number;
      col?: number;
      size_x?: number;
      size_y?: number;
      visualization_settings?: any;
      parameter_mappings?: any[];
      series?: any[];
    }) => {
      try {
        const { dashboard_id, ...cardData } = args;
        const result = await metabaseClient.addCardToDashboard(
          dashboard_id,
          cardData
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to add card to dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Add a text block or heading to a dashboard
   *
   * Adds a text card (virtual card) to a dashboard. This is useful for adding
   * explanatory text, headings, or instructions to dashboards.
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @param {string} text - The text content (supports Markdown)
   * @param {string} [display_type] - Either "heading" or "text" (default: "text")
   * @param {number} [dashboard_tab_id] - The tab ID to add the text to
   * @param {number} [row] - Row position
   * @param {number} [col] - Column position
   * @param {number} [size_x] - Width (default: 18)
   * @param {number} [size_y] - Height (default: 1 for heading, 2 for text)
   * @returns {Promise<string>} JSON string of the updated dashboard
   */
  server.addTool({
    name: "add_text_block",
    description:
      "Add a text block or heading to a dashboard - use this for explanatory text, titles, or instructions",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
      text: z.string().describe("The text content (supports Markdown)"),
      display_type: z
        .enum(["heading", "text"])
        .optional()
        .default("text")
        .describe("Display type: 'heading' for titles, 'text' for body text"),
      dashboard_tab_id: z
        .number()
        .optional()
        .describe("The tab ID to add the text to (for dashboards with tabs)"),
      row: z.number().optional().default(0).describe("Row position"),
      col: z.number().optional().default(0).describe("Column position"),
      size_x: z.number().optional().default(18).describe("Width of the text block"),
      size_y: z.number().optional().describe("Height of the text block"),
    }).strict(),
    execute: async (args: {
      dashboard_id: number;
      text: string;
      display_type?: "heading" | "text";
      dashboard_tab_id?: number;
      row?: number;
      col?: number;
      size_x?: number;
      size_y?: number;
    }) => {
      try {
        const displayType = args.display_type || "text";
        const sizeY = args.size_y || (displayType === "heading" ? 1 : 2);
        
        const cardData = {
          row: args.row || 0,
          col: args.col || 0,
          size_x: args.size_x || 18,
          size_y: sizeY,
          dashboard_tab_id: args.dashboard_tab_id,
          visualization_settings: {
            virtual_card: {
              display: displayType,
              visualization_settings: {},
              dataset_query: {},
              name: null,
              archived: false
            },
            text: args.text
          }
        };
        
        const result = await metabaseClient.addCardToDashboard(
          args.dashboard_id,
          cardData
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to add text block to dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Mark a dashboard as favorite
   *
   * Adds a dashboard to the current user's favorites list for quick access.
   * Favorited dashboards appear prominently in the UI and are easier to find.
   * Use this to bookmark frequently accessed analytical views.
   *
   * @param {number} dashboard_id - The ID of the dashboard to favorite
   * @returns {Promise<string>} JSON string confirming favorite status
   */
  server.addTool({
    name: "favorite_dashboard",
    description:
      "Mark a dashboard as favorite for quick access - use this to bookmark frequently accessed analytical views",
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        const result = await metabaseClient.favoriteDashboard(
          args.dashboard_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to favorite dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Revert dashboard to a previous revision
   *
   * Restores a dashboard to a specific previous state from its revision history.
   * Use this to undo unwanted changes, restore accidentally deleted content,
   * or return to a known good configuration.
   *
   * @param {number} dashboard_id - The ID of the dashboard to revert
   * @param {number} revision_id - The revision ID to revert to
   * @returns {Promise<string>} JSON string of the reverted dashboard
   */
  server.addTool({
    name: "revert_dashboard",
    description:
      "Restore a dashboard to a specific previous revision - use this to undo changes, restore deleted content, or return to known good configuration",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
      revision_id: z.number().describe("The revision ID to revert to"),
    }).strict(),
    execute: async (args: { dashboard_id: number; revision_id: number }) => {
      try {
        const result = await metabaseClient.revertDashboard(
          args.dashboard_id,
          args.revision_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to revert dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Save a denormalized dashboard description
   *
   * Saves a complete dashboard object with all its nested data in denormalized form.
   * This is typically used for bulk operations or when working with complex
   * dashboard structures that include embedded card data.
   *
   * @param {Object} dashboard - Complete dashboard object to save
   * @returns {Promise<string>} JSON string of the saved dashboard
   */
  server.addTool({
    name: "save_dashboard",
    description:
      "Save a complete dashboard object with nested data - use this for bulk operations or complex dashboard structures",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard: z
        .object({})
        .passthrough()
        .describe("Dashboard object to save"),
    }).strict(),
    execute: async (args: { dashboard: any }) => {
      try {
        const result = await metabaseClient.saveDashboard(args.dashboard);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to save dashboard: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Save a dashboard directly to a specific collection
   *
   * Saves a complete dashboard object directly into a specified collection.
   * Use this when creating dashboards that should be organized within specific
   * collection hierarchies or when bulk importing dashboard content.
   *
   * @param {number} parent_collection_id - The parent collection ID
   * @param {Object} dashboard - Dashboard object to save
   * @returns {Promise<string>} JSON string of the saved dashboard
   */
  server.addTool({
    name: "save_dashboard_to_collection",
    description:
      "Save a dashboard object directly into a specific collection - use this for organized dashboard creation or bulk imports",
    metadata: { isWrite: true },
    parameters: z.object({
      parent_collection_id: z.number().describe("The parent collection ID"),
      dashboard: z
        .object({})
        .passthrough()
        .describe("Dashboard object to save"),
    }).strict(),
    execute: async (args: { parent_collection_id: number; dashboard: any }) => {
      try {
        const result = await metabaseClient.saveDashboardToCollection(
          args.parent_collection_id,
          args.dashboard
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to save dashboard to collection ${
            args.parent_collection_id
          }: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Update dashboard properties and settings
   *
   * Modifies various dashboard properties including name, description, parameters,
   * collection placement, embedding settings, and archive status. Use this to
   * maintain dashboard metadata, reorganize content, or configure sharing options.
   *
   * @param {number} dashboard_id - The ID of the dashboard to update
   * @param {string} [name] - New name for the dashboard
   * @param {string} [description] - New description for the dashboard
   * @param {Array} [parameters] - Dashboard parameters configuration
   * @param {boolean} [archived] - Whether to archive the dashboard
   * @param {number} [collection_id] - Collection ID to move dashboard to
   * @param {boolean} [enable_embedding] - Enable embedding (requires superuser)
   * @returns {Promise<string>} JSON string of the updated dashboard
   */
  server.addTool({
    name: "update_dashboard",
    description:
      "Update dashboard properties including name, description, parameters, and settings - use this to maintain metadata, reorganize content, or configure sharing",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard to update"),
      name: z.string().optional().describe("New name for the dashboard"),
      description: z
        .string()
        .optional()
        .describe("New description for the dashboard"),
      parameters: z
        .array(z.object({}).passthrough())
        .optional()
        .describe("Dashboard parameters"),
      points_of_interest: z.string().optional().describe("Points of interest"),
      archived: z
        .boolean()
        .optional()
        .describe("Whether to archive the dashboard"),
      collection_position: z
        .number()
        .optional()
        .describe("Position within the collection"),
      show_in_getting_started: z
        .boolean()
        .optional()
        .describe("Show in getting started"),
      enable_embedding: z
        .boolean()
        .optional()
        .describe("Enable embedding (requires superuser)"),
      collection_id: z
        .number()
        .optional()
        .describe("Collection ID to move dashboard to"),
      caveats: z.string().optional().describe("Dashboard caveats"),
      embedding_params: z
        .object({})
        .passthrough()
        .optional()
        .describe("Embedding parameters"),
      position: z.number().optional().describe("Dashboard position"),
    }).strict(),
    execute: async (args: { dashboard_id: number; [key: string]: any }) => {
      try {
        const { dashboard_id, ...updates } = args;
        const dashboard = await metabaseClient.updateDashboard(
          dashboard_id,
          updates
        );
        return JSON.stringify(dashboard, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to update dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Update card layout and configuration on a dashboard
   *
   * ⚠️ DESTRUCTIVE OPERATION WARNING ⚠️
   * This tool REPLACES ALL dashboard cards with only the cards provided in the 'cards' array.
   * Any cards NOT included in the array will be PERMANENTLY DELETED from the dashboard.
   * This affects ALL tabs on the dashboard, not just the current tab.
   *
   * To safely update a single card, you MUST:
   * 1. First call get_dashboard to retrieve ALL existing dashcards
   * 2. Include ALL existing dashcards in the 'cards' array
   * 3. Modify only the specific card(s) you want to change
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @param {Array} cards - Array of card configurations with positioning and sizing
   * @returns {Promise<string>} JSON string of the updated card configurations
   */
  server.addTool({
    name: "update_dashboard_cards",
    description:
      "⚠️ DANGER: REPLACES ALL dashboard cards - any cards not in the array will be DELETED. To update a single card, first get_dashboard to fetch ALL cards, then include ALL of them with your modifications. This affects ALL tabs.",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
      cards: z
        .array(
          z
            .object({
              id: z.number().describe("Card ID"),
              size_x: z.number().optional().describe("Width of the card"),
              size_y: z.number().optional().describe("Height of the card"),
              row: z.number().optional().describe("Row position"),
              col: z.number().optional().describe("Column position"),
              series: z
                .array(z.object({}).passthrough())
                .optional()
                .describe("Series data"),
            })
            .passthrough()
        )
        .describe("Array of card configurations"),
    }).strict(),
    execute: async (args: { dashboard_id: number; cards: any[] }) => {
      try {
        const result = await metabaseClient.updateDashboardCards(
          args.dashboard_id,
          args.cards
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to update cards on dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Delete or archive a dashboard
   *
   * Removes a dashboard either by archiving it (soft delete) or permanently
   * deleting it (hard delete). Archived dashboards can be restored, while
   * permanently deleted dashboards cannot. Use with caution for permanent deletion.
   *
   * @param {number} dashboard_id - The ID of the dashboard to delete
   * @param {boolean} [hard_delete=false] - Whether to permanently delete (true) or archive (false)
   * @returns {Promise<string>} JSON string confirming deletion status
   */
  server.addTool({
    name: "delete_dashboard",
    description:
      "Delete or archive a dashboard (soft or hard delete) - use with caution as permanent deletion cannot be undone",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard to delete"),
      hard_delete: z
        .boolean()
        .optional()
        .default(false)
        .describe("Whether to permanently delete (true) or archive (false)"),
    }).strict(),
    execute: async (args: { dashboard_id: number; hard_delete?: boolean }) => {
      try {
        await metabaseClient.deleteDashboard(
          args.dashboard_id,
          args.hard_delete || false
        );
        return JSON.stringify(
          {
            dashboard_id: args.dashboard_id,
            action: args.hard_delete ? "deleted" : "archived",
            status: "success",
          },
          null,
          2
        );
      } catch (error) {
        throw new Error(
          `Failed to delete dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Remove public link access for a dashboard
   *
   * Disables public URL access for a dashboard, making it no longer accessible
   * to external users without authentication. Requires superuser privileges.
   * Use this to revoke public access for security or privacy reasons.
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @returns {Promise<string>} JSON string confirming public link removal
   */
  server.addTool({
    name: "delete_public_link",
    description:
      "Remove public URL access for a dashboard (requires superuser) - use this to revoke external access for security or privacy reasons",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        await metabaseClient.deleteDashboardPublicLink(args.dashboard_id);
        return JSON.stringify(
          {
            dashboard_id: args.dashboard_id,
            action: "public_link_deleted",
            status: "success",
          },
          null,
          2
        );
      } catch (error) {
        throw new Error(
          `Failed to delete public link for dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Remove specific cards from a dashboard
   *
   * Removes one or more cards from a dashboard by their IDs. The cards themselves
   * are not deleted, only their placement on the dashboard is removed.
   * Use this to clean up dashboards or reorganize content.
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @param {Array<number>} card_ids - Array of card IDs to remove
   * @returns {Promise<string>} JSON string confirming card removal
   */
  server.addTool({
    name: "remove_cards_from_dashboard",
    description:
      "Remove specific dashcards from a dashboard by their dashcard IDs (not card_id) - use this to clean up dashboards or reorganize content",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
      dashcard_ids: z.array(z.number()).describe("Array of dashcard IDs to remove (the 'id' field from dashcards, not 'card_id')"),
    }).strict(),
    execute: async (args: { dashboard_id: number; dashcard_ids: number[] }) => {
      try {
        const result = await metabaseClient.removeCardsFromDashboard(
          args.dashboard_id,
          args.dashcard_ids
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to remove cards from dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Remove dashboard from favorites
   *
   * Removes a dashboard from the current user's favorites list. The dashboard
   * will no longer appear in the favorites section and won't have priority
   * placement in the UI.
   *
   * @param {number} dashboard_id - The ID of the dashboard to unfavorite
   * @returns {Promise<string>} JSON string confirming unfavorite status
   */
  server.addTool({
    name: "unfavorite_dashboard",
    description:
      "Remove a dashboard from the user's favorites list - use this to clean up bookmarked dashboards",
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        const result = await metabaseClient.unfavoriteDashboard(
          args.dashboard_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to unfavorite dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Execute a specific card from a dashboard
   *
   * Runs a card (question/visualization) that exists on a dashboard and returns
   * the query results. Use this to get fresh data from dashboard components,
   * test card functionality, or extract specific analytical results.
   *
   * @param {number} dashboard_id - The ID of the dashboard containing the card
   * @param {number} card_id - The ID of the card to execute
   * @returns {Promise<string>} JSON string with execution results and data
   */
  server.addTool({
    name: "execute_dashboard_card",
    description:
      "Execute a specific card from a dashboard and retrieve fresh data - use this to get current results from dashboard components or test card functionality",
    metadata: { isRead: true },
    parameters: z.object({
      dashboard_id: z
        .number()
        .describe("The ID of the dashboard containing the card"),
      card_id: z.number().describe("The ID of the card to execute"),
    }).strict(),
    execute: async (args: { dashboard_id: number; card_id: number }) => {
      try {
        const result = await metabaseClient.executeCard(args.card_id);
        return JSON.stringify(
          {
            dashboard_id: args.dashboard_id,
            card_id: args.card_id,
            status: "completed",
            data: result,
          },
          null,
          2
        );
      } catch (error) {
        throw new Error(
          `Failed to execute card ${args.card_id} from dashboard ${
            args.dashboard_id
          }: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    },
  });

  /**
   * Search dashboards by name or description
   *
   * Performs client-side filtering of dashboards based on name or description
   * matching the search query. Use this to find specific dashboards when you
   * know part of the name or description, or to discover related content.
   *
   * @param {string} query - Search query string to match against names and descriptions
   * @param {number} [limit] - Maximum number of results to return
   * @returns {Promise<string>} JSON string of matching dashboards
   */
  server.addTool({
    name: "search_dashboards",
    metadata: { isEssential: true, isRead: true },
    description:
      "Search dashboards by name or description text - use this to find specific dashboards or discover related analytical content",
    parameters: z.object({
      query: z.string().describe("Search query string"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of results to return"),
    }).strict(),
    execute: async (args: { query: string; limit?: number }) => {
      try {
        const dashboards = await metabaseClient.getDashboards();
        const filtered = dashboards.filter(
          (d) =>
            d.name?.toLowerCase().includes(args.query.toLowerCase()) ||
            d.description?.toLowerCase().includes(args.query.toLowerCase())
        );

        const results = args.limit ? filtered.slice(0, args.limit) : filtered;
        return JSON.stringify(results, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to search dashboards: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Update a specific dashcard without affecting other cards
   *
   * Updates a single dashcard's properties (parameter_mappings, visualization_settings,
   * position, size) without requiring you to fetch and resend all other dashcards.
   * This is much safer than update_dashboard_cards which replaces ALL cards.
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @param {number} dashcard_id - The dashcard 'id' field (not card_id)
   * @param {object} updates - Properties to update on the dashcard
   * @returns {Promise<string>} JSON string of the updated dashboard
   */
  server.addTool({
    name: "update_dashcard",
    description:
      "Update a specific dashcard's properties without affecting other cards - use for parameter_mappings, visualization_settings, position, or size changes. Much safer than update_dashboard_cards.",
    metadata: { isWrite: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
      dashcard_id: z.number().describe("The dashcard 'id' field (not card_id)"),
      updates: z.object({
        parameter_mappings: z.array(z.any()).optional().describe("Parameter mappings for connecting filters"),
        visualization_settings: z.object({}).passthrough().optional().describe("Visualization settings"),
        row: z.number().optional().describe("Row position"),
        col: z.number().optional().describe("Column position"),
        size_x: z.number().optional().describe("Width of the card"),
        size_y: z.number().optional().describe("Height of the card"),
      }).passthrough().describe("Properties to update on the dashcard"),
    }).strict(),
    execute: async (args: { dashboard_id: number; dashcard_id: number; updates: any }) => {
      try {
        const result = await metabaseClient.updateDashcard(
          args.dashboard_id,
          args.dashcard_id,
          args.updates
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to update dashcard ${args.dashcard_id} on dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get all queries used in a dashboard
   *
   * Extracts all queries from a dashboard with field/table IDs resolved to actual names.
   * For MBQL cards, returns the MBQL structure with column names instead of field IDs.
   * For native SQL cards, returns the raw SQL. Useful for understanding what data
   * a dashboard uses, auditing queries, or migrating to new tables.
   *
   * @param {number} dashboard_id - The ID of the dashboard
   * @returns {Promise<string>} JSON string with all queries and their metadata
   */
  server.addTool({
    name: "get_dashboard_queries",
    description:
      "Extract all queries from a dashboard with IDs resolved to actual table/column names - use this to understand dashboard data sources, audit queries, or plan migrations",
    metadata: { isRead: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        const dashboard = await metabaseClient.getDashboard(args.dashboard_id);
        const dashcards = (dashboard as any).dashcards || [];
        const tabs = (dashboard as any).tabs || [];
        
        // Build tab lookup
        const tabLookup: Record<number, string> = {};
        tabs.forEach((t: any) => { tabLookup[t.id] = t.name; });
        
        // Collect all unique table IDs we need to resolve
        const tableIds = new Set<number>();
        dashcards.forEach((dc: any) => {
          const card = dc.card || {};
          const query = card.dataset_query?.query;
          if (query?.['source-table'] && typeof query['source-table'] === 'number') {
            tableIds.add(query['source-table']);
          }
          // Also check joins
          if (query?.joins) {
            query.joins.forEach((j: any) => {
              if (j['source-table'] && typeof j['source-table'] === 'number') {
                tableIds.add(j['source-table']);
              }
            });
          }
        });
        
        // Fetch metadata for all tables to resolve field IDs
        const tableMetadata: Record<number, any> = {};
        const tableNames: Record<number, string> = {};
        for (const tableId of tableIds) {
          try {
            const metadata = await metabaseClient.getTableQueryMetadata(tableId);
            tableMetadata[tableId] = metadata;
            // Build full table name: schema.table_name
            const schema = metadata.schema || '';
            const tableName = metadata.name || `table_${tableId}`;
            tableNames[tableId] = schema ? `${schema}.${tableName}` : tableName;
          } catch (e) {
            tableNames[tableId] = `unknown_table_${tableId}`;
          }
        }
        
        // Build field ID to name lookup across all tables
        const fieldLookup: Record<number, { name: string; table: string }> = {};
        for (const [tableId, metadata] of Object.entries(tableMetadata)) {
          const fields = (metadata as any).fields || [];
          const tableName = tableNames[Number(tableId)];
          fields.forEach((f: any) => {
            fieldLookup[f.id] = { name: f.name, table: tableName };
          });
        }
        
        // Helper to resolve field references in MBQL
        const resolveFieldRef = (ref: any): any => {
          if (!Array.isArray(ref)) return ref;
          
          if (ref[0] === 'field' && typeof ref[1] === 'number') {
            const fieldInfo = fieldLookup[ref[1]];
            const fieldName = fieldInfo?.name || `field_${ref[1]}`;
            // Keep the options (like temporal-unit) but replace ID with name
            if (ref[2] && typeof ref[2] === 'object') {
              return ['field', fieldName, ref[2]];
            }
            return ['field', fieldName];
          }
          
          // Recursively resolve nested arrays
          return ref.map((item: any) => resolveFieldRef(item));
        };
        
        // Helper to resolve entire MBQL query
        const resolveMbql = (query: any): any => {
          if (!query) return query;
          
          const resolved: any = {};
          
          // Resolve source-table
          if (query['source-table'] && typeof query['source-table'] === 'number') {
            resolved['source-table'] = tableNames[query['source-table']] || `table_${query['source-table']}`;
          }
          
          // Resolve aggregation
          if (query.aggregation) {
            resolved.aggregation = query.aggregation.map((agg: any) => resolveFieldRef(agg));
          }
          
          // Resolve breakout
          if (query.breakout) {
            resolved.breakout = query.breakout.map((b: any) => resolveFieldRef(b));
          }
          
          // Resolve filter
          if (query.filter) {
            resolved.filter = resolveFieldRef(query.filter);
          }
          
          // Resolve order-by
          if (query['order-by']) {
            resolved['order-by'] = query['order-by'].map((o: any) => resolveFieldRef(o));
          }
          
          // Resolve joins
          if (query.joins) {
            resolved.joins = query.joins.map((j: any) => ({
              ...j,
              'source-table': typeof j['source-table'] === 'number' 
                ? (tableNames[j['source-table']] || `table_${j['source-table']}`)
                : j['source-table'],
              condition: resolveFieldRef(j.condition),
            }));
          }
          
          // Resolve fields (selected columns)
          if (query.fields) {
            resolved.fields = query.fields.map((f: any) => resolveFieldRef(f));
          }
          
          // Copy other properties
          if (query.limit) resolved.limit = query.limit;
          if (query.expressions) {
            resolved.expressions = {};
            for (const [name, expr] of Object.entries(query.expressions)) {
              resolved.expressions[name] = resolveFieldRef(expr);
            }
          }
          
          return resolved;
        };
        
        // Process each card
        const cards = dashcards.map((dc: any) => {
          const card = dc.card || {};
          const datasetQuery = card.dataset_query || {};
          const tabName = dc.dashboard_tab_id ? tabLookup[dc.dashboard_tab_id] : null;
          
          // Virtual/text cards
          if (!dc.card_id) {
            const vizSettings = dc.visualization_settings || {};
            return {
              dashcard_id: dc.id,
              card_id: null,
              card_name: '(virtual card)',
              tab: tabName,
              query_type: 'virtual',
              text: vizSettings.text || null,
            };
          }
          
          // Native SQL cards
          if (datasetQuery.type === 'native') {
            const native = datasetQuery.native || {};
            return {
              dashcard_id: dc.id,
              card_id: dc.card_id,
              card_name: card.name || '(unnamed)',
              tab: tabName,
              query_type: 'native',
              database_id: datasetQuery.database,
              sql: native.query || null,
              template_tags: native['template-tags'] ? Object.keys(native['template-tags']) : [],
            };
          }
          
          // MBQL cards
          const query = datasetQuery.query || {};
          return {
            dashcard_id: dc.id,
            card_id: dc.card_id,
            card_name: card.name || '(unnamed)',
            tab: tabName,
            query_type: 'mbql',
            database_id: datasetQuery.database,
            mbql: resolveMbql(query),
          };
        });
        
        // Build summary
        const tablesUsed = [...new Set(Object.values(tableNames))].sort();
        
        return JSON.stringify({
          dashboard_id: args.dashboard_id,
          dashboard_name: (dashboard as any).name,
          total_cards: dashcards.length,
          cards: cards,
          tables_used: tablesUsed,
        }, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get queries for dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Audit dashboard filter connections
   *
   * Analyzes all dashboard filter connections to identify unconnected or
   * misconfigured cards. Returns a detailed report showing which parameters
   * are connected to which cards, and highlights any issues.
   *
   * @param {number} dashboard_id - The ID of the dashboard to audit
   * @returns {Promise<string>} JSON string with audit results
   */
  server.addTool({
    name: "audit_dashboard_filters",
    description:
      "Analyze dashboard filter connections to find unconnected or misconfigured cards - use this to diagnose filter issues and ensure all cards are properly connected",
    metadata: { isRead: true },
    parameters: z.object({
      dashboard_id: z.number().describe("The ID of the dashboard to audit"),
    }).strict(),
    execute: async (args: { dashboard_id: number }) => {
      try {
        const dashboard = await metabaseClient.getDashboard(args.dashboard_id);
        const dashcards = (dashboard as any).dashcards || [];
        const parameters = (dashboard as any).parameters || [];
        
        // Build audit report
        const parameterIds = parameters.map((p: any) => p.id);
        
        const cardAudit = dashcards.map((dc: any) => {
          const card = dc.card || {};
          const mappings = dc.parameter_mappings || [];
          const connectedParams = mappings.map((m: any) => m.parameter_id);
          const missingParams = parameterIds.filter((pid: string) => !connectedParams.includes(pid));
          
          // Check for potential issues
          const errors: string[] = [];
          mappings.forEach((m: any) => {
            if (!m.target) {
              errors.push(`Parameter '${m.parameter_id}' has no target`);
            } else if (Array.isArray(m.target) && m.target[0] === 'dimension') {
              // MBQL card - check for stage-number
              const hasStageNumber = m.target.some((t: any) => 
                typeof t === 'object' && t !== null && 'stage-number' in t
              );
              if (!hasStageNumber) {
                errors.push(`Parameter '${m.parameter_id}' missing stage-number (MBQL cards require this)`);
              }
            }
          });
          
          // Determine source table
          let sourceTable = null;
          if (card.dataset_query?.query?.['source-table']) {
            sourceTable = card.dataset_query.query['source-table'];
          }
          
          return {
            dashcard_id: dc.id,
            card_id: dc.card_id,
            card_name: card.name || '(virtual card)',
            source_table: sourceTable,
            is_native_query: card.dataset_query?.type === 'native',
            connected_params: connectedParams,
            missing_params: missingParams,
            errors: errors,
          };
        });
        
        // Filter to only cards that have issues or are missing connections
        const cardsWithIssues = cardAudit.filter((c: any) => 
          c.missing_params.length > 0 || c.errors.length > 0
        );
        
        return JSON.stringify({
          dashboard_id: args.dashboard_id,
          total_parameters: parameters.length,
          parameter_ids: parameterIds,
          total_cards: dashcards.length,
          cards_with_issues: cardsWithIssues.length,
          all_cards: cardAudit,
          cards_needing_attention: cardsWithIssues,
        }, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to audit dashboard ${args.dashboard_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });
}
