

# Support All Publicly Traded Stocks

## Goal
Replace the hardcoded 5-stock limitation with dynamic support for any publicly traded stock, using real market data and logos -- without maintaining a local database.

## Approach

### 1. Dynamic Stock Logo via URL Service
Instead of bundled PNG assets, use a free logo URL service. The `StockLogo` component will render logos from a URL like:
- `https://logo.clearbit.com/{companyDomain}` or
- `https://assets.parqet.com/logos/symbol/{TICKER}` or similar

Fall back to showing the ticker text if no logo loads.

### 2. New Backend Function: `stock-lookup`
A new backend function that takes a ticker symbol and returns:
- Whether the stock exists
- Company name
- Current price (from a free finance API like Yahoo Finance's unofficial endpoint)
- Logo URL

This keeps all external API calls server-side and avoids needing an API key.

### 3. Update Brand Identification
The existing AI brand identification function will be updated to:
- Identify ANY publicly traded company (not just 5)
- Return the ticker symbol and company name
- Remove the hardcoded ticker whitelist

### 4. Update the Result Flow
After the AI identifies a brand:
1. Call `stock-lookup` with the ticker to get real price data
2. Display the stock with its real price and dynamic logo
3. Proceed to purchase as before

## Technical Details

### Files to Create
- `supabase/functions/stock-lookup/index.ts` -- Fetches real stock price from Yahoo Finance's free chart API (`https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}`) and constructs a logo URL

### Files to Modify
- `src/lib/types.ts` -- Remove `SUPPORTED_STOCKS` and `BRAND_KEYWORDS` constants, keep `Stock` interface (add optional `logoUrl` field)
- `src/components/StockLogo.tsx` -- Accept a `logoUrl` prop; fall back to ticker text if image fails to load. Remove hardcoded PNG imports
- `supabase/functions/identify-brand/index.ts` -- Remove ticker whitelist; instruct AI to return any valid US stock ticker
- `src/pages/ResultPage.tsx` -- After AI returns a ticker, call `stock-lookup` to get price/name/logo, then build the `Stock` object dynamically
- `src/pages/ConfirmPage.tsx` -- Use `logoUrl` from the stock object instead of the `StockLogo` component's hardcoded map
- `src/lib/portfolio.ts` -- Update `getPortfolioSummary` to not rely on `SUPPORTED_STOCKS` for current price; store `logoUrl` in holdings
- `src/lib/types.ts` -- Add `logoUrl` to `Holding` interface
- `src/pages/PortfolioPage.tsx` -- Pass `logoUrl` to `StockLogo`
- `src/pages/Index.tsx` -- Update the "Supported stocks" section to say something like "Works with any stock" instead of showing 5 specific tickers

### Stock Logo Strategy
Use `https://logo.clearbit.com/{domain}` where domain comes from the AI or a simple mapping. Alternatively, use `https://assets.parqet.com/logos/symbol/{TICKER}` which works directly with tickers. The `StockLogo` component will handle load errors gracefully with a text fallback.

### Yahoo Finance API (no key needed)
```
GET https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}?range=1d&interval=1d
```
Returns current price, company name, and currency. Free, no authentication required.

