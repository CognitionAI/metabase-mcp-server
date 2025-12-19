import { z } from "zod";
import { MetabaseClient } from "../client/metabase-client.js";

export function addDatabaseTools(server: any, metabaseClient: MetabaseClient) {

  /**
   * List all available databases
   * 
   * Retrieves all database connections configured in Metabase. Use this to discover
   * available data sources, check connection status, or get an overview of all
   * connected databases.
   * 
   * @returns {Promise<string>} JSON string of databases array
   */
  server.addTool({
    name: "list_databases",
    description: "Retrieve all database connections in Metabase - use this to discover available data sources, check connection status, or get an overview of connected databases",
    metadata: { isEssential: true, isRead: true },
    execute: async () => {
      try {
        const databases = await metabaseClient.getDatabases();
        return JSON.stringify(databases, null, 2);
      } catch (error) {
        throw new Error(`Failed to fetch databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Get detailed information about a specific database
   * 
   * Retrieves complete database metadata including connection details, schema
   * information, and configuration settings. Use this to examine database
   * properties, troubleshoot connections, or understand data source structure.
   * 
   * @param {number} database_id - The ID of the database to retrieve
   * @returns {Promise<string>} JSON string of database object with full metadata
   */
  server.addTool({
    name: "get_database",
    description: "Retrieve detailed information about a specific Metabase database including connection details and schema - use this to examine database properties or troubleshoot connections",
    metadata: { isEssential: true, isRead: true },
    parameters: z.object({
      database_id: z.number().describe("The ID of the database to retrieve"),
    }),
    execute: async (args: { database_id: number }) => {
      try {
        const database = await metabaseClient.getDatabase(args.database_id);
        return JSON.stringify(database, null, 2);
      } catch (error) {
        throw new Error(`Failed to fetch database ${args.database_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Create a new database connection
   * 
   * Adds a new database connection to Metabase with specified engine type,
   * connection details, and sync settings. Use this to connect new data sources,
   * establish analytical pipelines, or expand data access.
   * 
   * @param {string} engine - Database engine type (postgres, mysql, etc.)
   * @param {string} name - Display name for the database
   * @param {object} details - Database connection details (host, port, credentials)
   * @param {boolean} [is_full_sync] - Whether to perform full sync
   * @returns {Promise<string>} JSON string of created database object
   */
  server.addTool({
    name: "create_database",
    description: "Add a new database connection to Metabase - use this to connect new data sources, establish analytical pipelines, or expand data access",
    metadata: { isWrite: true },
    parameters: z.object({
      engine: z.string().describe("Database engine type (e.g., postgres, mysql, redshift)"),
      name: z.string().describe("Display name for the database"),
      details: z.object({
        host: z.string().describe("Database host"),
        port: z.union([z.string(), z.number()]).describe("Database port"),
        db: z.string().describe("Database name"),
        user: z.string().describe("Database username"),
        password: z.string().describe("Database password"),
      }).passthrough().describe("Database connection details"),
      is_full_sync: z.boolean().optional().describe("Whether to perform full sync"),
      is_on_demand: z.boolean().optional().describe("Whether database is on-demand"),
      schedules: z.object({}).passthrough().optional().describe("Sync schedules"),
    }),
    execute: async (args: { engine: string; name: string; details: any; is_full_sync?: boolean; is_on_demand?: boolean; schedules?: any }) => {
      try {
        const database = await metabaseClient.createDatabase(args);
        return JSON.stringify(database, null, 2);
      } catch (error) {
        throw new Error(`Failed to create database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Update database configuration and settings
   * 
   * Modifies database properties including name, connection details, sync schedules,
   * and operational settings. Use this to maintain database connections, update
   * credentials, or modify sync behavior for data freshness.
   * 
   * @param {number} database_id - The ID of the database to update
   * @param {string} [name] - New display name for the database
   * @param {string} [engine] - Database engine type (postgres, mysql, etc.)
   * @param {Object} [details] - Updated database connection details
   * @param {boolean} [is_full_sync] - Whether to perform full sync
   * @param {boolean} [is_on_demand] - Whether database is on-demand
   * @param {Object} [schedules] - Updated sync schedules
   * @returns {Promise<string>} JSON string of the updated database object
   */
  server.addTool({
    name: "update_database",
    description: "Update database configuration including name, connection details, and sync settings - use this to maintain connections, update credentials, or modify sync behavior",
    metadata: { isWrite: true },
    parameters: z.object({
      database_id: z.number().describe("The ID of the database to update"),
      name: z.string().optional().describe("New display name for the database"),
      engine: z.string().optional().describe("Database engine type"),
      details: z.object({}).passthrough().optional().describe("Updated database connection details"),
      is_full_sync: z.boolean().optional().describe("Whether to perform full sync"),
      is_on_demand: z.boolean().optional().describe("Whether database is on-demand"),
      schedules: z.object({}).passthrough().optional().describe("Updated sync schedules"),
    }),
    execute: async (args: { database_id: number; [key: string]: any }) => {
      try {
        const { database_id, ...updates } = args;
        const database = await metabaseClient.updateDatabase(database_id, updates);
        return JSON.stringify(database, null, 2);
      } catch (error) {
        throw new Error(`Failed to update database ${args.database_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Remove a database from Metabase
   * 
   * Permanently removes a database connection from Metabase, including all
   * associated metadata, questions, and dashboards. This action cannot be undone.
   * Use with caution as it will break any content dependent on this database.
   * 
   * @param {number} database_id - The ID of the database to delete
   * @returns {Promise<string>} JSON string confirming deletion status
   */
  server.addTool({
    name: "delete_database",
    description: "Permanently remove a database from Metabase - use with caution as this will break dependent content and cannot be undone",
    metadata: { isWrite: true },
    parameters: z.object({
      database_id: z.number().describe("The ID of the database to delete"),
    }),
    execute: async (args: { database_id: number }) => {
      try {
        await metabaseClient.deleteDatabase(args.database_id);
        return JSON.stringify({
          database_id: args.database_id,
          action: "deleted",
          status: "success"
        }, null, 2);
      } catch (error) {
        throw new Error(`Failed to delete database ${args.database_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Validate database connection details
   * 
   * Tests database connection parameters without creating a permanent connection.
   * Use this to verify credentials, network connectivity, and database accessibility
   * before adding a database to Metabase.
   * 
   * @param {string} engine - Database engine type (postgres, mysql, redshift, etc.)
   * @param {Object} details - Database connection details to validate
   * @param {string} details.host - Database host address
   * @param {string|number} details.port - Database port number
   * @param {string} details.db - Database name
   * @param {string} details.user - Database username
   * @param {string} details.password - Database password
   * @returns {Promise<string>} JSON string with validation results
   */
  server.addTool({
    name: "validate_database",
    description: "Test database connection parameters before creating - use this to verify credentials, connectivity, and accessibility",
    metadata: { isWrite: true },
    parameters: z.object({
      engine: z.string().describe("Database engine type (e.g., postgres, mysql, redshift)"),
      details: z.object({
        host: z.string().describe("Database host"),
        port: z.union([z.string(), z.number()]).describe("Database port"),
        db: z.string().describe("Database name"),
        user: z.string().describe("Database username"),
        password: z.string().describe("Database password"),
      }).passthrough().describe("Database connection details to validate"),
    }),
    execute: async (args: { engine: string; details: any }) => {
      try {
        const result = await metabaseClient.validateDatabase(args.engine, args.details);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(`Failed to validate database connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Add Metabase sample database
   * 
   * Adds the built-in Metabase sample database with demo data for testing
   * and learning purposes. The sample database contains example tables
   * and data that can be used to explore Metabase features.
   * 
   * @returns {Promise<string>} JSON string of the created sample database
   */
  server.addTool({
    name: "add_sample_database",
    description: "Add the built-in Metabase sample database with demo data - use this for testing, learning, or exploring Metabase features",
    execute: async () => {
      try {
        const database = await metabaseClient.addSampleDatabase();
        return JSON.stringify(database, null, 2);
      } catch (error) {
        throw new Error(`Failed to add sample database: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Check database health and connectivity
   * 
   * Performs a health check on a database connection to verify it's accessible
   * and responding properly. Use this to diagnose connection issues, monitor
   * database status, or troubleshoot sync problems.
   * 
   * @param {number} database_id - The ID of the database to check
   * @returns {Promise<string>} JSON string with health check results
   */
  server.addTool({
    name: "check_database_health",
    description: "Perform health check on database connection - use this to diagnose issues, monitor status, or troubleshoot sync problems",
    parameters: z.object({
      database_id: z.number().describe("The ID of the database to check"),
    }),
    execute: async (args: { database_id: number }) => {
      try {
        const result = await metabaseClient.checkDatabaseHealth(args.database_id);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(`Failed to check database health for ${args.database_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Get complete database metadata
   * 
   * Retrieves comprehensive metadata for a database including all tables,
   * fields, data types, and relationships. Use this to understand database
   * structure, explore available data, or build dynamic queries.
   * 
   * @param {number} database_id - The ID of the database
   * @returns {Promise<string>} JSON string with complete database metadata
   */
  server.addTool({
    name: "get_database_metadata",
    description: "Retrieve comprehensive database metadata including tables, fields, and relationships - use this to understand structure or build dynamic queries",
    parameters: z.object({
      database_id: z.number().describe("The ID of the database"),
    }),
    execute: async (args: { database_id: number }) => {
      try {
        const metadata = await metabaseClient.getDatabaseMetadata(args.database_id);
        return JSON.stringify(metadata, null, 2);
      } catch (error) {
        throw new Error(`Failed to fetch metadata for database ${args.database_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * List all schemas in a database
   * 
   * Retrieves all schema names available in a database. Schemas are logical
   * groupings of tables and other database objects. Use this to explore
   * database organization or navigate multi-schema databases.
   * 
   * @param {number} database_id - The ID of the database
   * @returns {Promise<string>} JSON string of schema names array
   */
  server.addTool({
    name: "list_database_schemas",
    description: "Retrieve all schema names in a database - use this to explore database organization or navigate multi-schema databases",
    parameters: z.object({
      database_id: z.number().describe("The ID of the database"),
    }),
    execute: async (args: { database_id: number }) => {
      try {
        const schemas = await metabaseClient.getDatabaseSchemas(args.database_id);
        return JSON.stringify(schemas, null, 2);
      } catch (error) {
        throw new Error(`Failed to fetch schemas for database ${args.database_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Get specific schema details
   * 
   * Retrieves detailed information about a specific schema including all
   * tables, views, and other objects within that schema. Use this to explore
   * schema contents or understand table organization within a schema.
   * 
   * @param {number} database_id - The ID of the database
   * @param {string} schema_name - The name of the schema to examine
   * @returns {Promise<string>} JSON string with schema details and contents
   */
  server.addTool({
    name: "get_database_schema",
    description: "Retrieve detailed information about a specific schema including tables and objects - use this to explore schema contents or understand organization",
    parameters: z.object({
      database_id: z.number().describe("The ID of the database"),
      schema_name: z.string().describe("The name of the schema"),
    }),
    execute: async (args: { database_id: number; schema_name: string }) => {
      try {
        const schema = await metabaseClient.getDatabaseSchema(args.database_id, args.schema_name);
        return JSON.stringify(schema, null, 2);
      } catch (error) {
        throw new Error(`Failed to fetch schema ${args.schema_name} for database ${args.database_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Execute SQL query against a database
   * 
   * Runs a native SQL query against a specified database and returns the results.
   * Use this to perform custom data analysis, run complex queries, or extract
   * specific data that isn't available through existing cards or dashboards.
   * 
   * @param {number} database_id - The ID of the database to query against
   * @param {string} query - The SQL query to execute
   * @param {Array} [parameters] - Optional query parameters for parameterized queries
   * @returns {Promise<string>} JSON string with query results and metadata
   */
  server.addTool({
    name: "execute_query",
    description: "Execute a native SQL query against a Metabase database - use this for custom data analysis, complex queries, or extracting specific data not available through existing cards",
    metadata: { isEssential: true},
    parameters: z.object({
      database_id: z.number().describe("The ID of the database to query against"),
      query: z.string().describe("The SQL query to execute"),
      parameters: z.array(z.any()).optional().describe("Optional query parameters for parameterized queries"),
    }),
    execute: async (args: { database_id: number; query: string; parameters?: any[] }) => {
      try {
        const result = await metabaseClient.executeQuery(args.database_id, args.query, args.parameters || []);
        return JSON.stringify(result, null, 2);
      } catch (error) {
        throw new Error(`Failed to execute query on database ${args.database_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });

  /**
   * Trigger database schema synchronization
   * 
   * Initiates a schema sync to update Metabase's metadata cache with the latest
   * database structure. Use this when database schema changes have been made
   * and you need Metabase to recognize new tables, columns, or relationships.
   * 
   * @param {number} database_id - The ID of the database to sync
   * @returns {Promise<string>} JSON string confirming sync initiation and status
   */
  server.addTool({
    name: "sync_database_schema",
    description: "Initiate schema sync to update Metabase metadata cache - use this after database changes to recognize new tables, columns, or relationships",
    parameters: z.object({
      database_id: z.number().describe("The ID of the database to sync"),
    }),
    execute: async (args: { database_id: number }) => {
      try {
        const result = await metabaseClient.syncDatabaseSchema(args.database_id);
        return JSON.stringify({
          database_id: args.database_id,
          action: "schema_sync_triggered",
          status: "success",
          result: result
        }, null, 2);
      } catch (error) {
        throw new Error(`Failed to sync schema for database ${args.database_id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  });
}
