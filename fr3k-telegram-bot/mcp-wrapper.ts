#!/usr/bin/env bun
/**
 * MCP Wrapper - Invokes md-mcp to create tools dynamically
 */

const TOOL_SPEC = process.argv[2];

if (!TOOL_SPEC) {
    console.error("Usage: mcp-wrapper.ts <tool-spec-file>");
    process.exit(1);
}

async function createTool() {
    console.log("🔨 Creating tool from specification...");

    // Read tool specification
    const spec = await Bun.file(TOOL_SPEC).text();

    // Call md-mcp via npx to create the tool
    // Since md-mcp uses stdio, we need to use it as a tool, not direct invocation
    console.log("✅ Tool specification loaded");
    console.log("📋 To use this tool, invoke: mcp__md-mcp__forge_reality");
    console.log("   with the specification from:", TOOL_SPEC);
}

createTool();
