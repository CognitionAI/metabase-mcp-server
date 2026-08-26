import { z } from "zod";
import { MetabaseClient } from "../client/metabase-client.js";

export function addTableTools(server: any, metabaseClient: MetabaseClient) {

  // Metabase API reference (OpenAPI):
  // - Hosted: https://www.metabase.com/docs/latest/api.json
  // - Your instance: https://[your-metabase-url]/api/docs

  /**
   * List all available tables
   * 
   * Retrieves all tables with optional filtering by specific table IDs.
   * Use this to discover available tables, explore database schema,
   * or get metadata about specific tables.
   * 
   * @param {number[]} [ids] - Optional list of table IDs to filter by
   * @returns {Promise<string>} JSON string of tables array
   */
  server.addTool({
    name: "list_tables",
    description: "Retrieve all Metabase tables with optional ID filtering - use this to discover available tables, explore database schema, or get metadata about specific tables",
    metadata: { isEssential: true, isRead: true },
    parameters: z.object({
      ids: z
        .array(z.number())
        .optional()
        .describe("Optional list of table IDs to filter by"),
    }).strict(),
    execute: async (args: { ids?: number[] } = {}) => {
      try {
        const result = await metabaseClient.getTables(args.ids);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to list tables: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Bulk update multiple tables
   * 
   * Updates multiple tables simultaneously with the same configuration changes.
   * Use this to apply consistent settings across tables, update metadata,
   * or modify table properties efficiently.
   * 
   * @param {number[]} ids - Array of table IDs to update
   * @param {object} updates - Update payload applied to all tables
   * @returns {Promise<string>} JSON string of update results
   */
  server.addTool({
    name: "update_tables",
    description: "Bulk update multiple Metabase tables with same configuration - use this to apply consistent settings, update metadata, or modify table properties efficiently",
    metadata: { isWrite: true },
    parameters: z.object({
      ids: z.array(z.number().int().min(1)).describe("IDs of tables to update"),
      display_name: z.string().min(1).optional().describe("New display name for the tables"),
      description: z.string().optional().describe("New description"),
      caveats: z.string().optional().describe("Caveats"),
      points_of_interest: z.string().optional().describe("Points of interest"),
      visibility_type: z.enum(["technical", "hidden", "cruft"]).optional().describe("Table visibility type"),
      data_authority: z.record(z.string(), z.any()).optional().describe("Data authority settings (see Metabase OpenAPI spec)"),
      data_layer: z.string().optional().describe("Data layer"),
      data_source: z.string().optional().describe("Data source"),
      owner_email: z.string().optional().describe("Owner email"),
      owner_user_id: z.number().int().optional().describe("Owner user ID"),
      show_in_getting_started: z.boolean().optional().describe("Show table in getting started"),
      entity_type: z.string().optional().describe("Entity type"),
    }).strict(),
    execute: async (args: {
      ids: number[];
      display_name?: string;
      description?: string;
      caveats?: string;
      points_of_interest?: string;
      visibility_type?: "technical" | "hidden" | "cruft";
      data_authority?: any;
      data_layer?: string;
      data_source?: string;
      owner_email?: string;
      owner_user_id?: number;
      show_in_getting_started?: boolean;
      entity_type?: string;
    }) => {
      try {
        const { ids, ...updates } = args;
        const result = await metabaseClient.updateTables(ids, updates);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to bulk update tables: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get detailed table information
   * 
   * Retrieves comprehensive information about a specific table including schema,
   * fields, data types, and metadata. Use this to understand table structure,
   * explore available fields, or get configuration details.
   * 
   * @param {number} table_id - The ID of the table to retrieve
   * @param {boolean} [include_sensitive_fields] - Include sensitive fields in response
   * @param {boolean} [include_hidden_fields] - Include hidden fields in response
   * @param {boolean} [include_editable_data_model] - Include editable data model info
   * @returns {Promise<string>} JSON string with complete table information
   */
  server.addTool({
    name: "get_table",
    description: "Retrieve comprehensive table information including schema, fields, and metadata - use this to understand structure, explore fields, or get configuration details",
    metadata: { isEssential: true, isRead: true },
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
      include_sensitive_fields: z
        .boolean()
        .optional()
        .describe("Include sensitive fields"),
      include_hidden_fields: z
        .boolean()
        .optional()
        .describe("Include hidden fields"),
      include_editable_data_model: z
        .boolean()
        .optional()
        .describe("Include editable data model"),
    }).strict(),
    execute: async (args: {
      table_id: number;
      include_sensitive_fields?: boolean;
      include_hidden_fields?: boolean;
      include_editable_data_model?: boolean;
    }) => {
      try {
        const result = await metabaseClient.getTable(args.table_id, {
          include_sensitive_fields: args.include_sensitive_fields,
          include_hidden_fields: args.include_hidden_fields,
          include_editable_data_model: args.include_editable_data_model,
        });
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Update table configuration and metadata
   * 
   * Modifies table properties such as display name, description, visibility settings,
   * and field configurations. Use this to customize table presentation, update
   * metadata, or configure data model settings.
   * 
   * @param {number} table_id - The ID of the table to update
   * @param {Object} updates - Fields and values to update
   * @returns {Promise<string>} JSON string of the updated table object
   */
  server.addTool({
    name: "update_table",
    description: "Update table configuration including display name, description, and field settings - use this to customize presentation, update metadata, or configure data model",
    metadata: { isWrite: true },
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
      display_name: z.string().min(1).optional().describe("New display name"),
      description: z.string().optional().describe("New description"),
      caveats: z.string().optional().describe("Caveats"),
      points_of_interest: z.string().optional().describe("Points of interest"),
      visibility_type: z.enum(["technical", "hidden", "cruft"]).optional().describe("Table visibility type"),
      field_order: z.enum(["alphabetical", "custom", "database", "smart"]).optional().describe("Field ordering"),
      data_authority: z.record(z.string(), z.any()).optional().describe("Data authority settings (see Metabase OpenAPI spec)"),
      data_layer: z.string().optional().describe("Data layer"),
      data_source: z.string().optional().describe("Data source"),
      owner_email: z.string().optional().describe("Owner email"),
      owner_user_id: z.number().int().optional().describe("Owner user ID"),
      show_in_getting_started: z.boolean().optional().describe("Show table in getting started"),
      entity_type: z.string().optional().describe("Entity type"),
    }).strict(),
    execute: async (args: {
      table_id: number;
      display_name?: string;
      description?: string;
      caveats?: string;
      points_of_interest?: string;
      visibility_type?: "technical" | "hidden" | "cruft";
      field_order?: "alphabetical" | "custom" | "database" | "smart";
      data_authority?: any;
      data_layer?: string;
      data_source?: string;
      owner_email?: string;
      owner_user_id?: number;
      show_in_getting_started?: boolean;
      entity_type?: string;
    }) => {
      try {
        const { table_id, ...updates } = args;
        const result = await metabaseClient.updateTable(table_id, updates);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to update table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get table foreign key relationships
   * 
   * Retrieves all foreign key relationships for a table, showing connections
   * to other tables. Use this to understand data relationships, build joins,
   * or explore table dependencies.
   * 
   * @param {number} table_id - The ID of the table
   * @returns {Promise<string>} JSON string with foreign key relationship details
   */
  server.addTool({
    name: "get_table_fks",
    description: "Retrieve foreign key relationships for a table - use this to understand data connections, build joins, or explore table dependencies",
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
    }).strict(),
    execute: async (args: { table_id: number }) => {
      try {
        const result = await metabaseClient.getTableFks(args.table_id);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get FKs for table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get table query metadata for building queries
   * 
   * Retrieves metadata specifically formatted for query building, including
   * field types, constraints, and query-relevant information. Use this when
   * constructing dynamic queries or building query interfaces.
   * 
   * @param {number} table_id - The ID of the table
   * @param {boolean} [include_sensitive_fields] - Include sensitive fields
   * @param {boolean} [include_hidden_fields] - Include hidden fields
   * @param {boolean} [include_editable_data_model] - Include editable model info
   * @returns {Promise<string>} JSON string with query-optimized metadata
   */
  server.addTool({
    name: "get_table_query_metadata",
    description: "Retrieve query-optimized table metadata for building dynamic queries - use this when constructing queries or building query interfaces",
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
      include_sensitive_fields: z.boolean().optional(),
      include_hidden_fields: z.boolean().optional(),
      include_editable_data_model: z.boolean().optional(),
    }).strict(),
    execute: async (args: {
      table_id: number;
      include_sensitive_fields?: boolean;
      include_hidden_fields?: boolean;
      include_editable_data_model?: boolean;
    }) => {
      try {
        const result = await metabaseClient.getTableQueryMetadata(
          args.table_id,
          {
            include_sensitive_fields: args.include_sensitive_fields,
            include_hidden_fields: args.include_hidden_fields,
            include_editable_data_model: args.include_editable_data_model,
          }
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get query metadata for table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get related tables and entities
   * 
   * Finds tables and entities related to the specified table through foreign keys,
   * similar schemas, or other relationships. Use this to discover connected data,
   * find related analytical content, or understand data context.
   * 
   * @param {number} table_id - The ID of the table
   * @returns {Promise<string>} JSON string with related tables and entities
   */
  server.addTool({
    name: "get_table_related",
    description: "Find tables and entities related through relationships or schemas - use this to discover connected data, find related content, or understand context",
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
    }).strict(),
    execute: async (args: { table_id: number }) => {
      try {
        const result = await metabaseClient.getTableRelated(args.table_id);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get related entities for table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get foreign keys for card virtual table
   * 
   * Retrieves foreign key relationships for a card's virtual table (card__{id}).
   * Card virtual tables represent saved questions as queryable tables.
   * Use this to understand relationships in card-based queries.
   * 
   * @param {number} card_id - The ID of the card (creates virtual table card__{id})
   * @returns {Promise<string>} JSON string with virtual table foreign keys
   */
  server.addTool({
    name: "get_card_table_fks",
    description: "Retrieve foreign keys for a card's virtual table - use this to understand relationships in card-based queries or saved question tables",
    parameters: z.object({
      card_id: z.number().describe("Card ID for the virtual table"),
    }).strict(),
    execute: async (args: { card_id: number }) => {
      try {
        const result = await metabaseClient.getCardTableFks(args.card_id);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get FKs for card table card__${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Get query metadata for card virtual table
   * 
   * Retrieves query metadata for a card's virtual table, allowing the saved
   * question to be treated as a queryable table. Use this to build queries
   * on top of existing saved questions or cards.
   * 
   * @param {number} card_id - The ID of the card (creates virtual table card__{id})
   * @returns {Promise<string>} JSON string with virtual table query metadata
   */
  server.addTool({
    name: "get_card_table_query_metadata",
    description: "Retrieve query metadata for a card's virtual table - use this to build queries on top of saved questions or treat cards as queryable tables",
    parameters: z.object({
      card_id: z.number().describe("Card ID for the virtual table"),
    }).strict(),
    execute: async (args: { card_id: number }) => {
      try {
        const result = await metabaseClient.getCardTableQueryMetadata(
          args.card_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to get query metadata for card table card__${args.card_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Append CSV data to existing table
   * 
   * Adds new rows from CSV content to an existing table. The CSV structure
   * must match the table schema. Use this to incrementally load data,
   * update tables with new records, or import additional data.
   * 
   * @param {number} table_id - The ID of the table to append to
   * @param {string} filename - CSV filename (for metadata and logging)
   * @param {string} file_content - CSV file content as string
   * @returns {Promise<string>} JSON string with append operation results
   */
  server.addTool({
    name: "append_csv_to_table",
    description: "Add new rows from CSV content to existing table - use this for incremental data loading, updates, or importing additional records",
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
      filename: z.string().describe("CSV filename (for metadata only)"),
      file_content: z.string().describe("CSV file content as string"),
    }).strict(),
    execute: async (args: {
      table_id: number;
      filename: string;
      file_content: string;
    }) => {
      try {
        const result = await metabaseClient.appendCsvToTable(
          args.table_id,
          args.filename,
          args.file_content
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to append CSV to table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Discard cached field values
   * 
   * Clears Metabase's cache of field values for a table, forcing fresh
   * data to be loaded on next access. Use this when table data has changed
   * significantly or when cached values are stale.
   * 
   * @param {number} table_id - The ID of the table
   * @returns {Promise<string>} JSON string confirming cache clearing
   */
  server.addTool({
    name: "discard_table_field_values",
    description: "Clear cached field values to force fresh data loading - use this when table data has changed or cached values are stale",
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
    }).strict(),
    execute: async (args: { table_id: number }) => {
      try {
        const result = await metabaseClient.discardTableFieldValues(
          args.table_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to discard values for table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Reorder table fields display sequence
   * 
   * Changes the display order of fields in a table for better organization
   * and user experience. Use this to arrange fields logically, group related
   * columns, or improve data presentation.
   * 
   * @param {number} table_id - The ID of the table
   * @param {Array<number>} field_order - Array of field IDs in desired display order
   * @returns {Promise<string>} JSON string confirming field reordering
   */
  server.addTool({
    name: "reorder_table_fields",
    description: "Change display order of table fields for better organization - use this to arrange fields logically, group columns, or improve presentation",
    metadata: { isWrite: true },
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
      field_order: z
        .array(z.number())
        .describe("Array of field IDs in desired order"),
    }).strict(),
    execute: async (args: { table_id: number; field_order: number[] }) => {
      try {
        const result = await metabaseClient.reorderTableFields(
          args.table_id,
          args.field_order
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to reorder fields for table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Replace table data with CSV content
   * 
   * Completely replaces existing table data with new CSV content. This is
   * typically used with Metabase CSV models. Use this for full data refreshes,
   * model updates, or complete table replacements.
   * 
   * @param {number} table_id - The ID of the table (must be CSV model)
   * @param {string} csv_file - Complete CSV file content as string
   * @returns {Promise<string>} JSON string with replacement operation results
   */
  server.addTool({
    name: "replace_table_csv",
    description: "Completely replace table data with new CSV content - use this for full data refreshes, model updates, or complete table replacements",
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
      csv_file: z.string().describe("CSV file content as string"),
    }).strict(),
    execute: async (args: { table_id: number; csv_file: string }) => {
      try {
        const result = await metabaseClient.replaceTableCsv(
          args.table_id,
          args.csv_file
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to replace CSV for table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Rescan and refresh field values cache
   * 
   * Triggers a rescan of field values to update Metabase's cache with current
   * data. Use this to refresh dropdown options, update field statistics,
   * or ensure filters show current values.
   * 
   * @param {number} table_id - The ID of the table
   * @returns {Promise<string>} JSON string confirming rescan initiation
   */
  server.addTool({
    name: "rescan_table_field_values",
    description: "Trigger rescan to refresh field values cache with current data - use this to update dropdown options, statistics, or filter values",
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
    }).strict(),
    execute: async (args: { table_id: number }) => {
      try {
        const result = await metabaseClient.rescanTableFieldValues(
          args.table_id
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to rescan values for table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Trigger table schema synchronization
   * 
   * Initiates a schema sync for a specific table to update its metadata
   * and structure information in Metabase. Use this when table schema
   * has changed and needs to be recognized by Metabase.
   * 
   * @param {number} table_id - The ID of the table to sync
   * @returns {Promise<string>} JSON string confirming sync initiation
   */
  server.addTool({
    name: "sync_table_schema",
    description: "Initiate schema sync for specific table to update metadata - use this when table structure has changed and needs recognition",
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
    }).strict(),
    execute: async (args: { table_id: number }) => {
      try {
        const result = await metabaseClient.syncTableSchema(args.table_id);
        return JSON.stringify(
          { table_id: args.table_id, status: "schema_sync_triggered", result },
          null,
          2
        );
      } catch (error) {
        throw new Error(
          `Failed to sync schema for table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Fetch sample data from table
   * 
   * Retrieves a sample of actual data from the table for preview, analysis,
   * or testing purposes. Use this to examine data content, verify data quality,
   * or understand data patterns and formats.
   * 
   * @param {number} table_id - The ID of the table
   * @param {number} [limit=1000] - Maximum number of rows to return
   * @returns {Promise<string>} JSON string with sample table data
   */
  server.addTool({
    name: "get_table_data",
    description: "Retrieve sample data from table for preview and analysis - use this to examine content, verify quality, or understand data patterns",
    metadata: { isRead: true },
    parameters: z.object({
      table_id: z.number().describe("Table ID"),
      limit: z.number().optional().describe("Row limit (default 1000)"),
    }).strict(),
    execute: async (args: { table_id: number; limit?: number }) => {
      try {
        const result = await metabaseClient.getTableData(
          args.table_id,
          args.limit
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to fetch data for table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });

  /**
   * Look up a field's ID by table and column name
   * 
   * Finds a field's ID and metadata by searching for a column name within a table.
   * Essential for building parameter mappings where you need field IDs.
   * Searches both the internal name and display_name.
   * 
   * @param {number} table_id - The ID of the table
   * @param {string} column_name - The column name to search for
   * @returns {Promise<string>} JSON string with field_id, name, base_type, and other metadata
   */
  server.addTool({
    name: "get_field_id",
    description: "Look up a field's ID and metadata by table and column name - essential for building parameter mappings. Returns field_id, base_type, and other metadata needed for filter connections.",
    metadata: { isRead: true, isEssential: true },
    parameters: z.object({
      table_id: z.number().describe("Table ID to search in"),
      column_name: z.string().describe("Column name to look up (searches both name and display_name)"),
    }).strict(),
    execute: async (args: { table_id: number; column_name: string }) => {
      try {
        const result = await metabaseClient.getFieldByName(
          args.table_id,
          args.column_name
        );
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(
          `Failed to find field '${args.column_name}' in table ${args.table_id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
  });
}
