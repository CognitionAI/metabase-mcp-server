/**
 * TypeScript types for Metabase API responses and requests
 */

export interface MetabaseConfig {
  url: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  collection_id?: number;
  archived?: boolean;
  parameters?: any[];
  cards?: DashboardCard[];
  dashcards?: DashboardCard[]; // Metabase API actually returns 'dashcards', not 'cards'
}

export interface DashboardCard {
  id: number;
  card_id: number;
  dashboard_id: number;
  row: number;
  col: number;
  sizeX: number;
  sizeY: number;
  parameter_mappings?: any[];
  visualization_settings?: any;
}

export interface Card {
  id: number;
  name: string;
  description?: string;
  collection_id?: number;
  archived?: boolean;
  dataset_query: any;
  display: string;
  visualization_settings: any;
}

export interface Database {
  id: number;
  name: string;
  engine: string;
  details: any;
  auto_run_queries?: boolean;
  is_full_sync?: boolean;
}

export interface Collection {
  id: number;
  name: string;
  description?: string;
  color?: string;
  parent_id?: number;
  archived?: boolean;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active?: boolean;
  is_superuser?: boolean;
  group_ids?: number[];
}

export interface Table {
  id: number;
  name: string;
  display_name?: string;
  description?: string | null;
  database_id: number;
  schema?: string;
  visibility_type?: TableVisibilityType;
  field_order?: TableFieldOrder;
}

// From Metabase API: visibility_type is nullable enum of technical, hidden, cruft
export type TableVisibilityType = 'technical' | 'hidden' | 'cruft';
// field_order observed value: 'database'
export type TableFieldOrder = 'database' | 'alphabetical' | 'custom' | 'smart';

export interface TableUpdatePayload {
  display_name?: string;
  description?: string | null;
  visibility_type?: TableVisibilityType;
  field_order?: TableFieldOrder;
}

export interface Field {
  id: number;
  name: string;
  display_name?: string;
  table_id: number;
  database_type: string;
  base_type: string;
}

export interface PermissionGroup {
  id: number;
  name: string;
}

export interface QueryResult {
  data: any;
  status: string;
  row_count?: number;
  running_time?: number;
}

export interface ToolFilterOptions {
  includeWriteTools: boolean;
  includeEssential: boolean;
}
