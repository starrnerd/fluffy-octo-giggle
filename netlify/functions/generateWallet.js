const axios = require('axios');
const crypto = require('crypto');
const { google } = require('googleapis');

// Environment variables for the API
const API_URL = process.env.API_URL;  // Cryptomus API URL
const API_KEY = process.env.API_KEY;  // Cryptomus API Key
const MERCHANT_ID = process.env.MERCHANT_ID;  // Cryptomus Merchant ID

// Mapping wallet types to currency and network
const walletConfig = {
  btc_wallet: { currency: 'BTC', network: 'btc' },
  eth_wallet: { currency: 'ETH', network: 'eth' },
  ltc_wallet: { currency: 'LTC', network: 'ltc' },
  usdt_wallet: { currency: 'USDT', network: 'tron' },
  usdc_wallet: { currency: 'USDC', network: 'polygon' },
  ton_wallet: { currency: 'TON', network: 'ton' }
};

// Function to generate a wallet address based on user_id and wallet_type
async function generateWalletAddress(userId, walletType) {
  try {
    if (!walletConfig[walletType]) {
      return { error: 'Invalid wallet type' };
    }

    const { currency, network } = walletConfig[walletType];

    // Call the function to create the wallet via the Cryptomus API
    const walletAddress = await createWallet(currency, network, userId);
    if (!walletAddress) {
      return { error: 'Failed to generate wallet address' };
    }

    // Here, you would update Google Sheets with the wallet address (this part is omitted in this example)
    // Assuming you have a function updateGoogleSheet to do this:
    // await updateGoogleSheet(userId, walletType, walletAddress);

    return { success: true, walletAddress };

  } catch (error) {
    console.error(`Error generating ${walletType.toUpperCase()} wallet address:`, error);
    return { error: 'Internal server error' };
  }
}

// Function to create a unique static wallet using Cryptomus API
async function createWallet(currency, network, userId) {
  const data = {
    currency: currency,
    network: network,
    order_id: userId.toString()
  };

  const jsonData = JSON.stringify(data);
  const base64EncodedData = Buffer.from(jsonData).toString('base64');

  // Generate the sign using API_KEY and encoded data
  const sign = crypto.createHash('md5').update(base64EncodedData + API_KEY).digest('hex');

  const headers = {
    'merchant': MERCHANT_ID,
    'sign': sign,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(API_URL, data, { headers });

    if (response.status === 200 && response.data && response.data.result) {
      return response.data.result.address;
    } else {
      console.error(`API Error: ${response.status} - ${response.data}`);
      return null;
    }

  } catch (error) {
    console.error('Request failed:', error);
    return null;
  }
}

module.exports = { generateWalletAddress };