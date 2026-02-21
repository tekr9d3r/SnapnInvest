

# Security Audit Results and Remediation Plan

## Findings Summary

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Service role key leaked into user passwords | CRITICAL | Needs fix |
| 2 | Holdings table publicly readable (financial data) | HIGH | Needs discussion |
| 3 | Profiles table publicly readable (wallet addresses) | MEDIUM | Needs discussion |
| 4 | Leaked password protection disabled | LOW | Needs fix |
| 5 | FeedPage imports removed `viem` package | BUG | Needs fix |
| 6 | Frontend secrets (Privy App ID, Supabase anon key) | OK | Publishable keys, safe |

---

## 1. CRITICAL: Service Role Key in Passwords

In `wallet-auth/index.ts`, the temporary password is constructed using the last 12 characters of the `SUPABASE_SERVICE_ROLE_KEY`:

```text
tempPassword = `wallet_${walletLower}_${SERVICE_ROLE_KEY.slice(-12)}`
```

If anyone discovers this pattern (e.g., by reading the open-source code), they could reconstruct passwords for any wallet address and impersonate users. The fix is to use a dedicated secret (e.g., `WALLET_AUTH_SECRET`) or a random hash instead.

**Fix:** Replace with a proper HMAC-based approach using a dedicated secret, so the password is unpredictable even if the code is visible.

## 2. HIGH: Holdings Table Publicly Readable

The `holdings` table has a SELECT policy of `true`, meaning anyone (even unauthenticated users) can query every user's investment portfolio -- tickers, amounts, share counts, purchase prices, and transaction hashes.

**Options:**
- A) Restrict SELECT to `auth.uid() = user_id` (private portfolios, no public feed)
- B) Keep public SELECT but create a limited view that hides sensitive columns like `amount_invested`, `shares`, `price_at_purchase` -- only showing `ticker`, `captured_image_url`, and `created_at` for the feed
- C) Move the feed to a backend function that returns only safe fields

**Recommendation:** Option B or C -- the feed is a core feature, but exact dollar amounts and share counts should be hidden from other users.

## 3. MEDIUM: Profiles Table Publicly Readable

The `profiles` table exposes all wallet addresses with a `true` SELECT policy. This lets anyone enumerate all users and their wallet addresses.

**Recommendation:** Since the feed needs wallet addresses for display, keep the public SELECT but ensure no additional PII is added to this table in the future. Alternatively, move wallet display logic to the backend function from item 2.

## 4. LOW: Leaked Password Protection

Supabase's leaked password protection feature is disabled. Since this app uses wallet-based auth (not user-chosen passwords), this is low risk, but it's a one-click fix.

**Fix:** Enable leaked password protection in auth settings.

## 5. BUG: FeedPage Imports `viem`

`FeedPage.tsx` imports `createPublicClient` and `http` from `viem`, and `mainnet` from `viem/chains`. But `viem` was removed as a dependency during the RainbowKit-to-Privy migration. This will cause a build error.

**Fix:** Replace the ENS resolution with an `ethers`-based approach (already installed) or remove ENS resolution entirely.

---

## Implementation Steps

### Step 1: Fix wallet-auth password generation
- Add a new secret `WALLET_AUTH_SECRET` (a random string)
- Use HMAC-SHA256 to derive passwords: `HMAC(WALLET_AUTH_SECRET, wallet_address)`
- Remove the service role key from password construction

### Step 2: Create a safe feed view or restrict holdings SELECT
- Create a database view `holdings_feed` that only exposes: `id`, `ticker`, `name`, `logo_url`, `captured_image_url`, `created_at`, `user_id`
- Omit: `amount_invested`, `shares`, `price_at_purchase`, `tx_hash`
- Update `FeedPage.tsx` and `LiveMintTicker.tsx` to query from the view

### Step 3: Fix viem import in FeedPage
- Replace ENS resolution with `ethers` provider or remove it

### Step 4: Enable leaked password protection
- Configure auth settings to enable this feature

