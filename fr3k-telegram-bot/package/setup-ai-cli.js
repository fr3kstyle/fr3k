#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

// AI CLI configurations with correct command names
const AI_CLIS = [
  {
    name: 'Claude Code',
    command: 'claude',  // Changed from 'claude-code'
    package: '@anthropic-ai/claude-code',
    configKey: 'claude-code',
    mcpConfig: {
      command: 'claude',
      args: [],
      env: {}
    }
  },
  {
    name: 'Gemini CLI', 
    command: 'gemini',
    package: '@google/gemini-cli',
    configKey: 'gemini',
    mcpConfig: {
      command: 'gemini',
      args: ['--mode', 'mcp'],
      env: {}
    }
  },
  {
    name: 'OpenCode AI',
    command: 'opencode',
    package: null, // Installed via curl
    configKey: 'opencode',
    mcpConfig: {
      command: 'opencode',
      args: ['serve'],
      env: {}
    }
  },
  {
    name: 'Groq CLI',
    command: 'groq',  // Changed from 'groq-code'
    package: 'groq-code-cli',
    configKey: 'groq',
    mcpConfig: {
      command: 'groq',
      args: ['--mcp'],
      env: {}
    }
  },
  {
    name: 'Qwen Code',
    command: 'qwen',  // Changed from 'qwen-code'
    package: '@qwen-code/qwen-code',
    configKey: 'qwen',
    mcpConfig: {
      command: 'qwen',
      args: ['mcp'],
      env: {}
    }
  }
];

// Get config paths for different platforms
function getConfigPaths() {
  const platform = os.platform();
  const homeDir = os.homedir();
  
  const paths = {
    claude: {
      darwin: path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
      win32: path.join(homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json'),
      linux: path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json')
    },
    opencode: {
      darwin: path.join(homeDir, '.opencode', 'config.json'),
      win32: path.join(homeDir, '.opencode', 'config.json'),
      linux: path.join(homeDir, '.opencode', 'config.json')
    },
    gemini: {
      darwin: path.join(homeDir, '.gemini', 'config.json'),
      win32: path.join(homeDir, '.gemini', 'config.json'),
      linux: path.join(homeDir, '.gemini', 'config.json')
    }
  };
  
  return paths;
}

// Check if a CLI is installed with better error handling
function isInstalled(command) {
  try {
    // Try 'which' command (Unix/Linux/Mac)
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    try {
      // Try 'where' command (Windows)
      execSync(`where ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      try {
        // Try running the command with --version
        execSync(`${command} --version`, { stdio: 'ignore' });
        return true;
      } catch {
        // Also check common global npm bin paths
        const npmBinPath = execSync('npm bin -g', { encoding: 'utf8' }).trim();
        const commandPath = path.join(npmBinPath, command);
        try {
          const stats = require('fs').statSync(commandPath);
          return stats.isFile();
        } catch {
          return false;
        }
      }
    }
  }
}

// Read existing config safely
async function readConfig(configPath) {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// Write config with backup
async function writeConfig(configPath, config) {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(configPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Backup existing config
    const existing = await readConfig(configPath);
    if (existing) {
      const backupPath = `${configPath}.backup-${Date.now()}`;
      await fs.writeFile(backupPath, JSON.stringify(existing, null, 2));
    }
    
    // Write new config
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error(chalk.red(`Error writing config: ${error.message}`));
    return false;
  }
}

// Setup Claude Desktop MCP configuration
async function setupClaudeMCP(installedClis) {
  const platform = os.platform();
  const paths = getConfigPaths();
  const claudeConfigPath = paths.claude[platform];
  
  if (!claudeConfigPath) {
    console.log(chalk.yellow('⚠️  Claude Desktop config path not found for this platform'));
    return;
  }
  
  console.log(chalk.blue('\n📝 Configuring Claude Desktop MCP servers...\n'));
  
  // Read existing config
  let config = await readConfig(claudeConfigPath) || {};
  
  // Initialize mcpServers if it doesn't exist
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  // Add BEHEMOTH if not exists
  if (!config.mcpServers.behemoth) {
    config.mcpServers.behemoth = {
      command: 'npx',
      args: ['fr3k-behemoth'],
      env: {}
    };
    console.log(chalk.green('✓ Added BEHEMOTH MCP server'));
  }
  
  // Add each installed AI CLI
  for (const cli of installedClis) {
    if (!config.mcpServers[cli.configKey]) {
      config.mcpServers[cli.configKey] = cli.mcpConfig;
      console.log(chalk.green(`✓ Added ${cli.name} MCP server`));
    } else {
      console.log(chalk.gray(`⏭️  ${cli.name} already configured`));
    }
  }
  
  // Write updated config
  if (await writeConfig(claudeConfigPath, config)) {
    console.log(chalk.green('\n✅ Claude Desktop configuration updated successfully!'));
    console.log(chalk.gray(`   Config location: ${claudeConfigPath}`));
  }
}

// Setup individual CLI configurations
async function setupCliConfigs() {
  const paths = getConfigPaths();
  
  // OpenCode config
  if (isInstalled('opencode')) {
    const opencodeConfig = {
      version: '1.0',
      mcp_enabled: true,
      server: {
        port: 3000,
        host: 'localhost'
      }
    };
    
    const configPath = paths.opencode[os.platform()];
    if (await writeConfig(configPath, opencodeConfig)) {
      console.log(chalk.green('✓ OpenCode configuration created'));
    }
  }
  
  // Gemini config
  if (isInstalled('gemini')) {
    const geminiConfig = {
      version: '1.0',
      mode: 'mcp',
      features: {
        code_completion: true,
        chat: true,
        analysis: true
      }
    };
    
    const configPath = paths.gemini[os.platform()];
    if (await writeConfig(configPath, geminiConfig)) {
      console.log(chalk.green('✓ Gemini CLI configuration created'));
    }
  }
}

// Main setup function
export async function setupAICliIntegrations() {
  console.log(chalk.blue.bold('\n🤖 AI CLI Integration Setup\n'));
  
  const spinner = ora('Detecting installed AI CLIs...').start();
  
  // Check which CLIs are installed
  const installedClis = [];
  const notInstalled = [];
  
  // Also check for common variations of commands
  const commandVariations = {
    'claude': ['claude', 'claude-code', 'claude-cli'],
    'groq': ['groq', 'groq-code', 'groq-cli'],
    'qwen': ['qwen', 'qwen-code', 'qwen-cli'],
    'gemini': ['gemini', 'gemini-cli'],
    'opencode': ['opencode', 'oc']
  };
  
  for (const cli of AI_CLIS) {
    let found = false;
    
    // Check primary command
    if (isInstalled(cli.command)) {
      installedClis.push(cli);
      found = true;
    } else {
      // Check variations
      const variations = commandVariations[cli.command] || [];
      for (const variant of variations) {
        if (isInstalled(variant)) {
          // Update the CLI config with the found command
          const updatedCli = {
            ...cli,
            command: variant,
            mcpConfig: {
              ...cli.mcpConfig,
              command: variant
            }
          };
          installedClis.push(updatedCli);
          found = true;
          break;
        }
      }
    }
    
    if (!found) {
      notInstalled.push(cli);
    }
  }
  
  spinner.succeed(`Found ${installedClis.length} AI CLIs installed`);
  
  if (installedClis.length > 0) {
    console.log(chalk.green('\n✅ Installed AI CLIs:'));
    installedClis.forEach(cli => {
      console.log(chalk.green(`   • ${cli.name} (${cli.command})`));
    });
  }
  
  if (notInstalled.length > 0) {
    console.log(chalk.yellow('\n⚠️  Not installed:'));
    notInstalled.forEach(cli => {
      const installCmd = cli.package 
        ? `npm install -g ${cli.package}` 
        : 'curl -fsSL https://opencode.ai/install | bash';
      console.log(chalk.yellow(`   • ${cli.name}`));
      console.log(chalk.gray(`     Install with: ${installCmd}`));
    });
  }
  
  // Also check for unknown AI CLI tools in npm global bin
  try {
    const npmBinPath = execSync('npm bin -g', { encoding: 'utf8' }).trim();
    console.log(chalk.gray(`\n📁 Checking npm global bin: ${npmBinPath}`));
  } catch {
    // Ignore if npm bin fails
  }
  
  if (installedClis.length === 0) {
    console.log(chalk.yellow('\n⚠️  No AI CLIs detected. Install them first with:'));
    console.log(chalk.cyan('   npx @fr3k/fr3k-c0d3'));
    return;
  }
  
  // Setup MCP configurations
  await setupClaudeMCP(installedClis);
  
  // Setup individual CLI configs
  await setupCliConfigs();
  
  // Show API key setup instructions
  console.log(chalk.blue('\n🔑 API Key Configuration:\n'));
  
  if (installedClis.find(c => c.name.includes('Claude'))) {
    console.log(chalk.cyan('Claude Code:'));
    console.log('   export ANTHROPIC_API_KEY="your-api-key"');
  }
  
  if (installedClis.find(c => c.name.includes('Gemini'))) {
    console.log(chalk.cyan('\nGemini CLI:'));
    console.log('   export GOOGLE_API_KEY="your-api-key"');
  }
  
  if (installedClis.find(c => c.name.includes('Groq'))) {
    console.log(chalk.cyan('\nGroq CLI:'));
    console.log('   export GROQ_API_KEY="your-api-key"');
  }
  
  if (installedClis.find(c => c.name.includes('OpenCode'))) {
    console.log(chalk.cyan('\nOpenCode:'));
    console.log('   Login with: opencode login');
  }
  
  if (installedClis.find(c => c.name.includes('Qwen'))) {
    console.log(chalk.cyan('\nQwen Code:'));
    console.log('   export QWEN_API_KEY="your-api-key"');
  }
  
  console.log(chalk.green('\n✨ AI CLI integration setup complete!'));
  console.log(chalk.gray('\nRestart Claude Desktop to load the new MCP servers.'));
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAICliIntegrations().catch(console.error);
}