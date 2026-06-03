import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, CheckCircle2, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

interface Hunter {
  rank: number;
  user_id: string;
  total_snaps: number;
  unique_stocks: number;
  challenge_progress: number;
  challenge_total: number;
  completed: boolean;
  last_snap_at: string;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const medals = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [challengeTickers, setChallengeTickers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setHunters(data.leaderboard ?? []);
        setChallengeTickers(data.challenge_tickers ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24 pt-16">
      <div className="mx-auto max-w-md px-4">
        {/* Header */}
        <div className="mt-4 mb-5 flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Leaderboard</h1>
            {challengeTickers.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Active hunt: {challengeTickers.map((t) => `$${t}`).join(" · ")}
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : hunters.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            No hunters yet — be the first to snap!
          </p>
        ) : (
          <div className="space-y-2">
            {hunters.map((hunter, i) => {
              const isMe = address && hunter.user_id.toLowerCase() === address.toLowerCase();
              return (
                <motion.div
                  key={hunter.user_id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => navigate(`/p/${hunter.user_id}`)}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors hover:bg-secondary/50
                    ${isMe ? "border-primary/40 bg-primary/5" : "border-border bg-card"}`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {i < 3
                      ? <span className="text-lg">{medals[i]}</span>
                      : <span className="font-mono text-sm font-bold text-muted-foreground">#{hunter.rank}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                    {hunter.user_id.slice(2, 4).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-foreground">
                        {shortenAddress(hunter.user_id)}
                      </span>
                      {isMe && <span className="text-[10px] text-primary font-semibold">(you)</span>}
                      {hunter.completed && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {hunter.total_snaps} snaps · {hunter.unique_stocks} stocks
                    </p>
                  </div>

                  {/* Challenge progress */}
                  {challengeTickers.length > 0 && (
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-bold ${hunter.completed ? "text-primary" : "text-foreground"}`}>
                        {hunter.challenge_progress}/{hunter.challenge_total}
                      </span>
                      <div className="flex gap-0.5">
                        {Array.from({ length: hunter.challenge_total }).map((_, j) => (
                          <div
                            key={j}
                            className={`h-1.5 w-4 rounded-full ${j < hunter.challenge_progress ? "bg-primary" : "bg-secondary"}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
