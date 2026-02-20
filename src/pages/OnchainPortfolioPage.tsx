import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, TrendingUp, Wallet, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StockLogo } from "@/components/StockLogo";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";

interface DbHolding {
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
}

const OnchainPortfolioPage = () => {
  const navigate = useNavigate();
  const { address, shortAddress, balance, isAuthenticated, connect, isConnecting } = useWallet();
  const [holdings, setHoldings] = useState<DbHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchHoldings();
  }, [isAuthenticated]);

  const fetchHoldings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("holdings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setHoldings(data as unknown as DbHolding[]);
    }
    setLoading(false);
  };

  // Group holdings by ticker
  const grouped = new Map<string, {
    ticker: string;
    name: string;
    logoUrl: string | null;
    shares: number;
    invested: number;
    priceAtPurchase: number;
    latestImage: string | null;
  }>();

  for (const h of holdings) {
    const existing = grouped.get(h.ticker);
    if (existing) {
      existing.shares += h.shares || 0;
      existing.invested += h.amount_invested || 0;
      if (!existing.latestImage && h.captured_image_url) {
        existing.latestImage = h.captured_image_url;
      }
    } else {
      grouped.set(h.ticker, {
        ticker: h.ticker,
        name: h.name || h.ticker,
        logoUrl: h.logo_url,
        shares: h.shares || 0,
        invested: h.amount_invested || 0,
        priceAtPurchase: h.price_at_purchase || 0,
        latestImage: h.captured_image_url,
      });
    }
  }

  const summaries = Array.from(grouped.values());
  const totalInvested = summaries.reduce((sum, s) => sum + s.invested, 0);
  const totalValue = summaries.reduce((sum, s) => sum + s.shares * s.priceAtPurchase, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background px-6 pb-24 pt-6">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-foreground">Portfolio</h1>
          <Badge variant="outline" className="mt-1 text-primary border-primary">Onchain</Badge>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pt-20 text-center"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
            <Wallet className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">Connect your wallet</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Connect MetaMask to view your onchain portfolio and snapped stock holdings.
          </p>
          <Button onClick={connect} disabled={isConnecting} className="mt-6 gap-2 rounded-xl">
            {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-6 pb-24 pt-6">
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
              onClick={() => setLightboxImage(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={lightboxImage}
              alt="Full size"
              className="max-h-full max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Portfolio</h1>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="outline" className="text-primary border-primary">Onchain</Badge>
          <span className="text-xs text-muted-foreground font-mono">{shortAddress}</span>
        </div>
      </div>

      {/* Wallet Assets */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 rounded-2xl border border-border bg-card p-5"
      >
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Wallet Balance</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-display text-3xl font-bold text-foreground">{balance}</span>
          <span className="text-sm text-muted-foreground">ETH</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Robinhood Chain Testnet</p>
      </motion.div>

      {/* Snapped Stocks */}
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">Snapped Stocks</h2>
        <Badge variant="secondary" className="text-[10px]">Simulated</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : summaries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center py-12 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">No snapped stocks yet</p>
          <Button onClick={() => navigate("/camera")} className="mt-4 gap-2 rounded-xl" size="sm">
            <Camera className="h-4 w-4" />
            Start Snapping
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Invested</span>
              <span className="font-semibold text-foreground">${totalInvested.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Current Value</span>
              <span className="font-semibold text-foreground">${totalValue.toFixed(2)}</span>
            </div>
          </motion.div>

          {/* Holdings list */}
          <div className="space-y-3">
            {summaries.map((s, i) => (
              <motion.div
                key={s.ticker}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                {s.latestImage && (
                  <div
                    className="relative h-36 w-full cursor-zoom-in overflow-hidden"
                    onClick={() => setLightboxImage(s.latestImage!)}
                  >
                    <img
                      src={s.latestImage}
                      alt={`Photo for ${s.ticker}`}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/80" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                      <Camera className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Tap to expand</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <StockLogo ticker={s.ticker} logoUrl={s.logoUrl || undefined} size="sm" />
                    <div>
                      <p className="font-semibold text-foreground">{s.ticker}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.shares.toFixed(4)} shares · ${s.invested.toFixed(2)} invested
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ${(s.shares * s.priceAtPurchase).toFixed(2)}
                    </p>
                    <Badge variant="secondary" className="text-[9px]">Simulated</Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OnchainPortfolioPage;
