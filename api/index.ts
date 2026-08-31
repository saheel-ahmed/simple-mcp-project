import type { IncomingMessage, ServerResponse } from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "../src/server.js";

// Stateless transport for Vercel Serverless Function
const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode for serverless functions
    enableJsonResponse: true,
});

const server = createMcpServer();
await server.connect(transport);

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    // Set CORS headers for remote MCP clients
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, mcp-session-id, last-event-id");

    if (req.method === "OPTIONS") {
        res.statusCode = 204;
        res.end();
        return;
    }

    // If accessed via a web browser directly, render a clean status landing page
    const acceptHeader = (req.headers["accept"] as string) || "";
    const isBrowserRequest =
        req.method === "GET" &&
        !acceptHeader.includes("text/event-stream") &&
        acceptHeader.includes("text/html");

    if (isBrowserRequest) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        const host = req.headers["host"] || "your-app.vercel.app";
        res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>🚀 Demo MCP Server</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 27, 34, 0.9);
      --border: #30363d;
      --text: #e6edf3;
      --accent: #58a6ff;
      --success: #238636;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: linear-gradient(135deg, var(--bg) 0%, #0d1117 100%);
      color: var(--text);
      margin: 0;
      padding: 2.5rem 1rem;
      display: flex;
      justify-content: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .container {
      max-width: 720px;
      width: 100%;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    .badge {
      display: inline-block;
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      background: var(--success);
      color: #fff;
      font-size: 0.85rem;
      font-weight: 600;
    }
    h1 {
      margin-top: 0.8rem;
      font-size: 1.8rem;
    }
    p {
      line-height: 1.6;
      color: #8b949e;
    }
    h2 {
      font-size: 1.15rem;
      color: var(--accent);
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.4rem;
      margin-top: 1.5rem;
    }
    ul {
      padding-left: 1.2rem;
      line-height: 1.8;
    }
    code {
      background: #161b22;
      border: 1px solid #30363d;
      padding: 0.2rem 0.4rem;
      border-radius: 6px;
      font-size: 0.9rem;
      color: #79c0ff;
    }
    pre {
      background: #0d1117;
      border: 1px solid var(--border);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <span class="badge">● Server Active & Online</span>
      <h1>Model Context Protocol (MCP) Demo</h1>
      <p>This MCP server is live and running as a Serverless Function on Vercel. AI clients (Claude, Cursor, Antigravity) can connect via Streamable HTTP / SSE.</p>
      
      <h2>🛠️ Available Tools</h2>
      <ul>
        <li><code>get_greeting</code>: Returns a personalized greeting.</li>
        <li><code>calculate</code>: Arithmetic calculator (add, subtract, multiply, divide, power).</li>
        <li><code>fetch_weather</code>: Live weather lookup using Open-Meteo REST API.</li>
        <li><code>add_note</code> / <code>list_notes</code>: Note manager stored in server memory.</li>
      </ul>

      <h2>📄 Available Resources</h2>
      <ul>
        <li><code>system://info</code>: Server runtime and host status.</li>
        <li><code>notes://{id}</code>: Dynamic note reader by ID.</li>
      </ul>

      <h2>💬 Available Prompts</h2>
      <ul>
        <li><code>code_review</code>: Multi-point code review template.</li>
        <li><code>summarize_notes</code>: Note synthesis prompt template.</li>
      </ul>

      <h2>🔌 Connect to this MCP Server</h2>
      <pre><code>{
  "mcpServers": {
    "vercel-mcp-server": {
      "url": "https://${host}/api"
    }
  }
}</code></pre>
    </div>
  </div>
</body>
</html>`);
        return;
    }

    // Delegate to MCP Streamable HTTP Transport
    try {
        await transport.handleRequest(req, res);
    } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
                JSON.stringify({
                    jsonrpc: "2.0",
                    error: {
                        code: -32603,
                        message: error instanceof Error ? error.message : "Internal Server Error",
                    },
                    id: null,
                })
            );
        }
    }
}
