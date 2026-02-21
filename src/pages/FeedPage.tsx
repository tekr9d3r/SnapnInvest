import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StockLogo } from "@/components/StockLogo";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ExternalLink } from "lucide-react";

interface FeedItem {
  id: string;
  ticker: string;
  name: string | null;
  logo_url: string | null;
  amount_invested: number | null;
  shares: number | null;
  price_at_purchase: number | null;
  captured_image_url: string | null;
  tx_hash: string | null;
  created_at: string;
  wallet_address: string | null;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("holdings")
        .select("id, ticker, name, logo_url, amount_invested, shares, price_at_purchase, captured_image_url, tx_hash, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Feed load error:", error);
        setLoading(false);
        return;
      }

      // Fetch wallet addresses for all unique user_ids
      const userIds = [...new Set((data || []).map((d) => d.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, wallet_address")
        .in("id", userIds);

      const addrMap = new Map(
        (profiles || []).map((p) => [p.id, p.wallet_address])
      );

      setItems(
        (data || []).map((d) => ({
          ...d,
          wallet_address: addrMap.get(d.user_id) || null,
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main className="min-h-screen bg-background pb-24 pt-16">
      <div className="mx-auto max-w-md px-4 py-6">
        <h1 className="mb-6 text-xl font-bold text-foreground">Live Feed</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-20">
            No snaps yet. Be the first to snap a stock!
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex gap-3 rounded-xl border border-border bg-card p-3"
              >
                {/* Captured image thumbnail */}
                {item.captured_image_url ? (
                  <img
                    src={item.captured_image_url}
                    alt={`${item.ticker} snap`}
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-secondary flex items-center justify-center">
                    <StockLogo ticker={item.ticker} logoUrl={item.logo_url || undefined} size="sm" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StockLogo ticker={item.ticker} logoUrl={item.logo_url || undefined} size="sm" className="h-5 w-5" />
                    <span className="font-semibold text-sm text-foreground">{item.ticker}</span>
                    <span className="text-xs text-muted-foreground truncate">{item.name}</span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>${item.amount_invested?.toFixed(2)} invested</span>
                    <span>·</span>
                    <span>{item.shares?.toFixed(4)} shares</span>
                  </div>

                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {item.wallet_address
                        ? shortenAddress(item.wallet_address)
                        : "—"}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                  </div>

                  {item.tx_hash && (
                    <a
                      href={`https://explorer.robinhoodchain.com/tx/${item.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                    >
                      View tx <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
