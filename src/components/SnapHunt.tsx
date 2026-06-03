import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Trophy, Clock, Users } from "lucide-react";
import { StockLogo } from "@/components/StockLogo";
import { useWallet } from "@/contexts/WalletContext";
import { formatDistanceToNow } from "date-fns";

interface Challenge {
  id: string;
  name: string;
  description: string;
  tickers: string[];
  prize: string;
  starts_at: string;
  ends_at: string;
}

interface HuntState {
  challenge: Challenge | null;
  progress: string[];
  completedCount: number;
}

export function SnapHunt() {
  const { address } = useWallet();
  const [state, setState] = useState<HuntState>({ challenge: null, progress: [], completedCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = address
      ? `/api/challenge?userId=${encodeURIComponent(address)}`
      : "/api/challenge";

    fetch(url)
      .then((r) => r.json())
      .then((data) => setState(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [address]);

  const { challenge, progress, completedCount } = state;
  if (loading || !challenge) return null;

  const completed = progress.length >= challenge.tickers.length;
  const timeLeft = formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: false });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full max-w-md px-4"
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between bg-primary/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-display text-sm font-bold text-foreground">{challenge.name}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {completedCount} completed
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeLeft} left
            </span>
          </div>
        </div>

        {/* Prize */}
        <div className="border-b border-border px-4 py-2">
          <p className="text-[11px] text-muted-foreground">
            Prize: <span className="font-semibold text-primary">{challenge.prize}</span>
            <span className="ml-1 text-muted-foreground">· drawn from all who complete the hunt</span>
          </p>
        </div>

        {/* Ticker checklist */}
        <div className="divide-y divide-border">
          {challenge.tickers.map((ticker) => {
            const done = progress.includes(ticker);
            return (
              <div key={ticker} className="flex items-center gap-3 px-4 py-2.5">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                )}
                <StockLogo ticker={ticker} size="sm" className="h-6 w-6" />
                <span className={`flex-1 text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>
                  ${ticker}
                </span>
                {done && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    Minted ✓
                  </span>
                )}
                {!done && (
                  <span className="text-[10px] text-muted-foreground">Snap it →</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar + status */}
        <div className="px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{progress.length} / {challenge.tickers.length} found</span>
            {completed && (
              <span className="font-semibold text-primary">🎉 You're in the raffle!</span>
            )}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(progress.length / challenge.tickers.length) * 100}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
