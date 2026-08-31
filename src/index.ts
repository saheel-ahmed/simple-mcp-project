import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
    name: "simple-mcp-server",
    version: "1.0.0",
});

// Tool 1: Greeting
server.tool(
    "get_greeting",
    {
        name: z.string(),
    },
    async ({ name }) => {
        return {
            content: [
                {
                    type: "text",
                    text: `Hello ${name}! Welcome to MCP 🚀`,
                },
            ],
        };
    }
);

// Tool 2: Add Numbers
server.tool(
    "add_numbers",
    {
        a: z.number(),
        b: z.number(),
    },
    async ({ a, b }) => {
        const result = a + b;

        return {
            content: [
                {
                    type: "text",
                    text: `The result is ${result}`,
                },
            ],
        };
    }
);

// Tool 3: Current Time
server.tool(
    "get_current_time",
    {},
    async () => {
        return {
            content: [
                {
                    type: "text",
                    text: new Date().toISOString(),
                },
            ],
        };
    }
);

// Start MCP Server
const transport = new StdioServerTransport();

await server.connect(transport);