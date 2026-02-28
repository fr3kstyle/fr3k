# Exchange API Key Setup Guide

FR3K-BEHEMOTH v3.2+ includes interactive exchange API key setup with connection verification.

## Features

- 🔐 **Secure Storage**: API keys are encrypted using AES-256-CBC
- ✅ **Connection Testing**: Verifies API keys by fetching wallet balance
- 💰 **Balance Display**: Shows your current balances after successful connection
- 🔄 **Multi-Exchange**: Supports Bybit, Binance, and Bitget

## First Run Experience

When you run `npx fr3k-behemoth` for the first time:

1. **Welcome Screen** - Introduces the setup process
2. **Exchange Setup** - Prompts for API keys with live verification
3. **AI CLI Setup** - Configures AI tool integrations
4. **Ready to Trade** - Launches the MCP server

## Manual Setup

### Configure Exchange Keys
```bash
npx fr3k-behemoth setup-keys
```

### Configure Everything
```bash
npx fr3k-behemoth config
# Select "Exchange API Keys" or "Everything"
```

## What Happens During Setup

1. **Select Exchanges**: Choose which exchanges to configure
2. **Enter Credentials**: 
   - API Key (visible)
   - API Secret (masked with asterisks)
3. **Connection Test**: Automatically tests the connection
4. **Wallet Balance**: Displays your balances if successful
5. **Secure Storage**: Encrypts and saves credentials

### Example Output
```
📊 Configuring BYBIT:

? Enter your bybit API Key: ****************
? Enter your bybit API Secret: **********************
✅ bybit connection successful!

💰 Wallet Balances:
   • USDT: 1000.00000000 (~$1000.00 USD)
   • BTC: 0.05000000 (~$2500.00 USD)
   • ETH: 1.50000000 (~$3000.00 USD)
```

## Security

### Encryption
- Keys are encrypted using AES-256-CBC
- Unique IV for each encryption
- Stored in `~/.fr3k-behemoth/exchange-keys.json`

### File Structure
```json
{
  "bybit": {
    "apiKey": "encrypted:string",
    "apiSecret": "encrypted:string",
    "testnet": false,
    "configured": "2025-10-13T12:00:00.000Z"
  }
}
```

## Environment Variables

After setup, the following environment variables are set for the current session:

- `BYBIT_API_KEY`
- `BYBIT_API_SECRET`
- `BINANCE_API_KEY`
- `BINANCE_API_SECRET`
- `BITGET_API_KEY`
- `BITGET_API_SECRET`

## Creating API Keys

### Bybit
1. Log in to [Bybit](https://www.bybit.com)
2. Go to Account & Security → API Management
3. Create new API key with:
   - Read permissions
   - Spot/Derivatives trading (if needed)
   - Wallet permissions
4. Save IP restrictions for security

### Binance
1. Log in to [Binance](https://www.binance.com)
2. Go to API Management
3. Create API with:
   - Enable Reading
   - Enable Spot & Margin Trading (if needed)
4. Whitelist IPs for security

### Bitget
1. Log in to [Bitget](https://www.bitget.com)
2. Go to API → API Management
3. Create new API key
4. Set permissions and IP whitelist

## Troubleshooting

### Connection Failed
- Check API key permissions
- Verify IP whitelist settings
- Ensure API is enabled on exchange
- Check network connectivity

### Wrong Balance
- API might need wallet read permissions
- Some exchanges show delayed balances
- Check if using testnet vs mainnet

### Can't Find Config
- Config stored in `~/.fr3k-behemoth/`
- Check file permissions
- Try running with sudo if permission denied

## Updating Keys

To update existing keys:
```bash
npx fr3k-behemoth setup-keys
```

Select the exchange again and enter new credentials.

---

*Your API keys are encrypted and stored locally. Never share your API secrets!*