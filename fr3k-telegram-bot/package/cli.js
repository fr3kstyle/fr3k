#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import { program } from 'commander';
import inquirer from 'inquirer';
import { spawn, execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupAICliIntegrations } from './setup-ai-cli.js';
import { setupExchangeKeys, loadExchangeKeys } from './setup-exchange-keys.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CURRENT_VERSION = '3.3.0';

// ASCII Art
function displayAsciiArt() {
  const art = `
${chalk.red('██████╗ ███████╗██╗  ██╗███████╗███╗   ███╗ ██████╗ ████████╗██╗  ██╗')}
${chalk.red('██╔══██╗██╔════╝██║  ██║██╔════╝████╗ ████║██╔═══██╗╚══██╔══╝██║  ██║')}
${chalk.yellow('██████╔╝█████╗  ███████║█████╗  ██╔████╔██║██║   ██║   ██║   ███████║')}
${chalk.yellow('██╔══██╗██╔══╝  ██╔══██║██╔══╝  ██║╚██╔╝██║██║   ██║   ██║   ██╔══██║')}
${chalk.cyan('██████╔╝███████╗██║  ██║███████╗██║ ╚═╝ ██║╚██████╔╝   ██║   ██║  ██║')}
${chalk.cyan('╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝')}

        ${chalk.magenta.bold('🌌 COSMIC CRYPTO TRADING INTELLIGENCE 🌌')}
  `;
  console.log(art);
  console.log(chalk.gray('\n┌────────────────────────────────────────────────────────────────────┐'));
  console.log(chalk.gray('│') + chalk.white.bold('  Ultra-High Performance MCP Server with 20 Power Tools        ') + chalk.gray('     │'));
  console.log(chalk.gray('│') + chalk.white('  Access 210+ operations through consolidated interfaces       ') + chalk.gray('      │'));
  console.log(chalk.gray('└────────────────────────────────────────────────────────────────────┘\n'));
}

// Check if version has changed
async function checkVersionUpdate() {
  const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.fr3k-behemoth', 'first-run.json');
  
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    
    if (config.version && config.version !== CURRENT_VERSION) {
      console.log(chalk.yellow(`\n🔄 Version updated: ${config.version} → ${CURRENT_VERSION}\n`));
      
      const { updateKeys } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'updateKeys',
          message: 'Would you like to update your API keys?',
          default: false
        }
      ]);
      
      if (updateKeys) {
        await setupExchangeKeys();
      }
      
      // Update version in config
      config.version = CURRENT_VERSION;
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    }
    
    return config;
  } catch {
    return null;
  }
}

// Configuration helper for BEHEMOTH settings
async function setupBehemothConfig() {
  console.log(chalk.blue('\n🔧 BEHEMOTH Configuration Setup\n'));
  
  const config = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Select operation mode:',
      choices: [
        { name: 'Production Mode (Live Trading)', value: 'production' },
        { name: 'Testnet Mode (Paper Trading)', value: 'testnet' },
        { name: 'Simulation Mode (No API Required)', value: 'simulation' }
      ]
    },
    {
      type: 'checkbox',
      name: 'exchanges',
      message: 'Select exchanges to configure:',
      choices: ['Bybit', 'Binance', 'Bitget'],
      when: (answers) => answers.mode !== 'simulation'
    }
  ]);

  // Save config
  const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.fr3k-behemoth', 'behemoth-config.json');
  const configDir = path.dirname(configPath);
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  
  console.log(chalk.green('\n✅ BEHEMOTH configuration saved successfully!'));
  return config;
}

// First run setup
async function firstRunSetup() {
  console.log(chalk.yellow('🎉 Welcome to FR3K-BEHEMOTH!\n'));
  console.log(chalk.white('Let\'s set up everything you need to get started.\n'));
  
  // Always start with exchange API keys
  console.log(chalk.blue.bold('Step 1: Exchange API Keys'));
  console.log(chalk.gray('Configure your exchange API keys for live trading\n'));
  
  const { setupKeys } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupKeys',
      message: 'Would you like to set up exchange API keys now?',
      default: true
    }
  ]);
  
  if (setupKeys) {
    await setupExchangeKeys();
  } else {
    console.log(chalk.yellow('\n⚠️  Warning: Without API keys, you can only use simulation mode.'));
    console.log(chalk.gray('You can set up API keys later with: npx fr3k-behemoth setup-keys\n'));
  }
  
  // Step 2: AI CLI Integration
  console.log(chalk.blue.bold('\nStep 2: AI CLI Integration'));
  console.log(chalk.gray('Configure AI CLI tools for MCP integration\n'));
  
  const { setupAI } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupAI',
      message: 'Would you like to set up AI CLI integrations?',
      default: true
    }
  ]);
  
  if (setupAI) {
    await setupAICliIntegrations();
  }
  
  // Mark as configured with current version
  const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.fr3k-behemoth', 'first-run.json');
  const configDir = path.dirname(configPath);
  await fs.mkdir(configDir, { recursive: true });
  
  await fs.writeFile(configPath, JSON.stringify({ 
    firstRun: false, 
    timestamp: Date.now(),
    version: CURRENT_VERSION
  }));
  
  console.log(chalk.green('\n✅ Setup complete! FR3K-BEHEMOTH is ready to use.\n'));
}

// Launch the MCP server
async function launchServer() {
  console.clear();
  displayAsciiArt();
  
  // Check if this is first run or version update
  const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.fr3k-behemoth', 'first-run.json');
  let isFirstRun = false;
  let existingConfig = null;
  
  try {
    const data = await fs.readFile(configPath, 'utf8');
    existingConfig = JSON.parse(data);
    
    // Check if it's marked as first run or version mismatch
    if (existingConfig.firstRun !== false) {
      isFirstRun = true;
    }
  } catch {
    isFirstRun = true;
  }
  
  if (isFirstRun) {
    await firstRunSetup();
    console.log(chalk.blue('\n🚀 Launching BEHEMOTH server...\n'));
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.clear();
    displayAsciiArt();
  } else {
    // Check for version update
    await checkVersionUpdate();
  }
  
  // Load exchange keys
  console.log(chalk.gray('Loading exchange configurations...'));
  const loadedKeys = await loadExchangeKeys();
  
  if (Object.keys(loadedKeys).length === 0) {
    console.log(chalk.yellow('\n⚠️  No exchange API keys configured.'));
    
    const { setupNow } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupNow',
        message: 'Would you like to set up exchange API keys now?',
        default: true
      }
    ]);
    
    if (setupNow) {
      await setupExchangeKeys();
      await loadExchangeKeys(); // Reload after setup
    } else {
      console.log(chalk.gray('Running in simulation mode...\n'));
    }
  }

  const initSpinner = ora({
    text: 'Initializing FR3K-BEHEMOTH...',
    spinner: {
      interval: 80,
      frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    }
  }).start();
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  initSpinner.succeed(chalk.green('FR3K-BEHEMOTH initialized'));

  console.log(chalk.blue('\n📊 System Status:\n'));
  console.log(chalk.gray('┌────────────────────────────────────────────────────────────────────┐'));
  console.log(chalk.gray('│') + chalk.white(' Status: ') + chalk.green('ONLINE') + chalk.white('     Tools: ') + chalk.cyan('20') + chalk.white('     Operations: ') + chalk.magenta('210+') + '                      ' + chalk.gray('│'));
  console.log(chalk.gray('│') + chalk.white(' Mode: ') + chalk.yellow('COSMIC') + chalk.white('       API: ') + (Object.keys(loadedKeys).length > 0 ? chalk.green('READY') : chalk.yellow('NO KEYS')) + chalk.white('    Performance: ') + chalk.green('OPTIMAL') + '                  ' + chalk.gray('│'));
  console.log(chalk.gray('└────────────────────────────────────────────────────────────────────┘'));

  console.log(chalk.yellow('\n⚡ Available Tools:\n'));
  
  const tools = [
    ['exchange', 'Exchange operations'],
    ['technical', 'Technical analysis'],
    ['cosmic', 'Cosmic intelligence'],
    ['ai', 'AI predictions'],
    ['strategy', 'Trading strategies']
  ];

  tools.forEach(([name, desc]) => {
    console.log(chalk.cyan(`  • ${name.padEnd(12)}`), chalk.white(desc));
  });

  console.log(chalk.magenta('\n🚀 Starting MCP Server...\n'));

  // Launch the actual MCP server
  const serverPath = path.join(__dirname, 'index.js');
  const child = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: { ...process.env, LOG_LEVEL: 'info' }
  });

  child.on('error', (error) => {
    console.error(chalk.red('\n❌ Failed to start BEHEMOTH:'), error.message);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.log(chalk.red(`\n❌ BEHEMOTH exited with code ${code}`));
    } else {
      console.log(chalk.gray('\n👋 BEHEMOTH shutdown complete.'));
    }
  });
}

// Main program
program
  .name('fr3k-behemoth')
  .description('🌌 BEHEMOTH Cosmic Crypto Trading MCP Server')
  .version(CURRENT_VERSION);

program
  .command('start')
  .description('Start the BEHEMOTH MCP server')
  .action(launchServer);

// Make start the default command
program
  .action(launchServer);

program
  .command('config')
  .description('Configure BEHEMOTH and AI CLI settings')
  .action(async () => {
    displayAsciiArt();
    
    const { configType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'configType',
        message: 'What would you like to configure?',
        choices: [
          { name: 'Exchange API Keys', value: 'exchange' },
          { name: 'AI CLI Integrations', value: 'ai-cli' },
          { name: 'BEHEMOTH Settings', value: 'behemoth' },
          { name: 'Everything', value: 'all' }
        ]
      }
    ]);
    
    if (configType === 'exchange' || configType === 'all') {
      await setupExchangeKeys();
    }
    
    if (configType === 'ai-cli' || configType === 'all') {
      await setupAICliIntegrations();
    }
    
    if (configType === 'behemoth' || configType === 'all') {
      await setupBehemothConfig();
    }
  });

program
  .command('status')
  .description('Check BEHEMOTH server status')
  .action(async () => {
    console.log(chalk.blue('\n🔍 Checking BEHEMOTH status...\n'));
    
    // Check for API keys
    const loadedKeys = await loadExchangeKeys();
    const hasKeys = Object.keys(loadedKeys).length > 0;
    
    console.log(chalk.green('✅ BEHEMOTH is ready to launch'));
    console.log(chalk.gray(`   Version: ${CURRENT_VERSION}`));
    console.log(chalk.gray(`   API Keys: ${hasKeys ? chalk.green('Configured') : chalk.yellow('Not configured')}`));
    
    if (!hasKeys) {
      console.log(chalk.yellow('\n⚠️  No API keys configured. Run "npx fr3k-behemoth setup-keys" to configure.'));
    }
    
    console.log(chalk.gray('\nRun "npx fr3k-behemoth" to start the server'));
  });

program
  .command('setup-ai')
  .description('Setup AI CLI integrations (Claude, Gemini, OpenCode, Groq, Qwen)')
  .action(async () => {
    try {
      displayAsciiArt();
      await setupAICliIntegrations();
    } catch (error) {
      console.error(chalk.red('Error setting up AI CLIs:'), error);
    }
  });

program
  .command('setup-keys')
  .description('Setup exchange API keys with connection verification')
  .action(async () => {
    try {
      displayAsciiArt();
      await setupExchangeKeys();
    } catch (error) {
      console.error(chalk.red('Error setting up exchange keys:'), error);
    }
  });

program
  .command('reset')
  .description('Reset all configurations and start fresh')
  .action(async () => {
    displayAsciiArt();
    
    const { confirmReset } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmReset',
        message: chalk.red('⚠️  This will delete all configurations. Are you sure?'),
        default: false
      }
    ]);
    
    if (confirmReset) {
      const configDir = path.join(process.env.HOME || process.env.USERPROFILE, '.fr3k-behemoth');
      
      try {
        await fs.rm(configDir, { recursive: true, force: true });
        console.log(chalk.green('\n✅ All configurations have been reset.'));
        console.log(chalk.gray('Run "npx fr3k-behemoth" to start fresh setup.'));
      } catch (error) {
        console.error(chalk.red('Error resetting configurations:'), error);
      }
    } else {
      console.log(chalk.gray('\nReset cancelled.'));
    }
  });

program.parse();