#!/usr/bin/env node

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import https from 'https';

// Encryption for API keys
const ENCRYPTION_KEY = crypto.scryptSync('fr3k-behemoth-secure', 'salt', 32);
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = Buffer.from(parts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Get config path
function getConfigPath() {
  const homeDir = os.homedir();
  return path.join(homeDir, '.fr3k-behemoth', 'exchange-keys.json');
}

// Make HTTPS request with proper error handling
function httpsRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Test Bybit connection with V5 API
async function testBybitConnection(apiKey, apiSecret) {
  try {
    const timestamp = Date.now().toString();
    const recvWindow = '5000';
    
    // Parameters for the request
    const params = {
      accountType: 'UNIFIED'
    };
    
    // Create parameter string
    const paramStr = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // Create signature string according to Bybit V5 API
    const signString = timestamp + apiKey + recvWindow + paramStr;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(signString)
      .digest('hex');
    
    const url = `https://api.bybit.com/v5/account/wallet-balance?${paramStr}`;
    
    const options = {
      method: 'GET',
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await httpsRequest(url, options);
    
    // Log response details for debugging
    if (response.statusCode !== 200) {
      console.log(chalk.gray(`HTTP Status: ${response.statusCode}`));
      console.log(chalk.gray(`Response: ${response.body.substring(0, 200)}...`));
    }
    
    // Parse JSON response
    let parsed;
    try {
      parsed = JSON.parse(response.body);
    } catch (parseError) {
      return { 
        success: false, 
        error: `Invalid response from Bybit. Status: ${response.statusCode}, Body: ${response.body.substring(0, 100)}...` 
      };
    }
    
    if (parsed.retCode === 0) {
      // Extract wallet balances
      const balances = [];
      if (parsed.result && parsed.result.list && parsed.result.list.length > 0) {
        const account = parsed.result.list[0]; // Unified account
        if (account.coin && Array.isArray(account.coin)) {
          account.coin.forEach(coin => {
            const balance = parseFloat(coin.walletBalance || 0);
            if (balance > 0) {
              balances.push({
                coin: coin.coin,
                balance: coin.walletBalance,
                usd: coin.usdValue || '0',
                available: coin.availableToWithdraw || coin.walletBalance
              });
            }
          });
        }
      }
      return { success: true, balances, accountType: 'UNIFIED' };
    } else {
      // Common error codes
      let errorDetail = parsed.retMsg || 'Unknown error';
      if (parsed.retCode === 10002) errorDetail = 'Invalid API key';
      if (parsed.retCode === 10003) errorDetail = 'Invalid signature';
      if (parsed.retCode === 10004) errorDetail = 'Invalid timestamp';
      if (parsed.retCode === 10005) errorDetail = 'Permission denied - check API key permissions';
      if (parsed.retCode === 33004) errorDetail = 'API key expired';
      if (parsed.retCode === 131002) errorDetail = 'Account not found - ensure using Unified Account';
      
      return { success: false, error: `${errorDetail} (Code: ${parsed.retCode})` };
    }
  } catch (error) {
    return { 
      success: false, 
      error: `Connection error: ${error.message}` 
    };
  }
}

// Test Binance connection
async function testBinanceConnection(apiKey, apiSecret) {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(queryString)
      .digest('hex');
    
    const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;
    
    const options = {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    };
    
    const response = await httpsRequest(url, options);
    
    let parsed;
    try {
      parsed = JSON.parse(response.body);
    } catch (parseError) {
      return { 
        success: false, 
        error: `Invalid response from Binance. Status: ${response.statusCode}` 
      };
    }
    
    if (parsed.balances) {
      const balances = parsed.balances
        .filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        .map(b => ({
          coin: b.asset,
          balance: (parseFloat(b.free) + parseFloat(b.locked)).toString(),
          free: b.free,
          locked: b.locked
        }));
      return { success: true, balances };
    } else {
      return { success: false, error: parsed.msg || 'Unknown error' };
    }
  } catch (error) {
    return { 
      success: false, 
      error: `Connection error: ${error.message}` 
    };
  }
}

// Main setup function
export async function setupExchangeKeys() {
  console.log(chalk.blue.bold('\n🔑 Exchange API Key Setup\n'));
  
  const configPath = getConfigPath();
  let existingConfig = {};
  
  // Try to load existing config
  try {
    const configDir = path.dirname(configPath);
    await fs.mkdir(configDir, { recursive: true });
    
    const data = await fs.readFile(configPath, 'utf8');
    existingConfig = JSON.parse(data);
    
    // Decrypt existing keys
    for (const [exchange, creds] of Object.entries(existingConfig)) {
      if (creds.apiKey) creds.apiKey = decrypt(creds.apiKey);
      if (creds.apiSecret) creds.apiSecret = decrypt(creds.apiSecret);
    }
  } catch {
    // No existing config
  }
  
  // Ask which exchanges to configure
  const { exchanges } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'exchanges',
      message: 'Select exchanges to configure:',
      choices: [
        { 
          name: 'Bybit (V5 API - Unified Account)', 
          value: 'bybit',
          checked: !existingConfig.bybit
        },
        { 
          name: 'Binance', 
          value: 'binance',
          checked: !existingConfig.binance
        },
        { 
          name: 'Bitget', 
          value: 'bitget',
          checked: !existingConfig.bitget
        }
      ]
    }
  ]);
  
  if (exchanges.length === 0) {
    console.log(chalk.yellow('\nNo exchanges selected.'));
    return existingConfig;
  }
  
  const newConfig = { ...existingConfig };
  
  // Configure each selected exchange
  for (const exchange of exchanges) {
    console.log(chalk.cyan(`\n📊 Configuring ${exchange.toUpperCase()}:\n`));
    
    if (exchange === 'bybit') {
      console.log(chalk.gray('Requirements:'));
      console.log(chalk.gray('  • Unified Trading Account (UTA)'));
      console.log(chalk.gray('  • API key with "Account" read permission'));
      console.log(chalk.gray('  • IP whitelist (optional but recommended)\n'));
    }
    
    const questions = [
      {
        type: 'input',
        name: 'apiKey',
        message: `Enter your ${exchange} API Key:`,
        validate: (input) => input.length > 0 || 'API Key is required'
      },
      {
        type: 'password',
        name: 'apiSecret',
        message: `Enter your ${exchange} API Secret:`,
        mask: '*',
        validate: (input) => input.length > 0 || 'API Secret is required'
      }
    ];
    
    const answers = await inquirer.prompt(questions);
    
    // Test the connection
    const spinner = ora(`Testing ${exchange} connection...`).start();
    
    let testResult;
    if (exchange === 'bybit') {
      testResult = await testBybitConnection(answers.apiKey, answers.apiSecret);
    } else if (exchange === 'binance') {
      testResult = await testBinanceConnection(answers.apiKey, answers.apiSecret);
    } else {
      // For now, just save without testing
      testResult = { success: true, balances: [] };
    }
    
    if (testResult.success) {
      spinner.succeed(chalk.green(`✅ ${exchange} connection successful!`));
      
      if (testResult.accountType) {
        console.log(chalk.gray(`   Account Type: ${testResult.accountType}`));
      }
      
      // Show wallet balances
      if (testResult.balances && testResult.balances.length > 0) {
        console.log(chalk.green(`\n💰 Wallet Balances:`));
        const sortedBalances = testResult.balances.sort((a, b) => 
          parseFloat(b.usd || 0) - parseFloat(a.usd || 0)
        );
        sortedBalances.forEach(balance => {
          const usdValue = balance.usd && parseFloat(balance.usd) > 0 
            ? ` (~$${parseFloat(balance.usd).toFixed(2)} USD)` 
            : '';
          console.log(chalk.white(`   • ${balance.coin}: ${parseFloat(balance.balance).toFixed(8)}${usdValue}`));
        });
      } else {
        console.log(chalk.gray('\n   No balances found (wallet may be empty)'));
      }
      
      // Save encrypted credentials
      newConfig[exchange] = {
        apiKey: encrypt(answers.apiKey),
        apiSecret: encrypt(answers.apiSecret),
        testnet: false,
        configured: new Date().toISOString()
      };
    } else {
      spinner.fail(chalk.red(`❌ ${exchange} connection failed: ${testResult.error}`));
      
      console.log(chalk.yellow('\n💡 Troubleshooting tips:'));
      if (exchange === 'bybit') {
        console.log(chalk.gray('   1. Ensure you have a Unified Trading Account (UTA)'));
        console.log(chalk.gray('   2. Check API key permissions include "Account" read'));
        console.log(chalk.gray('   3. Verify IP whitelist includes your current IP'));
        console.log(chalk.gray('   4. Make sure API key is active and not expired'));
        console.log(chalk.gray('   5. Try creating a new API key if issues persist'));
      }
      
      const { saveAnyway } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'saveAnyway',
          message: 'Save credentials anyway?',
          default: false
        }
      ]);
      
      if (saveAnyway) {
        newConfig[exchange] = {
          apiKey: encrypt(answers.apiKey),
          apiSecret: encrypt(answers.apiSecret),
          testnet: false,
          configured: new Date().toISOString(),
          warning: 'Connection test failed'
        };
      }
    }
  }
  
  // Save the configuration
  await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2));
  console.log(chalk.green(`\n✅ Configuration saved to: ${configPath}`));
  
  // Set environment variables for current session
  console.log(chalk.blue('\n📌 Setting environment variables for current session...\n'));
  
  for (const [exchange, creds] of Object.entries(newConfig)) {
    if (creds.apiKey && creds.apiSecret) {
      const apiKey = decrypt(creds.apiKey);
      const apiSecret = decrypt(creds.apiSecret);
      
      process.env[`${exchange.toUpperCase()}_API_KEY`] = apiKey;
      process.env[`${exchange.toUpperCase()}_API_SECRET`] = apiSecret;
      
      console.log(chalk.green(`   ✓ ${exchange.toUpperCase()}_API_KEY set`));
      console.log(chalk.green(`   ✓ ${exchange.toUpperCase()}_API_SECRET set`));
    }
  }
  
  console.log(chalk.yellow('\n⚠️  Note: Environment variables are set for this session only.'));
  console.log(chalk.gray('   Add them to your shell profile for persistence.\n'));
  
  return newConfig;
}

// Load keys from config
export async function loadExchangeKeys() {
  const configPath = getConfigPath();
  
  try {
    const data = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(data);
    
    // Decrypt and set environment variables
    for (const [exchange, creds] of Object.entries(config)) {
      if (creds.apiKey && creds.apiSecret) {
        process.env[`${exchange.toUpperCase()}_API_KEY`] = decrypt(creds.apiKey);
        process.env[`${exchange.toUpperCase()}_API_SECRET`] = decrypt(creds.apiSecret);
      }
    }
    
    return config;
  } catch {
    return {};
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupExchangeKeys().catch(console.error);
}