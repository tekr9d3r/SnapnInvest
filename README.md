# FARA

> **Hunt stocks in the wild.**

Fara turns the real world into a stock market game. Spot a brand, snap a photo and mint the tokenized stock on Robinhood Chain. Collect stocks across adventure challenges, compete on the leaderboard, and win free stock prizes.

*Fara — Old Norse for "to travel, to journey."*

Built on [Robinhood Chain Testnet](https://chain.robinhood.com) during the Buildathon for the Arbitrum Open House London 2026.

**Live app:** [fara-invest.vercel.app](https://fara-invest.vercel.app/)

---

## How it works

1. **Spot** — find a brand in the wild: a storefront, product, logo, or billboard
2. **Snap** — Claude AI (Haiku vision) recognizes the brand and maps it to a US stock ticker
3. **Mint** — swap testnet ETH for tokenized stock via MockSwap DEX directly on Robinhood Chain
4. **Hunt** — complete challenges by collecting all stocks in a themed set to win free stock prizes

No sign-up. No password. Just connect your wallet and start hunting.

---

## Features

- **AI brand recognition** — Claude Haiku vision model identifies brands from photos
- **Real on-chain swaps** — MockSwap DEX with 536 tokenized stock/ETH liquidity pools
- **536 tokenized stocks** — AAPL, TSLA, AMZN, GOOGL, and 532 more
- **Adventure challenges** — Weekly sprints, themed hunts (Food & Drink, Fashion & Footwear), and a 25-stock grand challenge
- **Leaderboard** — ranked by challenge progress and total snaps
- **ConnectKit wallet** — MetaMask, WalletConnect; auto-switches to Robinhood Chain
- **Live feed** — community snaps with captured photos and on-chain tx links
- **Portfolio** — live on-chain token balances + purchase history with snap photos
- **Chain helper** — one-tap "Add Chain" button to add Robinhood Chain to any wallet

---

## MockStock — Tokenized Stocks on Robinhood Chain

The 536 tokenized stock tokens and the MockSwap DEX were built in collaboration with [**TempeTechie**](https://github.com/tempe-techie).

- **Tokens repo:** [tempe-techie/rh-chain-testnet-tokens](https://github.com/tempe-techie/rh-chain-testnet-tokens)
- Each stock is an ERC-20 token deployed on Robinhood Chain Testnet
- MockSwap is a constant-product AMM (Uniswap V2-style) with ETH/stock pairs for all 536 tickers
- Factory contract: `0xE9a696F428725134AB06454A0CB2E7434e3deC4c`

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite (PWA) |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Wallet | wagmi + viem + ConnectKit |
| AI | Claude Haiku (`claude-haiku-4-5-20251001`) |
| Blockchain | Robinhood Chain Testnet (chainId 46630), ethers v6 |
| DEX | MockSwap — constant product AMM, direct ETH→token swaps |
| Backend | Vercel API routes (Node.js TypeScript) |
| Database | Neon Postgres (holdings, challenges, profiles) |
| Storage | Vercel Blob (captured snap photos) |

---

## Robinhood Chain

- **Chain ID:** 46630 (0xB636)
- **Type:** Arbitrum Orbit L2
- **RPC:** `https://rpc.testnet.chain.robinhood.com`
- **Explorer:** `https://explorer.testnet.chain.robinhood.com`
- **DEX:** MockSwap — 536 stock/ETH pairs, factory at `0xE9a696F428725134AB06454A0CB2E7434e3deC4c`

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — active challenges + live community snaps |
| `/camera` | Camera capture |
| `/result` | AI brand identification |
| `/confirm` | Swap preview + confirm (real on-chain) |
| `/portfolio` | On-chain token balances + purchase history |
| `/feed` | Community feed of all snaps |
| `/leaderboard` | Challenge rankings |

---

## Local development

```bash
npm install
npm run dev
```

API routes require Vercel env vars. Run `npx vercel env pull .env.local` after linking the project with `npx vercel link`.

---

## Hackathon

Tag [`hackathon-start`](https://github.com/tekr9d3r/SnapnInvest/compare/hackathon-start...main) marks the state of the project at the start of the hackathon. The compare link shows all commits made during the hackathon.
