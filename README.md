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
## 🏗 Architecture
\`\`\`
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React App  │────▶│ Edge Functions│────▶│  Robinhood   │
│  (Vite/TS)   │     │  (Deno)      │     │  Chain L2    │
└──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                    │
       │              ┌─────▼──────┐
       │              │ PostgreSQL │
       │              │ (Holdings, │
       └──────────────│  Profiles) │
                      └────────────┘
\`\`\`
### Edge Functions
- **\`identify-brand\`** — Accepts a product image, uses Gemini AI to identify the brand and return stock ticker info
- **\`stock-lookup\`** — Fetches real-time stock price data for identified tickers
- **\`wallet-auth\`** — Handles wallet signature verification and session management
---
## 🗄 Database Schema
### \`profiles\`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (matches auth user) |
| wallet_address | TEXT | User's Ethereum wallet address |
| created_at | TIMESTAMPTZ | Account creation time |
### \`holdings\`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner's user ID |
| ticker | TEXT | Stock ticker symbol |
| name | TEXT | Company name |
| logo_url | TEXT | Brand logo URL |
| captured_image_url | TEXT | Original photo URL |
| amount_invested | NUMERIC | Investment amount |
| shares | NUMERIC | Number of shares |
| price_at_purchase | NUMERIC | Price at time of purchase |
| tx_hash | TEXT | Blockchain transaction hash |
| created_at | TIMESTAMPTZ | Transaction time |
---
## 🔐 Security
- Wallet-based auth (no passwords stored)
- HMAC-derived session tokens
- Row Level Security (RLS) on all tables
- Service role keys never exposed to frontend
- Privy App ID is a publishable key (safe for client)
