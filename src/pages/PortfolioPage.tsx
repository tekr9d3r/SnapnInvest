import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StockLogo } from "@/components/StockLogo";
import { getPortfolioSummary } from "@/lib/portfolio";

const PortfolioPage = () => {
  const navigate = useNavigate();
  const { summaries, totalInvested, totalValue, totalGainLoss } = useMemo(
    () => getPortfolioSummary(),
    []
  );

  const isUp = totalGainLoss >= 0;

  return (
    <div className="min-h-screen bg-background px-6 pb-24 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Portfolio</h1>
      </div>

      {summaries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center pt-24 text-center"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
            <TrendingUp className="h-10 w-10 text-primary" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">No holdings yet</h2>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Snap something to start investing! Point your camera at a Tesla, Amazon, or Netflix product.
          </p>
          <Button onClick={() => navigate("/camera")} className="mt-6 gap-2 rounded-xl">
            <Camera className="h-4 w-4" />
            Start Snapping
          </Button>
        </motion.div>
      ) : (
        <>
          {/* Summary card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-border bg-card p-6"
          >
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="mt-1 font-display text-3xl font-bold text-foreground">
              ${totalValue.toFixed(2)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {isUp ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger" />
              )}
              <span
                className={`text-sm font-semibold ${isUp ? "text-success" : "text-danger"}`}
              >
                {isUp ? "+" : ""}${totalGainLoss.toFixed(2)} (
                {totalInvested > 0
                  ? ((totalGainLoss / totalInvested) * 100).toFixed(1)
                  : "0"}
                %)
              </span>
            </div>
          </motion.div>

          {/* Holdings */}
          <div className="space-y-3">
            {summaries.map((s, i) => (
              <motion.div
                key={s.ticker}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                {/* Captured photo */}
                {s.latestImage && (
                  <div className="relative h-36 w-full overflow-hidden">
                    <img
                      src={s.latestImage}
                      alt={`Photo taken to buy ${s.ticker}`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/80" />
                    <div className="absolute bottom-2 left-3 flex items-center gap-1.5">
                      <Camera className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Snapped to buy</span>
                    </div>
                  </div>
                )}

                {/* Stock info */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <StockLogo ticker={s.ticker} logoUrl={s.logoUrl} size="sm" />
                    <div>
                      <p className="font-semibold text-foreground">{s.ticker}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.shares.toFixed(4)} shares · ${s.invested.toFixed(2)} invested
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      ${s.currentValue.toFixed(2)}
                    </p>
                    <p
                      className={`text-xs font-medium ${
                        s.gainLoss >= 0 ? "text-success" : "text-danger"
                      }`}
                    >
                      {s.gainLoss >= 0 ? "+" : ""}
                      {s.gainLossPercent.toFixed(1)}%
                    </p>
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

export default PortfolioPage;
