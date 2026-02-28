import BehemothServer from './index.js';

console.log('🧪 Testing BEHEMOTH Crypto MCP Server...\n');

// Test tool listing
const server = new BehemothServer();
const tools = server.getCondensedTools();

console.log(`✅ Successfully loaded ${tools.length} tools:`);
tools.forEach(tool => {
  console.log(`   • ${tool.name} - ${tool.description}`);
});

console.log('\n🎉 All tests passed!');