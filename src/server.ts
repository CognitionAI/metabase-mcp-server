#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { MetabaseClient } from "./client/metabase-client.js";
import { loadConfig, validateConfig, isPiiFilterEnabled } from "./utils/config.js";
import { filterPiiFromToolResult } from "./utils/pii-filter.js";
import { addDashboardTools } from "./tools/dashboard-tools.js";
import { addDatabaseTools } from "./tools/database-tools.js";
import { addCardTools } from "./tools/card-tools.js";
import { addTableTools } from "./tools/table-tools.js";
import { addAdditionalTools } from "./tools/additional-tools.js";
import { parseToolFilterOptions } from "./utils/tool-filters.js";

// Parse command line arguments for tool filtering
const filterOptions = parseToolFilterOptions();
const piiFilterEnabled = isPiiFilterEnabled();

// Load and validate configuration
const config = loadConfig();
validateConfig(config);

// Initialize Metabase client
const metabaseClient = new MetabaseClient(config);

// Create FastMCP server
const server = new FastMCP({
  name: "metabase-server",
  version: "2.0.1",
});

// Override addTool to apply filtering and PII redaction
const originalAddTool = server.addTool.bind(server);
server.addTool = function(toolConfig: any) {
  const { metadata = {}, ...restConfig } = toolConfig;
  const { isWrite, isEssential, isRead } = metadata;

  // Apply filtering based on selected mode
  switch (filterOptions.mode) {
    case 'essential':
      if (!isEssential) return;
      break;
    case 'write':
      if (!isRead && !isWrite) return;
      break;
    case 'all':
      break;
  }

  // Wrap execute with PII filter
  if (restConfig.execute) {
    const originalExecute = restConfig.execute;
    restConfig.execute = async (...args: any[]) => {
      const result = await originalExecute(...args);
      if (!piiFilterEnabled || typeof result !== 'string') return result;
      try {
        return filterPiiFromToolResult(result);
      } catch (e) {
        console.error('[pii-filter] Warning: filter failed, returning original result', e);
        return result;
      }
    };
  }

  // Register the tool
  originalAddTool(restConfig);
};

// Adding all tools to the server
addDashboardTools(server, metabaseClient);
addDatabaseTools(server, metabaseClient);
addCardTools(server, metabaseClient);
addTableTools(server, metabaseClient);
addAdditionalTools(server, metabaseClient);

// Log filtering status
console.error(`INFO: Tool filtering mode: ${filterOptions.mode} ${filterOptions.mode === 'essential' ? '(default)' : ''}`);

switch (filterOptions.mode) {
  case 'essential':
    console.error(`INFO: Only essential tools loaded. Use --all to load all tools.`);
    break;
  case 'write':
    console.error(`INFO: Read and write tools loaded.`);
    break;
  case 'all':
    console.error(`INFO: All tools loaded.`);
    break;
}
console.error(`INFO: PII filter: ${piiFilterEnabled ? 'enabled' : 'disabled (METABASE_PII_FILTER=false)'}`);

// Start the server
server.start({
  transportType: "stdio",
});