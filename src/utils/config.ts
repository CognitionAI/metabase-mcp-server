/**
 * Configuration utilities for the Metabase MCP Server
 */

import { MetabaseConfig } from "../types/metabase.js";

/**
 * Load configuration from environment variables
 */
const HEADER_PREFIX = "METABASE_HEADER_";

function loadExtraHeaders(): Record<string, string> | undefined {
  const headers: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(HEADER_PREFIX) && value !== undefined) {
      // METABASE_HEADER_X_CUSTOM_HEADER → X-Custom-Header
      const headerName = key.slice(HEADER_PREFIX.length).replace(/_/g, "-");
      headers[headerName] = value;
    }
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}

export function loadConfig(): MetabaseConfig {
  const url = process.env.METABASE_URL;
  const username = process.env.METABASE_USERNAME;
  const password = process.env.METABASE_PASSWORD;
  const apiKey = process.env.METABASE_API_KEY;

  if (!url) {
    throw new Error("METABASE_URL environment variable is required");
  }

  if (!apiKey && (!username || !password)) {
    throw new Error(
      "Either (METABASE_URL and METABASE_API_KEY) or (METABASE_URL, METABASE_USERNAME, and METABASE_PASSWORD) environment variables are required"
    );
  }

  return {
    url,
    username,
    password,
    apiKey,
    extraHeaders: loadExtraHeaders(),
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: MetabaseConfig): void {
  if (!config.url) {
    throw new Error("Metabase URL is required");
  }

  if (!config.apiKey && (!config.username || !config.password)) {
    throw new Error(
      "Either API key or username/password combination is required"
    );
  }

  // Validate URL format
  try {
    new URL(config.url);
  } catch (error) {
    throw new Error("Invalid Metabase URL format");
  }
}

/**
 * Check if PII filtering is enabled
 */
export function isPiiFilterEnabled(): boolean {
  return process.env.METABASE_PII_FILTER !== 'false';
}
