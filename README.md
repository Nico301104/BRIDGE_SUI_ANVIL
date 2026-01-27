# IBT Cross-Chain Bridge 🌉

Bridge complet pentru transferul de tokeni IBT între Ethereum și Sui.

## 🚀 Quick Start

### Windows

1. **Instalează prerequisite**: Node.js, Foundry, Rust, Sui CLI
2. **Setup proiect**: Rulează `scripts\setup-project.bat`
3. **Deploy contracte**: 
   - `scripts\deploy-ethereum.bat`
   - `scripts\deploy-sui.bat`
4. **Actualizează configurări** cu adresele contractelor
5. **Start servicii**: `scripts\start-bridge.bat`

### Linux/Mac

Urmează ghidul din `SETUP.md`.

## 📚 Documentație

- `SETUP.md` - Ghid complet de instalare
- `contracts/ethereum/` - Contract Solidity
- `contracts/sui/` - Contract Move
- `backend/` - Server Node.js
- `frontend/` - Aplicație React

## 🛠️ Tehnologii

- **Ethereum**: Solidity, Foundry, ethers.js
- **Sui**: Move, Sui SDK
- **Backend**: Node.js, Express
- **Frontend**: React, Vite, Tailwind CSS

## ⚠️ Important

Acesta este un proiect educațional. Nu folosi în producție fără audit de securitate!

## 📝 Licență

MIT