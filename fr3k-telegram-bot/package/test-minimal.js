#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'test-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{
    name: 'test',
    description: 'Test tool',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      }
    }
  }]
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error('DEBUG: Tool call received:', request.params.name);
  return {
    content: [{
      type: 'text',
      text: `Hello from test tool: ${request.params.arguments?.message || 'no message'}`
    }]
  };
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error('DEBUG: Minimal server connected');
}).catch(console.error);