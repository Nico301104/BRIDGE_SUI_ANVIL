import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Wallet, AlertCircle, CheckCircle, Loader } from 'lucide-react';

// ===== CONFIGURARE =====
// IMPORTANT: Actualizează această adresă după deployment!
const ETHEREUM_CHAIN_ID = '0x7a69'; // Anvil default (31337)
const IBT_CONTRACT_ADDRESS = import.meta.env.VITE_IBT_CONTRACT_ADDRESS;
const RPC_URL = import.meta.env.VITE_RPC_URL;
const BACKEND_URL = 'http://localhost:3001';

function App() {
  // State management
  const [ethAccount, setEthAccount] = useState(null);
  const [suiAccount, setSuiAccount] = useState(null);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState('eth-to-sui');
  const [ethBalance, setEthBalance] = useState('0');
  const [suiBalance, setSuiBalance] = useState('0');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  // ===== WALLET CONNECTIONS =====

  /**
   * Conectează MetaMask (Ethereum)
   */
  const connectEthereum = async () => {
    try {
      if (!window.ethereum) {
        setStatus({ type: 'error', message: 'MetaMask nu este instalat! Instalează-l de pe metamask.io' });
        return;
      }

      // Cere permisiune de la utilizator
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Încearcă să comute la rețeaua Anvil
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ETHEREUM_CHAIN_ID }]
        });
      } catch (switchError) {
        // Dacă rețeaua nu există, adaugă-o
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ETHEREUM_CHAIN_ID,
              chainName: 'Anvil Local',
              nativeCurrency: { 
                name: 'ETH', 
                symbol: 'ETH', 
                decimals: 18 
              },
              rpcUrls: ['http://127.0.0.1:8545']
            }]
          });
        }
      }

      setEthAccount(accounts[0]);
      setStatus({ type: 'success', message: '✓ Wallet Ethereum conectat' });
      await fetchEthBalance(accounts[0]);
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      setStatus({ type: 'error', message: 'Nu s-a putut conecta: ' + error.message });
    }
  };

  /**
   * Conectează Sui Wallet
   */
  const connectSui = async () => {
    try {
      if (!window.suiWallet) {
        setStatus({ 
          type: 'error', 
          message: 'Sui Wallet nu este instalat! Instalează extensia din Chrome Web Store' 
        });
        return;
      }

      const accounts = await window.suiWallet.requestAccounts();
      setSuiAccount(accounts[0]);
      setStatus({ type: 'success', message: '✓ Wallet Sui conectat' });
      await fetchSuiBalance(accounts[0]);
    } catch (error) {
      console.error('Error connecting to Sui Wallet:', error);
      setStatus({ type: 'error', message: 'Nu s-a putut conecta: ' + error.message });
    }
  };

  // ===== BALANCE FETCHING =====

  /**
   * Obține balanța IBT de pe Ethereum
   */
  const fetchEthBalance = async (account) => {
    try {
      // Encodează funcția balanceOf(address)
      const balanceHex = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: IBT_CONTRACT_ADDRESS,
          data: '0x70a08231000000000000000000000000' + account.slice(2)
        }, 'latest']
      });
      
      // Convertește din hex în număr zecimal
      const balance = parseInt(balanceHex, 16) / 1e18;
      setEthBalance(balance.toFixed(4));
    } catch (error) {
      console.error('Failed to fetch ETH balance:', error);
      setEthBalance('0.0000');
    }
  };

  /**
   * Obține balanța IBT de pe Sui
   */
  const fetchSuiBalance = async (account) => {
    try {
      // În implementarea reală, ai face un apel RPC către Sui
      // Pentru demo, setăm 0
      setSuiBalance('0.0000');
    } catch (error) {
      console.error('Failed to fetch SUI balance:', error);
      setSuiBalance('0.0000');
    }
  };

  // ===== BRIDGE OPERATIONS =====

  /**
   * Execută transferul bridge
   */
  const executeBridge = async () => {
    // Validări
    if (!amount || parseFloat(amount) <= 0) {
      setStatus({ type: 'error', message: 'Introdu o sumă validă' });
      return;
    }

    if (direction === 'eth-to-sui' && !ethAccount) {
      setStatus({ type: 'error', message: 'Conectează wallet-ul Ethereum mai întâi' });
      return;
    }

    if (direction === 'sui-to-eth' && !suiAccount) {
      setStatus({ type: 'error', message: 'Conectează wallet-ul Sui mai întâi' });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: '⏳ Se procesează tranzacția...' });

    try {
      if (direction === 'eth-to-sui') {
        await bridgeEthToSui();
      } else {
        await bridgeSuiToEth();
      }
    } catch (error) {
      console.error('Bridge error:', error);
      setStatus({ type: 'error', message: '❌ Bridge eșuat: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Bridge de la Ethereum la Sui
   */
  const bridgeEthToSui = async () => {
    // Convertește suma în wei (hex)
    const amountWei = BigInt(parseFloat(amount) * 1e18).toString(16);
    const amountHex = '0x' + amountWei;
    
    // Encodează funcția burn(uint256)
    const burnData = '0x42966c68' + amountHex.slice(2).padStart(64, '0');
    
    setStatus({ type: 'info', message: '🔥 Se ard tokenii pe Ethereum...' });
    
    // Pasul 1: Arde tokenii pe Ethereum
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from: ethAccount,
        to: IBT_CONTRACT_ADDRESS,
        data: burnData
      }]
    });

    setStatus({ type: 'info', message: '⏳ Se așteaptă confirmarea pe Ethereum...' });
    
    // Așteaptă confirmarea
    await waitForTxConfirmation(txHash);

    setStatus({ type: 'info', message: '✨ Se mint-ează tokenii pe Sui...' });

    // Pasul 2: Apelează backend-ul pentru mint pe Sui
    const response = await fetch(`${BACKEND_URL}/bridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: 'eth-to-sui',
        amount: amount,
        ethTxHash: txHash,
        suiAddress: suiAccount
      })
    });

    const result = await response.json();
    
    if (result.success) {
      setStatus({ 
        type: 'success', 
        message: `✅ Succes! ${amount} IBT transferați pe Sui!` 
      });
      
      // Actualizează balanțele
      await fetchEthBalance(ethAccount);
      if (suiAccount) await fetchSuiBalance(suiAccount);
      setAmount('');
    } else {
      throw new Error(result.error);
    }
  };

  /**
   * Bridge de la Sui la Ethereum
   */
  const bridgeSuiToEth = async () => {
    setStatus({ type: 'info', message: '🔥 Se ard tokenii pe Sui...' });

    // Apelează backend-ul
    const response = await fetch(`${BACKEND_URL}/bridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: 'sui-to-eth',
        amount: amount,
        suiAddress: suiAccount,
        ethAddress: ethAccount
      })
    });

    const result = await response.json();
    
    if (result.success) {
      setStatus({ 
        type: 'success', 
        message: `✅ Succes! ${amount} IBT transferați pe Ethereum!` 
      });
      
      // Actualizează balanțele
      if (ethAccount) await fetchEthBalance(ethAccount);
      await fetchSuiBalance(suiAccount);
      setAmount('');
    } else {
      throw new Error(result.error);
    }
  };

  /**
   * Așteaptă confirmarea tranzacției pe Ethereum
   */
  const waitForTxConfirmation = async (txHash) => {
    let receipt = null;
    while (!receipt) {
      receipt = await window.ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      });
      if (!receipt) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return receipt;
  };

  /**
   * Schimbă direcția bridge-ului
   */
  const switchDirection = () => {
    setDirection(direction === 'eth-to-sui' ? 'sui-to-eth' : 'eth-to-sui');
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🌉 IBT Bridge</h1>
          <p className="text-blue-200">
            Transfer cross-chain între Ethereum și Sui
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          
          {/* Wallet Connections */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Ethereum Wallet */}
            <div>
              <button
                onClick={connectEthereum}
                className={`w-full p-4 rounded-xl border-2 transition ${
                  ethAccount
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-white/5 border-white/20 hover:border-white/40'
                }`}
              >
                <Wallet className="w-6 h-6 mx-auto mb-2 text-white" />
                <div className="text-white font-semibold">Ethereum</div>
                {ethAccount ? (
                  <>
                    <div className="text-xs text-green-300 mt-1">
                      {ethAccount.slice(0, 6)}...{ethAccount.slice(-4)}
                    </div>
                    <div className="text-sm text-white/80 mt-2">
                      {ethBalance} IBT
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-white/60 mt-1">
                    Conectează MetaMask
                  </div>
                )}
              </button>
            </div>

            {/* Sui Wallet */}
            <div>
              <button
                onClick={connectSui}
                className={`w-full p-4 rounded-xl border-2 transition ${
                  suiAccount
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-white/5 border-white/20 hover:border-white/40'
                }`}
              >
                <Wallet className="w-6 h-6 mx-auto mb-2 text-white" />
                <div className="text-white font-semibold">Sui</div>
                {suiAccount ? (
                  <>
                    <div className="text-xs text-green-300 mt-1">
                      {suiAccount.slice(0, 6)}...{suiAccount.slice(-4)}
                    </div>
                    <div className="text-sm text-white/80 mt-2">
                      {suiBalance} IBT
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-white/60 mt-1">
                    Conectează Sui Wallet
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Bridge Direction */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-4">
              <div className="text-white font-semibold text-lg">
                {direction === 'eth-to-sui' ? 'Ethereum' : 'Sui'}
              </div>
              <button
                onClick={switchDirection}
                className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition"
                title="Schimbă direcția"
              >
                <ArrowLeftRight className="w-6 h-6 text-white" />
              </button>
              <div className="text-white font-semibold text-lg">
                {direction === 'eth-to-sui' ? 'Sui' : 'Ethereum'}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <label className="block text-white mb-2 font-medium">
              Suma (IBT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white text-lg placeholder-white/40 focus:outline-none focus:border-blue-400 transition"
              step="0.01"
              min="0"
            />
          </div>

          {/* Bridge Button */}
          <button
            onClick={executeBridge}
            disabled={loading}
            className="w-full p-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Se procesează...
              </>
            ) : (
              <>
                <ArrowLeftRight className="w-5 h-5" />
                Bridge Tokens
              </>
            )}
          </button>

          {/* Status Messages */}
          {status.message && (
            <div
              className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${
                status.type === 'error'
                  ? 'bg-red-500/20 border border-red-500/50'
                  : status.type === 'success'
                  ? 'bg-green-500/20 border border-green-500/50'
                  : 'bg-blue-500/20 border border-blue-500/50'
              }`}
            >
              {status.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
              ) : status.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
              ) : (
                <Loader className="w-5 h-5 text-blue-300 flex-shrink-0 mt-0.5 animate-spin" />
              )}
              <p className="text-white text-sm">{status.message}</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-white font-semibold mb-3">
            📋 Pași pentru setup:
          </h3>
          <ol className="text-blue-200 text-sm space-y-2 list-decimal list-inside">
            <li>Pornește Anvil: <code className="bg-black/30 px-2 py-1 rounded">anvil</code></li>
            <li>Deploy contractul Ethereum și actualizează adresa</li>
            <li>Pornește rețeaua locală Sui și deploy contractul</li>
            <li>Pornește serverul backend pe portul 3001</li>
            <li>Conectează ambele wallet-uri și începe bridging-ul!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default App;