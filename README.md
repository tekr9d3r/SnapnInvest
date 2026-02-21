📸 Snap'nInvest
> **Snap a product. Invest in the brand. Powered by AI + blockchain.**
Snap'nInvest is a mobile-first dApp that lets users take photos of real-world products, identifies the brand using AI, and offers tokenized stock investment on the Robinhood Chain.
---
## 🚀 Features
- **📷 Snap to Invest** — Take a photo of any product; AI identifies the brand instantly
- **🤖 AI Brand Recognition** — Powered by Google Gemini for accurate logo/product identification
- **💰 Tokenized Stocks** — Buy fractional shares of identified brands on-chain
- **🔗 Robinhood Chain** — Built on Robinhood's L2 testnet (Chain ID: 46630)
- **👛 Wallet Auth** — Sign in with your Ethereum wallet via Privy
- **📊 Portfolio Tracker** — View your holdings and investment history
- **🌐 Live Feed** — See what others are snapping and investing in real-time
---
## 🛠 Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **Auth** | Privy (wallet-based authentication) |
| **Backend** | Lovable Cloud (Edge Functions, PostgreSQL) |
| **AI** | Google Gemini (brand identification) |
| **Blockchain** | Robinhood Chain Testnet, ethers.js |
| **State** | TanStack React Query |
---
## ⚠️ Testnet Limitations
- **Token minting is simulated** — Due to Robinhood Chain testnet limitations, the stock token minting process is not yet executing on-chain transactions. The mint animation is a demo mockup.
- **On-chain data** — Only the wallet's testnet ETH balance and the 5 available stock token balances (TSLA, AMZN, NFLX, PLTR, AMD) are read live from the Robinhood Chain.
- **Portfolio holdings** — Investment records (snapped stocks, amounts, shares) are stored in the backend database, not on-chain.
- **Future plans** — Once Robinhood Chain mainnet or testnet smart contract deployment is available, actual ERC-20 token minting will replace the simulation.
---
## 📱 Pages & Routes
| Route | Description |
|-------|-------------|
| \`/\` | Landing page with app intro |
| \`/camera\` | Camera capture for product photos |
| \`/result\` | AI identification results |
| \`/confirm\` | Investment confirmation screen |
| \`/portfolio\` | User's holdings & investment history |
| \`/feed\` | Community feed of recent investments |
---
## 🔐 Security
- Wallet-based auth (no passwords stored)
- HMAC-derived session tokens
- Row Level Security (RLS) on all tables
- Service role keys never exposed to frontend
- Privy App ID is a publishable key (safe for client)
