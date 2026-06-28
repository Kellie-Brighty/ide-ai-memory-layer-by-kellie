import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as path from "path";
import { mkdirSync, existsSync } from "fs";

// Initialize the MCP Server
const server = new McpServer({
  name: "antigravity-project-memory",
  version: "1.0.0",
});

const MEMORY_FILE_NAME = ".ai_memory.md";
const BACKUP_DIR_NAME = ".ai_memory_backups";

// Template initialized if a project file doesn't exist yet
const INITIAL_TEMPLATE = `# Project State & Memory

## Current Objective
- [ ] *No goal set yet. Please define your current technical objective.*

## Technical Stack & Constraints
- Runtime/Tools: Bun, TypeScript

## Progress & Recent Actions
- [x] Initialized workspace persistence layer via MCP.

## Discovered Gotchas / Context Notes
- *Add key architectural details or breaking changes here.*
`;

/**
 * Helper to ensure paths are absolute and safely formatted
 */
function getMemoryPaths(projectPath: string) {
  const resolvedPath = path.resolve(projectPath);
  return {
    memoryFilePath: path.join(resolvedPath, MEMORY_FILE_NAME),
    backupDirPath: path.join(resolvedPath, BACKUP_DIR_NAME),
  };
}

// ==========================================
// TOOL 1: Get or Initialize Project Memory
// ==========================================
server.tool(
  "get_project_memory",
  "Retrieves the persistent project memory file. Run this immediately at the start of a prompt to recover context.",
  {
    project_path: z.string().describe("The absolute path to the project root directory."),
  },
  async ({ project_path }) => {
    try {
      const { memoryFilePath } = getMemoryPaths(project_path);
      const file = Bun.file(memoryFilePath);

      // If file doesn't exist, seed it with a baseline template
      if (!(await file.exists())) {
        await Bun.write(memoryFilePath, INITIAL_TEMPLATE);
        return {
          content: [
            {
              type: "text",
              text: `No memory file found. Created a clean state baseline at ${memoryFilePath}:\n\n${INITIAL_TEMPLATE}`,
            },
          ],
        };
      }

      // Read and return the current state
      const content = await file.text();
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to read memory: ${error.message}` }],
      };
    }
  }
);

// ==========================================
// TOOL 2: Update Project Memory & Rotate Backups
// ==========================================
server.tool(
  "update_project_memory",
  "Appends new accomplishments and information to the project memory file without rewriting the whole file. Run this right before sending your final response to log progress.",
  {
    project_path: z.string().describe("The absolute path to the project root directory."),
    new_progress: z.string().describe("Markdown content detailing the most recent accomplishments and new information to append."),
  },
  async ({ project_path, new_progress }) => {
    try {
      const { memoryFilePath, backupDirPath } = getMemoryPaths(project_path);
      const currentFile = Bun.file(memoryFilePath);

      let oldContent = "";

      // 1. Create rotating backups if an older state exists to prevent data corruption
      if (await currentFile.exists()) {
        oldContent = await currentFile.text();
        
        // Ensure backup directory exists safely
        if (!existsSync(backupDirPath)) {
          mkdirSync(backupDirPath, { recursive: true });
        }

        // Shift backup states (maintaining a 3-generation backup history)
        for (let i = 2; i >= 1; i--) {
          const oldBackup = Bun.file(path.join(backupDirPath, `memory.v${i}.md`));
          if (await oldBackup.exists()) {
            await Bun.write(path.join(backupDirPath, `memory.v${i + 1}.md`), oldBackup);
          }
        }
        // Write the previous state as v1
        await Bun.write(path.join(backupDirPath, "memory.v1.md"), oldContent);
      }

      // 2. Append the new progress state to the main file
      const timestamp = new Date().toLocaleString();
      const finalContent = (oldContent ? oldContent.trim() : INITIAL_TEMPLATE.trim()) + `\n\n### Update: ${timestamp}\n${new_progress}\n`;

      await Bun.write(memoryFilePath, finalContent);

      return {
        content: [{ type: "text", text: `Successfully updated memory file at ${MEMORY_FILE_NAME} and rotated state backups.` }],
      };
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to update memory: ${error.message}` }],
      };
    }
  }
);

// Start the server using standard input/output transport
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Memory MCP server running over stdio via Bun.");