const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
const { TransactionBlock } = require('@mysten/sui.js/transactions');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ETH_RPC_URL = 'http://127.0.0.1:8545';
const ETH_CONTRACT_ADDRESS = process.env.ETH_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const ETH_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const SUI_PACKAGE_ID = process.env.SUI_PACKAGE_ID || '';
const SUI_TREASURY_CAP = process.env.SUI_TREASURY_CAP || '';

const ethProvider = new ethers.JsonRpcProvider(ETH_RPC_URL);
const ethWallet = new ethers.Wallet(ETH_PRIVATE_KEY, ethProvider);

const IBT_ABI = [
  "function mint(address to, uint256 amount) external returns (bool)",
  "function burn(uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

const ethContract = new ethers.Contract(ETH_CONTRACT_ADDRESS, IBT_ABI, ethWallet);

const suiClient = new SuiClient({ url: getFullnodeUrl('localnet') });
const suiKeypairData = [
  74, 167, 203, 192, 149, 239, 184, 213, 122, 135, 131, 66, 204, 126, 
  28, 84, 33, 55, 182, 28, 172, 195, 94, 111, 196, 251, 108, 90, 151, 12, 55, 71
];
const suiKeypair = Ed25519Keypair.fromSecretKey(Uint8Array.from(suiKeypairData));

const bridgeTransactions = new Map();

async function verifyEthTx(txHash) {
  const receipt = await ethProvider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) {
    throw new Error('Transaction failed');
  }
  return true;
}

async function mintOnSui(recipient, amount) {
  const tx = new TransactionBlock();
  const amountInUnits = Math.floor(parseFloat(amount) * 1e9);
  
  tx.moveCall({
    target: `${SUI_PACKAGE_ID}::token::mint`,
    arguments: [
      tx.object(SUI_TREASURY_CAP),
      tx.pure(amountInUnits),
      tx.pure(recipient)
    ]
  });
  
  const result = await suiClient.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: suiKeypair,
    options: { showEffects: true }
  });
  
  return result.digest;
}

async function mintOnEth(recipient, amount) {
  const amountInWei = ethers.parseEther(amount);
  const tx = await ethContract.mint(recipient, amountInWei);
  const receipt = await tx.wait();
  return receipt.hash;
}

app.post('/bridge', async (req, res) => {
  try {
    const { direction, amount, ethTxHash, suiAddress, ethAddress } = req.body;
    
    if (direction === 'eth-to-sui') {
      await verifyEthTx(ethTxHash);
      const suiTx = await mintOnSui(suiAddress, amount);
      
      bridgeTransactions.set(ethTxHash, {
        direction, amount, ethTxHash, suiTxHash: suiTx, timestamp: Date.now()
      });
      
      res.json({ success: true, suiTxHash: suiTx });
    } else if (direction === 'sui-to-eth') {
      const ethTx = await mintOnEth(ethAddress, amount);
      
      bridgeTransactions.set(Date.now().toString(), {
        direction, amount, ethTxHash: ethTx, timestamp: Date.now()
      });
      
      res.json({ success: true, ethTxHash: ethTx });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', async (req, res) => {
  try {
    const ethBlock = await ethProvider.getBlockNumber();
    res.json({ status: 'ok', ethBlock, timestamp: Date.now() });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Bridge server: http://localhost:${PORT}`);
  console.log(`ETH Contract: ${ETH_CONTRACT_ADDRESS}`);
  console.log(`SUI Package: ${SUI_PACKAGE_ID}`);
});