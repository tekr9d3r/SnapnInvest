

# Snap'n'Buy: Onchain Mode

## Overview

Add a **Demo / Onchain toggle** in the bottom nav. The existing Demo mode stays untouched. The new Onchain mode introduces real wallet connectivity, database-backed portfolio storage, and wallet-based authentication -- all while keeping the camera minting flow as a simulated experience.

## How It Works

### Demo vs Onchain Toggle
- A pill-style switch (Demo | Onchain) sits above the bottom nav tabs
- Selection is persisted in localStorage and provided via React Context to the entire app
- All pages adapt their behavior based on the active mode

### Wallet-Only Authentication (Onchain Mode)
The flow:
1. User clicks "Connect Wallet" -- MetaMask prompts for account access
2. App requests a signature of a unique nonce message (proves wallet ownership)
3. An edge function verifies the signature, creates/finds the user in the database, and returns a Supabase JWT
4. The app uses that JWT for all subsequent database operations

This means: **no email, no password** -- your wallet IS your identity.

### Database Schema

**profiles table**
- `id` (uuid, PK, references auth.users)
- `wallet_address` (text, unique, not null)
- `created_at` (timestamptz)

**holdings table**
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, not null)
- `ticker` (text, not null)
- `name` (text)
- `logo_url` (text)
- `amount_invested` (numeric)
- `shares` (numeric)
- `price_at_purchase` (numeric)
- `captured_image_url` (text) -- URL from storage bucket
- `tx_hash` (text)
- `created_at` (timestamptz)

**Storage bucket**: `captured-images` (public) for portfolio photos

RLS policies ensure users can only read/write their own holdings and profile.

### Portfolio in Onchain Mode
- Shows real ETH balance from connected wallet (via RPC call)
- Shows "fake" minted token holdings stored in the database (from Snap'n'Buy purchases)
- Both are displayed together: real ETH at the top, then tokenized stock holdings below
- Captured images are stored in Cloud storage (not localStorage), accessible from any device

### Camera + Minting Flow (Onchain Mode)
- Same camera and AI brand identification flow as Demo
- Confirmation screen still simulates the on-chain transaction (fake tx hash, animated phases)
- But instead of saving to localStorage, it:
  - Uploads the compressed image to Cloud storage
  - Saves the holding record to the database
  - Links it to the authenticated user's profile

### Combining Real Wallet + Fake Tokens
The portfolio will have two sections:
1. **Wallet Assets** -- real ETH balance read from the connected wallet on Robinhood Chain
2. **Snapped Stocks** -- simulated tokenized holdings from Snap'n'Buy, stored in the database with a "Simulated" badge

This makes it clear what's real vs demo while showing them together.

## Technical Details

### New Files
- `src/contexts/AppModeContext.tsx` -- React context providing `mode` ("demo" | "onchain") and `setMode`
- `src/contexts/WalletContext.tsx` -- React context managing wallet connection state, address, auth session
- `src/components/ModeToggle.tsx` -- Demo/Onchain pill switch component
- `src/pages/OnchainPortfolioPage.tsx` -- Portfolio page for onchain mode with real balances + DB holdings

### Edge Functions
- `supabase/functions/wallet-auth/index.ts` -- Verifies wallet signature, creates user if needed, returns JWT

### Modified Files
- `src/components/BottomNav.tsx` -- Add mode toggle above tabs; conditionally show "Connect Wallet" instead of some tabs when in Onchain mode
- `src/App.tsx` -- Wrap with AppModeContext and WalletContext providers; route to correct portfolio page based on mode
- `src/pages/ConfirmPage.tsx` -- In onchain mode, save holding to database + upload image to storage instead of localStorage
- `src/pages/Index.tsx` -- In onchain mode, show "Connect Wallet" CTA if not connected

### Database Migrations
1. Create `profiles` table with wallet_address
2. Create `holdings` table
3. Create `captured-images` storage bucket
4. Set up RLS policies (users access only their own data)
5. Create trigger to auto-create profile on auth.users insert

### Authentication Edge Function Logic
```text
Client                    Edge Function              Database
  |                           |                         |
  |-- POST {address, sig} --> |                         |
  |                           |-- verify signature      |
  |                           |-- upsert user --------> |
  |                           |<-- user record ---------|
  |                           |-- sign JWT              |
  |<-- { token, user } -------|                         |
```

The edge function uses `SUPABASE_SERVICE_ROLE_KEY` to create users in auth.users and sign JWTs, so no external auth provider is needed.

### Key Considerations
- **No MetaMask on mobile?** Show a message directing users to use MetaMask's in-app browser or a compatible wallet browser
- **Session persistence**: JWT stored in Supabase client session; user stays logged in until they disconnect wallet
- **localStorage quota**: In Onchain mode, images go to cloud storage, solving the 5MB limit entirely
- **Demo mode unchanged**: All existing localStorage-based logic remains for Demo mode

