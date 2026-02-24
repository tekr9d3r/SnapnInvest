

## Analysis: Two Signatures During Wallet Connection

### What's Happening

1. **First signature** — Privy's built-in Sign-In With Ethereum (SIWE). This proves wallet ownership to Privy and is required by their SDK. Cannot be removed.

2. **Second signature** — Your custom backend authentication flow in `WalletContext.tsx` (line ~108-115). After Privy authenticates, the code asks for *another* signature to create a Supabase/backend session via the `wallet-auth` edge function.

### Is the second signature necessary?

**No.** It's redundant. Privy already verified the wallet. Instead of asking the user to sign again, you can use Privy's authentication token (available after the first signature) to verify the user on the backend, and issue a Supabase session based on that — eliminating the second signature entirely.

### Proposed Changes

1. **Update the `wallet-auth` edge function** to accept a Privy auth token instead of a raw signature. It would verify the token against Privy's public verification key (already returned in the API response) to confirm the user's wallet address, then issue a Supabase session.

2. **Update `WalletContext.tsx`** to skip the manual `signMessage` call. Instead, after Privy authenticates, retrieve the Privy auth token via `getAccessToken()` and send it to the edge function.

3. **Result**: Users sign only once (Privy's SIWE), and the backend session is created automatically.

### Technical Details

**`WalletContext.tsx`** — Replace `authenticateWallet` to use Privy's access token:
- Remove the `signMessage` flow
- Call `getAccessToken()` from Privy
- Send the access token to the `wallet-auth` edge function

**`supabase/functions/wallet-auth/index.ts`** — Update to:
- Accept `{ privyToken, address }` instead of `{ signature, message, address }`
- Verify the Privy token using Privy's public key (ECDSA ES256)
- Extract the wallet address from the verified token
- Issue Supabase session as before

