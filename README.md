# IDE AI Memory Layer

A Model Context Protocol (MCP) server that provides a persistent memory layer for AI assistants in IDEs like Cursor, VS Code (via RooCode/Cline), and others.

## Prerequisites

This project is built using [Bun](https://bun.com/). If you don't have Bun installed, run:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Kellie-Brighty/ide-ai-memory-layer-by-kellie.git
cd ide-ai-memory-layer-by-kellie
bun install
```

## Running the Server

To start the MCP server manually:

```bash
bun run index.ts
```

## Connecting to Your IDE

### For Cursor

1. Open Cursor Settings (Cmd/Ctrl + ,)
2. Go to **Features** > **MCP Servers**
3. Click **+ Add New MCP Server**
4. Fill in the details:
   - **Name:** `ai-memory-layer` (or any name you prefer)
   - **Type:** `command`
   - **Command:** `bun run /absolute/path/to/ide-ai-memory-layer-by-kellie/index.ts`
     *(Replace with the actual absolute path to where you cloned the repo)*
5. Click **Save** and verify the green dot appears to indicate a successful connection.

### For VS Code (using RooCode / Cline)

1. Open the **MCP Servers** configuration from the extension's sidebar.
2. Click **Configure MCP Servers** to edit the `cline_mcp_settings.json` file.
3. Add the following entry to your `mcpServers` configuration:

```json
{
  "mcpServers": {
    "ai-memory-layer": {
      "command": "bun",
      "args": [
        "run",
        "/absolute/path/to/ide-ai-memory-layer-by-kellie/index.ts"
      ]
    }
  }
}
```
*(Remember to replace the path with your actual absolute path)*
4. Save the configuration and restart the extension if necessary.
