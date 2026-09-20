/**
 * Tool filtering utilities for --write, --essential, and --all flags
 */

export interface ToolFilterOptions {
  mode: 'essential' | 'all' | 'write';
}

/**
 * Parse command line arguments for tool filtering options
 * Default mode is 'essential' unless another flag is specified
 */
export function parseToolFilterOptions(): ToolFilterOptions {
  const args = process.argv.slice(2);

  // Do not silently replace the removed read-only mode with another tool set.
  if (args.includes('--read')) {
    throw new Error(
      '--read is no longer supported. No read-only mode is available. ' +
      'Choose --essential, --write (read and write tools), or --all explicitly.'
    );
  }
  
  // Check for explicit mode flags in priority order
  if (args.includes('--all')) {
    return { mode: 'all' };
  }
  if (args.includes('--write')) {
    return { mode: 'write' };
  }
  if (args.includes('--essential')) {
    return { mode: 'essential' };
  }
  
  // Default to essential mode
  return { mode: 'essential' };
}
