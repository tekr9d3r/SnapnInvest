import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StockLogo } from "@/components/StockLogo";
import { formatDistanceToNow } from "date-fns";
import { Loader2, ExternalLink, X, Trophy } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "@/hooks/use-toast";
import { JsonRpcProvider } from "ethers";

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
  user_id: string;
  wallet_address: string | null;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function WalletAvatar({ address }: { address: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
      {address.slice(2, 4).toUpperCase()}
    </div>
  );
}

const ethProvider = new JsonRpcProvider("https://eth.llamarpc.com");

async function resolveENSBatch(addresses: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = [...new Set(addresses.filter(Boolean))];
  await Promise.allSettled(
    unique.map(async (addr) => {
      try {
        const name = await ethProvider.lookupAddress(addr);
        if (name) map.set(addr.toLowerCase(), name);
      } catch {}
    })
  );
  return map;
}

function tickerColor(ticker: string): string {
  const colors = [
    "from-blue-100 to-blue-200",
    "from-purple-100 to-purple-200",
    "from-amber-100 to-amber-200",
    "from-rose-100 to-rose-200",
    "from-teal-100 to-teal-200",
    "from-orange-100 to-orange-200",
    "from-indigo-100 to-indigo-200",
  ];
  let hash = 0;
  for (let i = 0; i < ticker.length; i++) hash = ticker.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ensNames, setEnsNames] = useState<Map<string, string>>(new Map());
  const [huntTickers, setHuntTickers] = useState<string[]>([]);
  const { userId } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      fetch("/api/challenge").then((r) => r.json()).then((d) => {
        if (d.challenge?.tickers) setHuntTickers(d.challenge.tickers);
      }).catch(() => {});

      try {
        const res = await fetch("/api/holdings?limit=50");
        if (!res.ok) throw new Error("Failed to load feed");
        const data: FeedItem[] = await res.json();
        const feedItems = data.map((d) => ({ ...d, wallet_address: d.user_id }));
        setItems(feedItems);

        const walletAddrs = feedItems.map((i) => i.wallet_address).filter(Boolean) as string[];
        if (walletAddrs.length > 0) {
          resolveENSBatch(walletAddrs).then(setEnsNames);
        }
      } catch (err) {
        console.error("Feed load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/holdings/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast({ title: "Failed to delete", description: err.error || "Unknown error", variant: "destructive" });
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Snap removed from feed" });
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24 pt-16">
      <div className="mx-auto max-w-md px-4 py-4">
        <h1 className="mb-5 text-xl font-bold text-gray-900">Live Feed</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-20">
            No snaps yet. Be the first to snap a stock!
          </p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const walletAddr = item.wallet_address || item.user_id;
              const displayName = ensNames.get(walletAddr.toLowerCase()) || shortenAddress(walletAddr);
              const isHunt = huntTickers.includes(item.ticker);
              const isOwn = userId && item.user_id === userId;

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  {/* Post header */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <button
                      onClick={() => navigate(`/p/${item.user_id}`)}
                      className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
                    >
                      <WalletAvatar address={walletAddr} />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{displayName}</p>
                        <p className="text-[11px] text-gray-400">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      {isHunt && (
                        <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                          <Trophy className="h-2.5 w-2.5" />
                          Hunt
                        </span>
                      )}
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-full p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                          aria-label="Remove snap"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Photo or gradient placeholder */}
                  {item.captured_image_url ? (
                    <img
                      src={item.captured_image_url}
                      alt={`${item.ticker} snap`}
                      className="w-full aspect-[4/3] object-cover"
                    />
                  ) : (
                    <div className={`w-full aspect-[4/3] bg-gradient-to-br ${tickerColor(item.ticker)} flex items-center justify-center`}>
                      <StockLogo ticker={item.ticker} logoUrl={item.logo_url || undefined} size="lg" className="h-16 w-16 opacity-50" />
                    </div>
                  )}

                  {/* Caption */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <StockLogo ticker={item.ticker} logoUrl={item.logo_url || undefined} size="sm" className="h-5 w-5" />
                      <span className="font-bold text-sm text-gray-900">${item.ticker}</span>
                      {item.name && (
                        <span className="text-sm text-gray-400 truncate">{item.name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {item.amount_invested != null && (
                        <span>${item.amount_invested.toFixed(2)} invested</span>
                      )}
                      {item.shares != null && item.amount_invested != null && (
                        <span className="text-gray-300"> · </span>
                      )}
                      {item.shares != null && (
                        <span>{item.shares.toFixed(4)} shares</span>
                      )}
                    </p>

                    {item.tx_hash && (
                      <a
                        href={`https://explorer.testnet.chain.robinhood.com/tx/${item.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-green-600 hover:text-green-700 hover:underline transition-colors"
                      >
                        View on-chain <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
