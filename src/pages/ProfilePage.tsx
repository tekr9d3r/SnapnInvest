import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Trophy, Zap, BarChart2, CheckCircle2, Circle, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockLogo } from "@/components/StockLogo";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Holding {
  id: string;
  ticker: string;
  name: string | null;
  logo_url: string | null;
  amount_invested: number | null;
  captured_image_url: string | null;
  tx_hash: string | null;
  created_at: string;
}

interface Challenge {
  id: string;
  name: string;
  tickers: string[];
  prize: string;
  ends_at: string;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ProfilePage() {
  const { address: connectedAddress } = useWallet();
  const { address: paramAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();

  const address = paramAddress || connectedAddress;
  const isOwnProfile = !paramAddress || paramAddress.toLowerCase() === connectedAddress?.toLowerCase();

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (!address) { setLoading(false); return; }

    Promise.all([
      fetch(`/api/holdings?userId=${encodeURIComponent(address)}`).then((r) => r.json()),
      fetch(`/api/challenge?userId=${encodeURIComponent(address)}`).then((r) => r.json()),
    ])
      .then(([h, c]) => {
        setHoldings(Array.isArray(h) ? h : []);
        setChallenge(c.challenge ?? null);
        setProgress(c.progress ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  if (!address) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
        <p className="text-sm text-muted-foreground">Connect your wallet to view your profile</p>
      </div>
    );
  }

  const totalInvested = holdings.reduce((s, h) => s + (h.amount_invested || 0), 0);
  const uniqueStocks = new Set(holdings.map((h) => h.ticker)).size;
  const snapsWithPhotos = holdings.filter((h) => h.captured_image_url);
  const challengeComplete = challenge && progress.length >= challenge.tickers.length;

  return (
    <div className="min-h-screen bg-background pb-24 pt-16">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="mx-auto max-w-md px-4">
        {/* Identity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
            {address.slice(2, 4).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-foreground">{shortenAddress(address)}</span>
              {isOwnProfile && <Badge variant="outline" className="text-[10px] text-primary border-primary">You</Badge>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-muted-foreground truncate">{address}</span>
              <button onClick={() => { navigator.clipboard.writeText(address); toast.success("Copied!"); }}>
                <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: Camera, label: "Snaps", value: holdings.length },
            { icon: BarChart2, label: "Stocks", value: uniqueStocks },
            { icon: Zap, label: "Invested", value: `$${totalInvested.toFixed(0)}` },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center rounded-2xl border border-border bg-card p-3">
              <s.icon className="mb-1 h-4 w-4 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">{s.value}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Active challenge progress */}
        {challenge && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mt-4 rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between bg-primary/10 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">{challenge.name}</span>
              </div>
              {challengeComplete
                ? <Badge className="text-[10px] bg-primary text-primary-foreground">In Raffle 🎉</Badge>
                : <span className="text-[10px] text-muted-foreground">{progress.length}/{challenge.tickers.length} found</span>}
            </div>
            <div className="divide-y divide-border">
              {challenge.tickers.map((ticker) => {
                const done = progress.includes(ticker);
                return (
                  <div key={ticker} className="flex items-center gap-3 px-4 py-2">
                    {done ? <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                    <StockLogo ticker={ticker} size="sm" className="h-5 w-5" />
                    <span className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>${ticker}</span>
                    {!done && <span className="ml-auto text-[10px] text-muted-foreground">Snap it →</span>}
                  </div>
                );
              })}
            </div>
            <div className="px-4 pb-3 pt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${(progress.length / challenge.tickers.length) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">Prize: <span className="text-primary font-semibold">{challenge.prize}</span></p>
            </div>
          </motion.div>
        )}

        {/* Snapped photos grid */}
        {snapsWithPhotos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
            <h2 className="mb-3 font-display text-base font-bold text-foreground">Snaps</h2>
            <div className="grid grid-cols-2 gap-2">
              {snapsWithPhotos.map((h) => (
                <div key={h.id} className="overflow-hidden rounded-xl border border-border bg-card cursor-zoom-in"
                  onClick={() => setLightbox(h.captured_image_url!)}>
                  <img src={h.captured_image_url!} alt={h.ticker} className="h-32 w-full object-cover" />
                  <div className="flex items-center justify-between px-2.5 py-2">
                    <div className="flex items-center gap-1.5">
                      <StockLogo ticker={h.ticker} size="sm" className="h-4 w-4" />
                      <span className="text-xs font-bold text-foreground">${h.ticker}</span>
                    </div>
                    {h.tx_hash && (
                      <a href={`https://explorer.testnet.chain.robinhood.com/tx/${h.tx_hash}`}
                        target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                        tx <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <p className="px-2.5 pb-2 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && holdings.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground">No snaps yet</p>
            {isOwnProfile && (
              <Button onClick={() => navigate("/camera")} className="mt-4 gap-2 rounded-xl" size="sm">
                <Camera className="h-4 w-4" /> Start Snapping
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
