

# Replace RainbowKit with Privy Wallet Integration

## Overview
Remove RainbowKit and wagmi, and replace them with Privy's React SDK for wallet connection, authentication, and signing. Privy provides a polished connect modal with support for external wallets (MetaMask, WalletConnect, Coinbase) plus embedded wallets and social login options.

## Prerequisites
- A **Privy App ID** is required. You'll need to create a free account at [privy.io](https://privy.io), create an app, and copy the App ID.
- Optionally a **Privy Client ID** for additional security.

## Changes

### 1. Install Privy, remove RainbowKit/wagmi
- Add `@privy-io/react-auth` package
- Remove `@rainbow-me/rainbowkit`, `wagmi`, and `viem` packages

### 2. Delete `src/lib/wagmi.ts`
- No longer needed -- Privy handles chain config and wallet connection internally.

### 3. Update `src/App.tsx`
- Remove `WagmiProvider`, `RainbowKitProvider`, and related imports
- Wrap the app with `PrivyProvider` configured with:
  - Your Privy App ID (stored as a secret)
  - Robinhood Chain Testnet as a custom chain
  - Dark theme appearance matching the app's design
  - External wallet support (MetaMask, WalletConnect, Coinbase)

### 4. Rewrite `src/contexts/WalletContext.tsx`
- Replace all wagmi hooks (`useAccount`, `useDisconnect`, `useSignMessage`) with Privy equivalents (`usePrivy`, `useWallets`)
- Use `login()` from Privy to open the connect modal
- Use `logout()` from Privy to disconnect
- Use Privy's wallet provider to sign messages for the backend auth flow
- Keep the existing backend authentication logic (calling the `wallet-auth` edge function) intact

### 5. Update `src/components/TopBar.tsx`
- Replace `<ConnectButton />` from RainbowKit with a custom button that:
  - Shows "Connect" when not logged in, calling Privy's `login()`
  - Shows the shortened wallet address when connected
  - Provides a disconnect option

### 6. No changes to backend
- The `wallet-auth` edge function stays the same -- it receives an address, signature, and message regardless of wallet provider.

## Technical Details

```text
Before:                          After:
WagmiProvider                    PrivyProvider
  RainbowKitProvider               QueryClientProvider
    QueryClientProvider              WalletProvider (context)
      WalletProvider (context)         App routes
        App routes
```

Key Privy hooks used:
- `usePrivy()` -- `ready`, `authenticated`, `user`, `login()`, `logout()`
- `useWallets()` -- access connected wallet, get provider for signing
- `useSignMessage()` from Privy or direct ethers provider signing

