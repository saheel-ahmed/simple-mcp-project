# Simple MCP Server Demo 🚀

A full-featured demonstration project for the **Model Context Protocol (MCP)** built with TypeScript and `@modelcontextprotocol/sdk`.

This project showcases all three primary primitives of the MCP standard:
1. 🛠️ **Tools** — Functions and actions executed by the AI model.
2. 📄 **Resources** — Data sources and context attachments read by the AI model via URIs.
3. 💬 **Prompts** — Reusable, parameterized prompt templates and workflows.

It is structured to run both **locally via Stdio** (for Claude Desktop, IDEs, Inspector) and **in the cloud on Vercel as a Serverless API** (using Web Standards Streamable HTTP transport).

---

## 🌟 Features Included

### 1. Tools
- `get_greeting`: Greets a user by name with a friendly message.
- `calculate`: Performs arithmetic operations (`add`, `subtract`, `multiply`, `divide`, `power`) with safety checks (e.g. division by zero).
- `fetch_weather`: Fetches live, real-time weather forecasts for any city worldwide using the free Open-Meteo REST API (no API key required).
- `add_note`: Creates and stores a note in server memory with a custom ID.
- `list_notes`: Lists all notes currently stored in server memory.

### 2. Resources
- **Static Resource** (`system://info`): Returns host OS, Node.js version, memory usage, uptime, and timestamp in JSON format.
- **Dynamic Resource Template** (`notes://{id}`): Reads specific note details and markdown content dynamically by ID.

### 3. Prompts
- `code_review`: A structured code review prompt template that instructs the LLM to inspect code for security, performance, readability, and recommendations.
- `summarize_notes`: A prompt template that pulls all stored server notes and asks the model for an executive summary.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm

### Installation
```bash
npm install
```

### Run Local Automated Test Suite
```bash
npm test
```

### Type Checking & Building
```bash
# Type check without emitting files
npm run typecheck

# Build to dist/ directory
npm run build
```

---

## 🔍 Testing Interactively with MCP Inspector

The official MCP Inspector provides an interactive web UI to test and debug your MCP server:

```bash
npx @modelcontextprotocol/inspector tsx src/index.ts
```

Once running, open the URL provided in your terminal (usually `http://localhost:5173`) to test:
- **Tools tab**: Execute `calculate`, `fetch_weather` (e.g. city: `"Tokyo"`), `add_note`, and `list_notes`.
- **Resources tab**: Read `system://info` or `notes://welcome`.
- **Prompts tab**: Test the `code_review` and `summarize_notes` templates.

---

## 🔌 Connecting to Local MCP Clients (Claude Desktop)

Add the following to your `claude_desktop_config.json`:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "simple-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "/Users/saheel-ahmed/Projects/demos/saheel-git-repo/simple-mcp-project/src/index.ts"
      ]
    }
  }
}
```

---

## ☁️ Deploying to Vercel

This repository includes a serverless endpoint ready for Vercel in [api/index.ts](file:///Users/saheel-ahmed/Projects/demos/saheel-git-repo/simple-mcp-project/api/index.ts) using `WebStandardStreamableHTTPServerTransport`.

### Deploy using Vercel CLI
```bash
npx vercel
```
Follow the interactive prompts to link and deploy your project.

### Or Deploy via GitHub
1. Push this repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Click **Deploy**.

Once deployed, your remote MCP server endpoint will be live at:
```
https://<your-project-name>.vercel.app/api
```

Remote MCP clients can connect to this URL using the SSE/Streamable HTTP transport!

---

## 📂 Project Structure

```
simple-mcp-project/
├── api/
│   └── index.ts          # Vercel Serverless Function entrypoint (HTTP / Web Standards)
├── src/
│   ├── index.ts          # Local entrypoint (Stdio transport)
│   ├── server.ts         # MCP Server definition (Tools, Resources, Prompts)
│   └── test-client.ts    # Automated integration test suite
├── tsconfig.json         # TypeScript configuration
├── vercel.json           # Vercel routing configuration
├── package.json          # Dependencies, scripts, and build setup
└── README.md             # Project documentation
```
