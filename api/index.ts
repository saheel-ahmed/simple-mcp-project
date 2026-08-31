import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createMcpServer } from "../src/server.js";

// Stateless transport for serverless HTTP environments (Vercel)
const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode for serverless functions
    enableJsonResponse: true,
});

const server = createMcpServer();
await server.connect(transport);

export async function GET(request: Request): Promise<Response> {
    return transport.handleRequest(request);
}

export async function POST(request: Request): Promise<Response> {
    return transport.handleRequest(request);
}

export async function DELETE(request: Request): Promise<Response> {
    return transport.handleRequest(request);
}

export default async function handler(request: Request): Promise<Response> {
    return transport.handleRequest(request);
}
