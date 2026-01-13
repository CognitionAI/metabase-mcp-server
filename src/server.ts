#!/usr/bin/env node

import { FastMCP } from "fastmcp";
import { MetabaseClient } from "./client/metabase-client.js";
import { loadConfig, validateConfig } from "./utils/config.js";
import { addDashboardTools } from "./tools/dashboard-tools.js";
import { addDatabaseTools } from "./tools/database-tools.js";
import { addCardTools } from "./tools/card-tools.js";
import { addTableTools } from "./tools/table-tools.js";
import { addAdditionalTools } from "./tools/additional-tools.js";
import { parseToolFilterOptions } from "./utils/tool-filters.js";

// Parse command line arguments for tool filtering
const filterOptions = parseToolFilterOptions();

// Load and validate configuration
const config = loadConfig();
validateConfig(config);

// Initialize Metabase client
const metabaseClient = new MetabaseClient(config);

// Create FastMCP server
const server = new FastMCP({
  name: "metabase-server",
  version: "2.0.0",
});

// Override addTool to apply filtering
const originalAddTool = server.addTool.bind(server);
server.addTool = function(toolConfig: any) {
  const { metadata = {}, ...restConfig } = toolConfig;
  const { isWrite, isEssential, isRead } = metadata;

  // Apply filtering based on selected mode
  switch (filterOptions.mode) {
    case 'essential':
      // Only load essential tools
      if (!isEssential) return;
      break;
    case 'write':
      // Only load write tools
      if (!isWrite) return;
      break;
    case 'read':
      // Only load read-only tools
      if (!isRead) return;
      break;
    case 'all':
      // Load all tools - no filtering
      break;
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
    console.error(`INFO: Only write/modification tools loaded.`);
    break;
  case 'read':
    console.error(`INFO: Only read-only tools loaded.`);
    break;
  case 'all':
    console.error(`INFO: All tools loaded.`);
    break;
}

// Start the server
server.start({
  transportType: "stdio",
});