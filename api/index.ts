import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

interface Note {
    id: string;
    title: string;
    content: string;
    createdAt: string;
}

function createServer(): McpServer {
    const server = new McpServer({
        name: "demo-mcp-server",
        version: "1.0.0",
    });

    const notes = new Map<string, Note>([
        [
            "welcome",
            {
                id: "welcome",
                title: "Welcome Note",
                content: "Welcome to your demo MCP Server deployed live on Vercel!",
                createdAt: new Date().toISOString(),
            },
        ],
    ]);

    // Tool 1: Greeting
    server.tool(
        "get_greeting",
        "Returns a personalized welcome message.",
        { name: z.string().describe("The name of the person to greet") },
        async ({ name }) => ({
            content: [{ type: "text", text: `Hello ${name}! Welcome to the Model Context Protocol (MCP) 🚀` }],
        })
    );

    // Tool 2: Calculator
    server.tool(
        "calculate",
        "Performs arithmetic operations (add, subtract, multiply, divide, power).",
        {
            operation: z.enum(["add", "subtract", "multiply", "divide", "power"]),
            a: z.number(),
            b: z.number(),
        },
        async ({ operation, a, b }) => {
            let result: number;
            switch (operation) {
                case "add": result = a + b; break;
                case "subtract": result = a - b; break;
                case "multiply": result = a * b; break;
                case "divide":
                    if (b === 0) return { isError: true, content: [{ type: "text", text: "Error: Division by zero" }] };
                    result = a / b;
                    break;
                case "power": result = Math.pow(a, b); break;
            }
            return { content: [{ type: "text", text: `${a} ${operation} ${b} = ${result}` }] };
        }
    );

    // Tool 3: Live Weather Lookup
    server.tool(
        "fetch_weather",
        "Fetches live weather forecast for any city using Open-Meteo.",
        { city: z.string().describe("City name") },
        async ({ city }) => {
            try {
                const geoRes = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
                );
                const geoData = (await geoRes.json()) as any;
                if (!geoData.results || geoData.results.length === 0) {
                    return { isError: true, content: [{ type: "text", text: `City '${city}' not found.` }] };
                }
                const loc = geoData.results[0];
                const weatherRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m`
                );
                const data = (await weatherRes.json()) as any;
                const c = data.current;
                const u = data.current_units;
                const summary = [
                    `📍 Weather in ${loc.name}, ${loc.country || ""}:`,
                    `• Temperature: ${c.temperature_2m} ${u.temperature_2m} (Feels like: ${c.apparent_temperature} ${u.apparent_temperature})`,
                    `• Humidity: ${c.relative_humidity_2m} ${u.relative_humidity_2m}`,
                    `• Wind Speed: ${c.wind_speed_10m} ${u.wind_speed_10m}`,
                ].join("\n");
                return { content: [{ type: "text", text: summary }] };
            } catch (err) {
                return { isError: true, content: [{ type: "text", text: `Weather error: ${String(err)}` }] };
            }
        }
    );

    // Tool 4: Add Note
    server.tool(
        "add_note",
        "Stores a new note in server memory.",
        { id: z.string(), title: z.string(), content: z.string() },
        async ({ id, title, content }) => {
            notes.set(id, { id, title, content, createdAt: new Date().toISOString() });
            return { content: [{ type: "text", text: `Note '${title}' (ID: ${id}) saved!` }] };
        }
    );

    // Tool 5: List Notes
    server.tool("list_notes", "Lists all available notes.", {}, async () => {
        const list = Array.from(notes.values()).map((n) => `• [${n.id}] ${n.title}`);
        return { content: [{ type: "text", text: list.length > 0 ? list.join("\n") : "No notes." }] };
    });

    // Static Resource: System Info
    server.resource(
        "system-info",
        "system://info",
        { description: "System runtime info", mimeType: "application/json" },
        async (uri) => ({
            contents: [
                {
                    uri: uri.href,
                    mimeType: "application/json",
                    text: JSON.stringify(
                        {
                            runtime: "Vercel Serverless Function (Node.js)",
                            timestamp: new Date().toISOString(),
                        },
                        null,
                        2
                    ),
                },
            ],
        })
    );

    // Dynamic Resource: Note by ID
    server.resource(
        "note-by-id",
        new ResourceTemplate("notes://{id}", { list: undefined }),
        { description: "Note by ID", mimeType: "text/plain" },
        async (uri, vars) => {
            const note = notes.get(String(vars.id));
            return {
                contents: [
                    {
                        uri: uri.href,
                        mimeType: "text/plain",
                        text: note ? `# ${note.title}\n\n${note.content}` : "Note not found.",
                    },
                ],
            };
        }
    );

    // Prompt 1: Code Review
    server.prompt(
        "code_review",
        "Code review template.",
        { code: z.string(), language: z.string().optional() },
        async ({ code, language }) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `Please review this ${language || "code"}:\n\n\`\`\`${language || ""}\n${code}\n\`\`\``,
                    },
                },
            ],
        })
    );

    // Prompt 2: Summarize Notes
    server.prompt("summarize_notes", "Summarizes all notes.", {}, async () => {
        const all = Array.from(notes.values()).map((n) => `[${n.title}]: ${n.content}`).join("\n");
        return {
            messages: [{ role: "user", content: { type: "text", text: `Summarize these notes:\n\n${all}` } }],
        };
    });

    return server;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
    try {
        // Set CORS headers for remote MCP clients
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, mcp-session-id, last-event-id");

        if (req.method === "OPTIONS") {
            res.statusCode = 204;
            res.end();
            return;
        }

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
    .container { max-width: 720px; width: 100%; }
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
    h1 { margin-top: 0.8rem; font-size: 1.8rem; }
    p { line-height: 1.6; color: #8b949e; }
    h2 {
      font-size: 1.15rem;
      color: var(--accent);
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.4rem;
      margin-top: 1.5rem;
    }
    ul { padding-left: 1.2rem; line-height: 1.8; }
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
      <p>This MCP server is live and running on Vercel Serverless. AI clients (Claude, Cursor, Antigravity) can connect via Streamable HTTP / SSE.</p>
      
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

        // In stateless mode for Serverless Functions, create a fresh transport per request
        const transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
            enableJsonResponse: true,
        });
        const server = createServer();
        await server.connect(transport);
        await transport.handleRequest(req, res);
    } catch (error) {
        console.error("Handler error:", error);
        if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(
                JSON.stringify({
                    jsonrpc: "2.0",
                    error: {
                        code: -32603,
                        message: error instanceof Error ? error.message : String(error),
                    },
                    id: null,
                })
            );
        }
    }
}
