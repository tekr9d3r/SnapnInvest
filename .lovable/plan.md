

# Snap'nBuy — Updated MVP Plan

## Overview
A clean, Robinhood-inspired dApp where users snap a photo, AI identifies the brand, and they can buy tokenized stock on Robinhood Chain Testnet. Transactions are simulated for now.

---

## Screen 1: Welcome / Landing
- Clean, minimal hero screen with Snap'nBuy branding
- Brief explanation: "Snap a photo. Own the stock."
- How it works in 3 steps (Snap → Recognize → Buy)
- Prominent CTA button: **"Open Camera"**
- Robinhood-inspired design: dark theme, green accents, clean typography
- Bottom nav bar with: **Snap** | **Portfolio**

## Screen 2: Camera Capture
- Full-screen camera view using device camera
- Snap button at the bottom
- Option to upload from gallery as fallback
- Minimal UI overlay

## Screen 3: AI Recognition & Results
- Loading state while AI processes the image (Lovable AI with Gemini vision)
- Shows the identified brand/object with confidence
- If the brand matches one of the 5 tokenized stocks (TSLA, AMZN, PLTR, NFLX, AMD):
  - Display the stock name, ticker, and logo
  - Show 3 buy buttons: **$1 · $10 · $100**
- If no match: friendly message suggesting to try another product

## Screen 4: Wallet Connection
- MetaMask connection prompt (if not already connected)
- Show connected wallet address and ETH balance
- Network info: Robinhood Chain Testnet (Chain ID: 46630)

## Screen 5: Transaction Confirmation
- Summary: stock, amount in USD, simulated ETH equivalent
- "Confirm Purchase" button
- Simulated transaction execution (no real on-chain tx)
- Success screen with simulated tx hash, stock purchased, amount
- "Snap Again" CTA to return to camera

## Screen 6: Portfolio Page
- List of all simulated purchases the user has made (stored in local storage)
- Each entry shows: stock ticker, logo, amount invested, number of shares, date purchased
- Total portfolio value at the top with a simple simulated gain/loss indicator (green/red)
- Robinhood-style minimal card layout for each holding
- Empty state: "No holdings yet — snap something to start investing!"
- Accessible from the bottom nav bar

---

## Technical Notes
- **AI Recognition**: Lovable AI (Gemini vision model) via edge function to identify brands from photos
- **Wallet**: MetaMask integration via ethers.js for wallet connection on Robinhood Chain Testnet (Chain ID 46630)
- **Transactions**: Simulated — UI shows mock tx confirmation with fake tx hash
- **Portfolio Storage**: Local storage to persist simulated purchases across sessions
- **Stock contracts**: Hardcoded addresses for TSLA, AMZN, PLTR, NFLX, AMD
- **Backend**: Lovable Cloud for the AI edge function
- **Navigation**: Bottom tab bar (Snap / Portfolio) for mobile-first UX

