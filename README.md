# Readme: Metabase MCP Server

[![npm version](https://img.shields.io/npm/v/@cognitionai/metabase-mcp-server)](https://www.npmjs.com/package/@cognitionai/metabase-mcp-server)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)

A comprehensive Model Context Protocol (MCP) server for Metabase integration, providing AI assistants with full access to Metabase's analytics platform.

## 🚀 Quick Start

```bash
# Install and run with npx
export METABASE_URL=https://your-metabase-instance.com
export METABASE_API_KEY=your_metabase_api_key
npx @cognitionai/metabase-mcp-server
```

## ✨ Features

### 🎯 **81+ Tools Available** - Complete Metabase API Coverage

- **📊 Dashboard Management** (23 tools) - Full CRUD operations, card management, public sharing, embedding
- **📈 Card/Question Management** (21 tools) - Query execution, parameter handling, pivot queries, public links
- **🗄️ Database Management** (13 tools) - Connection management, schema sync, query execution
- **📋 Table Management** (16 tools) - Metadata operations, field management, data operations
- **🔍 Additional Tools** (9 tools) - Collections, search, users, activity tracking, playground links

## 📦 Installation

> **💡 Recommended:** Node.js 20.19.0+ and npm 8.0.0+ for optimal compatibility

### Method 1: NPX (Recommended)
```bash
npx @cognitionai/metabase-mcp-server
```

### Method 2: Global Installation
```bash
npm install -g @cognitionai/metabase-mcp-server
metabase-mcp-server
```

### Method 3: Docker
```bash
docker run -it --rm \
  -e METABASE_URL=https://your-metabase-instance.com \
  -e METABASE_API_KEY=your_metabase_api_key \
  ghcr.io/CognitionAI/metabase-mcp-server
```

## ⚙️ Configuration

### Environment Variables

**API Key Authentication (Preferred):**
```bash
export METABASE_URL=https://your-metabase-instance.com
export METABASE_API_KEY=your_metabase_api_key
```

**Username/Password Authentication (Fallback):**
```bash
export METABASE_URL=https://your-metabase-instance.com
export METABASE_USERNAME=your_username
export METABASE_PASSWORD=your_password
```

### Optional Arguments

The server supports command-line arguments to customize tool loading:

- **`--essential`** (default): Load only essential tools
- **`--all`**: Load all 80+ available tools
- **`--write`**: Load only write/modification tools
- **`--read`**: Load only read-only tools

```bash
# Using published package (recommended)
# Default behavior (essential tools only)
npx @cognitionai/metabase-mcp-server

# Load all tools
npx @cognitionai/metabase-mcp-server --all

# Load only write tools
npx @cognitionai/metabase-mcp-server --write

# Load only read-only tools
npx @cognitionai/metabase-mcp-server --read

# Using local development build
npm run build
node dist/server.js                    # Default (essential tools)
node dist/server.js --all             # All tools
node dist/server.js --write           # Write tools only
node dist/server.js --read            # Read-only tools only
```

## 🔌 Integration Examples

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

**Using published package:**
```json
{
  "mcpServers": {
    "metabase": {
      "command": "npx",
      "args": ["@cognitionai/metabase-mcp-server"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key"
      }
    }
  }
}
```

**Using local development build:**
```json
{
  "mcpServers": {
    "metabase": {
      "command": "node",
      "args": ["/path/to/metabase-mcp-server/dist/server.js"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key"
      }
    }
  }
}
```

**With custom flags:**
```json
{
  "mcpServers": {
    "metabase-all": {
      "command": "npx",
      "args": ["@cognitionai/metabase-mcp-server", "--all"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key"
      }
    }
  }
}
```

### Windsurf IDE

Add to your Windsurf MCP config (`~/.windsurf/mcp_config.json`):

**Using published package:**
```json
{
  "mcpServers": {
    "metabase": {
      "command": "npx",
      "args": ["@cognitionai/metabase-mcp-server"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key"
      }
    }
  }
}
```

**Using local development build:**
```json
{
  "mcpServers": {
    "metabase": {
      "command": "node",
      "args": ["/path/to/metabase-mcp-server/dist/server.js"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key"
      }
    }
  }
}
```

**With custom flags:**
```json
{
  "mcpServers": {
    "metabase-read": {
      "command": "npx",
      "args": ["@cognitionai/metabase-mcp-server", "--read"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key"
      }
    },
    "metabase-write": {
      "command": "npx",
      "args": ["@cognitionai/metabase-mcp-server", "--write"],
      "env": {
        "METABASE_URL": "https://your-metabase-instance.com",
        "METABASE_API_KEY": "your_metabase_api_key"
      }
    }
  }
}
```

## 🛠️ Available Tools

<details>
<summary><strong>📊 Dashboard Management (23 tools)</strong></summary>

### Core Operations
- `list_dashboards` - List all dashboards
- `get_dashboard` - Get dashboard by ID
- `create_dashboard` - Create new dashboard
- `update_dashboard` - Update existing dashboard
- `delete_dashboard` - Delete dashboard
- `copy_dashboard` - Copy dashboard

### Card Management
- `get_dashboard_cards` - Get all cards in dashboard
- `add_card_to_dashboard` - Add card to dashboard
- `remove_card_from_dashboard` - Remove card from dashboard
- `update_dashboard_card` - Update card position/settings
- `execute_dashboard_card` - Execute specific dashboard card

### Public Sharing & Embedding
- `create_public_link` - Create public dashboard link
- `delete_public_link` - Delete public dashboard link
- `list_public_dashboards` - List public dashboards
- `list_embeddable_dashboards` - List embeddable dashboards

### Parameters & Queries
- `get_dashboard_param_values` - Get parameter values
- `search_dashboard_param_values` - Search parameter values
- `get_dashboard_param_remapping` - Get parameter remapping
- `execute_dashboard_query` - Execute dashboard queries

### Advanced Features
- `get_dashboard_related` - Get related content
- `get_dashboard_query_metadata` - Get query metadata
- `update_dashboard_cards` - Bulk update cards
- `save_dashboard` - Save dashboard changes
- `get_dashboard_items` - Get dashboard items

</details>

<details>
<summary><strong>📈 Card/Question Management (21 tools)</strong></summary>

### Core Operations
- `list_cards` - List all cards/questions
- `get_card` - Get card by ID
- `create_card` - Create new card
- `update_card` - Update existing card
- `delete_card` - Delete card
- `copy_card` - Copy card

### Query Execution
- `execute_card` - Execute card query
- `execute_card_query_with_format` - Execute with specific format
- `execute_pivot_card_query` - Execute pivot query
- `get_card_query_metadata` - Get query metadata

### Card Management
- `move_cards` - Move cards between collections
- `move_cards_to_collection` - Bulk move to collection
- `get_card_dashboards` - Get dashboards containing card
- `get_card_series` - Get card series data

### Parameters & Values
- `get_card_param_values` - Get parameter values
- `search_card_param_values` - Search parameter values
- `get_card_param_remapping` - Get parameter remapping

### Public Sharing
- `create_card_public_link` - Create public card link
- `delete_card_public_link` - Delete public card link
- `get_public_cards` - List public cards
- `get_embeddable_cards` - List embeddable cards

</details>

<details>
<summary><strong>🗄️ Database Management (13 tools)</strong></summary>

### Core Operations
- `list_databases` - List all databases
- `get_database` - Get database details
- `create_database` - Create database connection
- `update_database` - Update database settings
- `delete_database` - Delete database connection

### Schema & Metadata
- `get_database_schema_tables` - Get database tables
- `get_database_schemas` - Get database schemas
- `get_database_metadata` - Get complete metadata
- `sync_database_schema` - Sync schema metadata

### Query Operations
- `execute_query` - Execute SQL queries
- `execute_query_export` - Execute and export results

### Maintenance
- `get_database_usage_info` - Get usage statistics
- `rescan_database_field_values` - Rescan field values

</details>

<details>
<summary><strong>📋 Table Management (16 tools)</strong></summary>

### Core Operations
- `list_tables` - List tables with filtering
- `get_table` - Get table details
- `update_table` - Update table configuration
- `update_tables` - Bulk update tables

### Data Operations
- `get_table_data` - Retrieve table data
- `append_csv_to_table` - Append CSV data
- `replace_table_csv` - Replace with CSV data

### Schema & Relationships
- `get_table_query_metadata` - Get query metadata
- `get_table_fks` - Get foreign key relationships
- `get_table_related` - Get related tables
- `sync_table_schema` - Sync table schema

### Field Management
- `reorder_table_fields` - Reorder field display
- `rescan_table_field_values` - Rescan field values
- `discard_table_field_values` - Discard cached values

### Card Integration
- `get_card_table_fks` - Get card table foreign keys
- `get_card_table_query_metadata` - Get card table metadata

</details>

<details>
<summary><strong>🔍 Additional Tools (9 tools)</strong></summary>

### Collections
- `list_collections` - List all collections
- `create_collection` - Create new collection
- `update_collection` - Update collection
- `delete_collection` - Delete collection
- `get_collection_items` - Get collection items

### Search & Discovery
- `search_content` - Search across all content

### Activity & Analytics
- `get_recent_views` - Get recent activity
- `get_popular_items` - Get popular content

### Playground Links
- `get_metabase_playground_link` - Generate interactive playground links

</details>

## 🧪 Development

### Setup
```bash
git clone https://github.com/CognitionAI/metabase-mcp-server.git
cd metabase-mcp-server
npm install
```

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run watch
```

### Debugging
Use the MCP Inspector for debugging:
```bash
npm run inspector
```

## 🔍 Testing Authentication

### API Key Authentication
1. Set `METABASE_URL` and `METABASE_API_KEY`
2. Start server and verify "Using Metabase API Key" in logs
3. Test with `list_dashboards` tool

### Username/Password Authentication
1. Unset `METABASE_API_KEY`
2. Set `METABASE_URL`, `METABASE_USERNAME`, `METABASE_PASSWORD`
3. Start server and verify "Using username/password" in logs
4. Test with `list_dashboards` tool

## 🐛 Troubleshooting

### Common Issues

**Authentication Errors:**
- Verify your Metabase URL is accessible
- Check API key validity in Metabase admin settings
- Ensure username/password credentials are correct

**Connection Issues:**
- Confirm Metabase instance is running
- Check network connectivity
- Verify SSL certificates if using HTTPS

**Tool Execution Errors:**
- Check Metabase permissions for your user/API key
- Verify the requested resource exists
- Review server logs for detailed error messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please visit our [GitHub repository](https://github.com/CognitionAI/metabase-mcp-server) to:

- 🐛 Report bugs
- 💡 Request features  
- 🔧 Submit pull requests
- 📖 Improve documentation

### Development Guidelines

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

## 🆘 Support

- 📚 [Documentation](https://github.com/CognitionAI/metabase-mcp-server/wiki)
- 🐛 [Issue Tracker](https://github.com/CognitionAI/metabase-mcp-server/issues)

---

Built with ❤️ for the world
