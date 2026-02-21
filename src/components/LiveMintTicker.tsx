import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MintEntry {
  id: string;
  ticker: string;
  name: string | null;
  amount_invested: number | null;
  created_at: string;
  user_id: string;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function LiveMintTicker() {
  const [mints, setMints] = useState<(MintEntry & { wallet?: string })[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchMints = async () => {
      const { data } = await supabase
        .from("holdings")
        .select("id, ticker, name, amount_invested, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!data || data.length === 0) return;

      // Fetch wallet addresses for these users
      const userIds = [...new Set(data.map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, wallet_address")
        .in("id", userIds);

      const walletMap = new Map(profiles?.map((p) => [p.id, p.wallet_address]) ?? []);

      setMints(
        data.map((m) => ({
          ...m,
          wallet: walletMap.get(m.user_id) || m.user_id,
        }))
      );
    };

    fetchMints();
  }, []);

  // Cycle through mints
  useEffect(() => {
    if (mints.length === 0) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % mints.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [mints.length]);

  if (mints.length === 0) return null;

  const current = mints[activeIndex];

  return (
    <div className="mx-auto mt-8 w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-secondary/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border/50">
      <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Live Mints
        </span>
      </div>
      <div className="relative h-12 px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id + activeIndex}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="absolute inset-x-4 flex items-center gap-2 py-2.5"
          >
            <Zap className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate text-sm text-foreground">
              <span className="font-mono text-xs text-muted-foreground">
                {shortenAddress(current.wallet || "")}
              </span>
              {" minted "}
              <span className="font-semibold text-primary">
                ${current.ticker}
              </span>
              {current.amount_invested && (
                <span className="text-muted-foreground">
                  {" · $"}{Number(current.amount_invested).toFixed(0)}
                </span>
              )}
            </span>
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
              {timeAgo(current.created_at)}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
