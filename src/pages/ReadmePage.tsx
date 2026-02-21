const readmeContent = `# 📸 Snap'nInvest

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
cd snapninvest

# Install dependencies
npm install

# Start dev server
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🌐 Deployment

The app is deployed via [Lovable](https://lovable.dev):

- **Preview**: Auto-deployed on every change
- **Production**: Publish via Lovable dashboard → Share → Publish

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

**Built with ❤️ using [Lovable](https://lovable.dev)**
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
