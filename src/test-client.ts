import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runTests() {
    console.log("🚀 Starting MCP Server Local Integration Test...\n");

    const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", "src/stdio.ts"],
    });

    const client = new Client(
        {
            name: "test-client",
            version: "1.0.0",
        },
        {
            capabilities: {},
        }
    );

    try {
        await client.connect(transport);
        console.log("✅ Successfully connected to MCP server via stdio transport!\n");

        // 1. Test Tools Listing
        console.log("--- 1. Testing Tools Listing ---");
        const toolsResult = await client.listTools();
        console.log(`Found ${toolsResult.tools.length} tools:`, toolsResult.tools.map((t) => t.name).join(", "));
        console.log("✅ listTools passed.\n");

        // 2. Test Tool Execution: get_greeting
        console.log("--- 2. Testing Tool: get_greeting ---");
        const greetingRes = await client.callTool({
            name: "get_greeting",
            arguments: { name: "Alice" },
        });
        console.log("Output:", JSON.stringify(greetingRes.content));
        console.log("✅ get_greeting passed.\n");

        // 3. Test Tool Execution: calculate
        console.log("--- 3. Testing Tool: calculate (multiply 6 * 7) ---");
        const calcRes = await client.callTool({
            name: "calculate",
            arguments: { operation: "multiply", a: 6, b: 7 },
        });
        console.log("Output:", JSON.stringify(calcRes.content));
        console.log("✅ calculate passed.\n");

        // 4. Test Tool Execution: fetch_weather
        console.log("--- 4. Testing Tool: fetch_weather (Paris) ---");
        const weatherRes = await client.callTool({
            name: "fetch_weather",
            arguments: { city: "Paris" },
        });
        console.log("Output:\n" + (weatherRes.content as any)[0]?.text);
        console.log("✅ fetch_weather passed.\n");

        // 5. Test Tool Execution: add_note & list_notes
        console.log("--- 5. Testing Note Tools ---");
        await client.callTool({
            name: "add_note",
            arguments: {
                id: "demo-test",
                title: "Integration Test Note",
                content: "This note was added by the automated test suite.",
            },
        });
        const listNotesRes = await client.callTool({
            name: "list_notes",
            arguments: {},
        });
        console.log("Output:\n" + (listNotesRes.content as any)[0]?.text);
        console.log("✅ add_note & list_notes passed.\n");

        // 6. Test Resources
        console.log("--- 6. Testing Resources ---");
        const resourcesList = await client.listResources();
        console.log(`Found ${resourcesList.resources.length} static resources:`, resourcesList.resources.map((r) => r.uri).join(", "));
        
        const sysInfoRes = await client.readResource({ uri: "system://info" });
        console.log("system://info content:\n" + (sysInfoRes.contents as any)[0]?.text);

        const noteRes = await client.readResource({ uri: "notes://demo-test" });
        console.log("notes://demo-test content:\n" + (noteRes.contents as any)[0]?.text);
        console.log("✅ Resources passed.\n");

        // 7. Test Prompts
        console.log("--- 7. Testing Prompts ---");
        const promptsList = await client.listPrompts();
        console.log(`Found ${promptsList.prompts.length} prompts:`, promptsList.prompts.map((p) => p.name).join(", "));

        const codeReviewPrompt = await client.getPrompt({
            name: "code_review",
            arguments: { code: "function add(a, b) { return a + b; }", language: "javascript" },
        });
        console.log("code_review prompt output:\n" + (codeReviewPrompt.messages[0]?.content as any)?.text);
        console.log("✅ Prompts passed.\n");

        console.log("🎉 ALL LOCAL MCP TESTS PASSED SUCCESSFULLY! 🎉");
    } finally {
        await client.close();
    }
}

runTests().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
