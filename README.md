# IBT Cross-Chain Bridge

Transfer tokenul IBT între Ethereum și Sui prin mecanismul burn & mint.

---

## Cum funcționează

Tokenii sunt burn-uiți pe chain-ul sursă, backend-ul confirmă tranzacția on-chain, apoi mint-uiește echivalentul pe chain-ul destinație. Supply-ul total rămâne constant în orice moment.

Direcții suportate: `Ethereum → Sui` și `Sui → Ethereum`.

---

## Arhitectură

```
Frontend (React)
       │
Backend (Node.js + Express)
       │
  ┌────┴────┐
Ethereum   Sui
(Solidity) (Move)
```

- **Smart Contracts** — contract ERC-20 pe Ethereum și contract Move pe Sui; ambele expun funcții de burn/mint restricționate la backend.
- **Backend** — verifică tranzacțiile și execută mint-ul pe chain-ul destinație.
- **Frontend** — interfață React pentru conectare wallet și inițiere transfer.

---

## Stack

| | |
|---|---|
| Blockchain | Ethereum, Sui |
| Smart Contracts | Solidity, Move |
| Backend | Node.js, Express, ethers.js, Sui SDK |
| Frontend | React, Vite, TailwindCSS |
| Tooling | Foundry, Sui CLI |

---

## Instalare

### Prerequisite

- [Node.js](https://nodejs.org/)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Rust](https://www.rust-lang.org/tools/install)
- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install)

### Windows

```bash
# Setup inițial
scripts\setup-project.bat

# Deploy contracte
scripts\deploy-ethereum.bat
scripts\deploy-sui.bat
```

După deploy, actualizează adresele contractelor în `frontend/.env` și `backend/.env`, apoi pornește bridge-ul:

```bash
scripts\start-bridge.bat
```

## Structură

```
IBT-Bridge/
├── contracts/
│   ├── ethereum/IBT.sol
│   └── sui/ibt.move
├── backend/
├── frontend/
├── scripts/
└── SETUP.md
```

---

## Note

Proiectul rulează local pe **Anvil** și **Sui Local Network** — nu sunt necesare fonduri reale.

Codul este scris în scop educațional. Pentru producție ar necesita validatori descentralizați, protecție împotriva double-mint și un audit de securitate.

---

## Licență

MIT 
## Autor
Nicolae-Andrei Sandru, student Informatică  UVT FMI
