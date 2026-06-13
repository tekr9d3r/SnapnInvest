const readmeContent = `# Fara

> **Hunt stocks in the wild.**

Fara is a mobile-first adventure investing game. Spot brands in the real world, snap a photo, mint their tokenized stock on-chain, and compete in challenges to win free stock.

*Fara — Old Norse for "to travel, to journey."*

---

## How it works

1. **Spot a brand in the wild** — a store, a product, a logo on the street
2. **Snap a photo** — Claude AI identifies the brand instantly
3. **Mint the stock** — swap ETH for tokenized stock on Robinhood Chain
4. **Complete challenges** — collect all stocks in a hunt to enter prize draws

---

## 🚀 Features

- **📷 Snap to Mint** — Take a photo of any brand; AI identifies it instantly
- **🤖 AI Brand Recognition** — Powered by Claude (Anthropic) for accurate logo/product identification
- **💰 Tokenized Stocks** — Buy fractional shares of identified brands on-chain
- **🔗 Robinhood Chain** — Built on Robinhood's L2 testnet (Chain ID: 46630)
- **👛 Wallet Auth** — Sign in with your Ethereum wallet via ConnectKit
- **🏆 Adventure Challenges** — Weekly, seasonal, and grand hunts with free stock prizes
- **📊 Portfolio Tracker** — View your holdings and investment history
- **🌐 Live Feed** — See what others are hunting and minting in real-time

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui, Framer Motion |
| **Auth** | Privy (wallet-based authentication) |
| **Backend** | Vercel Serverless Functions, Neon PostgreSQL |
| **AI** | Claude Sonnet (Anthropic) — brand identification |
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

- **\`identify-brand\`** — Accepts a product image, uses Claude Sonnet (Anthropic) to identify the brand and return stock ticker info
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

## ⚠️ Testnet Limitations

- **Token minting is simulated** — Due to Robinhood Chain testnet limitations, the stock token minting process is not yet executing on-chain transactions. The mint animation is a demo mockup.
- **On-chain data** — Only the wallet's testnet ETH balance and the 5 available stock token balances (TSLA, AMZN, NFLX, PLTR, AMD) are read live from the Robinhood Chain.
- **Portfolio holdings** — Investment records (snapped stocks, amounts, shares) are stored in the backend database, not on-chain.
- **Future plans** — Once Robinhood Chain mainnet or testnet smart contract deployment is available, actual ERC-20 token minting will replace the simulation.

---

## 🔐 Security

- Wallet-based auth (no passwords stored)
- HMAC-derived session tokens
- Row Level Security (RLS) on all tables
- Service role keys never exposed to frontend
- Privy App ID is a publishable key (safe for client)

---

## 🏃‍♂️ Getting Started

\`\`\`bash
# Clone the repo
git clone <YOUR_GIT_URL>
cd fara

# Install dependencies
npm install

# Start dev server
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deployment

The app is deployed via [Vercel](https://vercel.com):

- **Preview**: Auto-deployed on every branch push
- **Production**: Deployed from the main branch

---

## 📄 License

MIT

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

---

**Built with ❤️ using React, Vercel, and Claude AI**
`;

const ReadmePage = () => {
  const handleCopy = async () => {
    await navigator.clipboard.writeText(readmeContent);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24 pt-20">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">README.md</h1>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            📋 Copy to Clipboard
          </button>
        </div>
        <pre className="bg-muted/50 border border-border rounded-xl p-4 text-sm overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
          {readmeContent}
        </pre>
      </div>
    </div>
  );
};

export default ReadmePage;
