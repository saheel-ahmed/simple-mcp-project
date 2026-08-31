import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

// Initialize server instance
const server = createMcpServer();

// Start local stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);