import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Camera, ArrowLeft, Loader2, ExternalLink, Link, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockLogo } from "@/components/StockLogo";
import { Stock } from "@/lib/types";
import { generateTxHash } from "@/lib/wallet";
import { addHolding } from "@/lib/portfolio";
import arbitrumLogo from "@/assets/arbitrum-logo.png";
import robinhoodLogo from "@/assets/robinhood-logo.png";

type Phase = "confirm" | "connecting" | "minting" | "confirming" | "success";

const PHASE_MESSAGES: Record<string, { title: string; sub: string }> = {
  connecting: { title: "Connecting to Robinhood Chain...", sub: "Establishing secure RPC connection" },
  minting: { title: "Minting tokenized shares...", sub: "Settling on-chain via Arbitrum • Paying gas in ETH" },
  confirming: { title: "Confirming on-chain...", sub: "Waiting for block confirmation • ~2s finality" },
};

const ConfirmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stock, amount } = (location.state as { stock: Stock; amount: number; image: string }) || {};

  const [phase, setPhase] = useState<Phase>("confirm");
  const [txHash, setTxHash] = useState("");

  if (!stock || !amount) {
    navigate("/");
    return null;
  }

  const shares = amount / stock.currentPrice;

  const handleConfirm = async () => {
    setPhase("connecting");
    await new Promise((r) => setTimeout(r, 2200));
    setPhase("minting");
    await new Promise((r) => setTimeout(r, 2800));
    setPhase("confirming");
    await new Promise((r) => setTimeout(r, 2400));
    const hash = generateTxHash();
    setTxHash(hash);
    addHolding({
      ticker: stock.ticker,
      name: stock.name,
      logo: stock.logo,
      logoUrl: stock.logoUrl,
      amountInvested: amount,
      shares,
      priceAtPurchase: stock.currentPrice,
    });
    setPhase("success");
  };

  const isProcessing = phase === "connecting" || phase === "minting" || phase === "confirming";

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        {phase === "confirm" ? (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-10" />
        )}
        <span className="font-display text-sm font-semibold">
          {phase === "success" ? "Done!" : "Confirm Purchase"}
        </span>
        <div className="w-10" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {/* Confirm */}
          {phase === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex w-full max-w-sm flex-col"
            >
              {/* Order summary */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <StockLogo ticker={stock.ticker} logoUrl={stock.logoUrl} size="lg" />
                  <div>
                    <p className="font-display text-lg font-bold text-foreground">{stock.name}</p>
                    <p className="text-sm text-muted-foreground">{stock.ticker}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-foreground">${amount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price per share</span>
                    <span className="text-foreground">${stock.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shares</span>
                    <span className="text-foreground">{shares.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span className="flex items-center gap-1 text-foreground">
                      <img src={robinhoodLogo} alt="" className="h-3.5 w-3.5 rounded-sm" />
                      Robinhood Chain
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gas fee</span>
                    <span className="text-foreground">~$0.01 ETH</span>
                  </div>
                </div>
              </div>

              {/* Chain badges */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                  <img src={robinhoodLogo} alt="" className="h-3.5 w-3.5 rounded-sm" />
                  <span className="text-[10px] font-semibold text-muted-foreground">Robinhood Chain</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
                  <img src={arbitrumLogo} alt="" className="h-3.5 w-3.5 rounded-sm" />
                  <span className="text-[10px] font-semibold text-muted-foreground">Arbitrum</span>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                className="mt-6 h-14 w-full gap-2 rounded-2xl text-base font-semibold"
              >
                Buy ${amount} of {stock.ticker}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">Demo · No real money involved</p>
            </motion.div>
          )}

          {/* Processing phases */}
          {isProcessing && (
            <motion.div
              key={phase}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              {/* Animated icon */}
              <div className="relative mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                >
                  <Loader2 className="h-14 w-14 text-primary" />
                </motion.div>
                {phase === "connecting" && (
                  <Link className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-primary" />
                )}
                {phase === "minting" && (
                  <Cpu className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-primary" />
                )}
              </div>

              <p className="font-display text-lg font-semibold text-foreground">
                {PHASE_MESSAGES[phase]?.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {PHASE_MESSAGES[phase]?.sub}
              </p>

              {/* Chain info */}
              <div className="mt-6 flex items-center gap-3">
                <img src={robinhoodLogo} alt="" className="h-5 w-5 rounded-sm" />
                <span className="text-xs text-muted-foreground">→</span>
                <img src={arbitrumLogo} alt="" className="h-5 w-5 rounded-sm" />
              </div>

              {/* Progress dots */}
              <div className="mt-4 flex gap-2">
                {["connecting", "minting", "confirming"].map((p) => (
                  <div
                    key={p}
                    className={`h-1.5 w-8 rounded-full transition-colors ${
                      ["connecting", "minting", "confirming"].indexOf(phase) >=
                      ["connecting", "minting", "confirming"].indexOf(p)
                        ? "bg-primary"
                        : "bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Success */}
          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex w-full max-w-sm flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary glow-primary-lg"
              >
                <Check className="h-10 w-10 text-primary-foreground" />
              </motion.div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Purchase Complete!
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                You bought {shares.toFixed(6)} {stock.ticker} for ${amount}
              </p>

              <div className="mt-6 w-full space-y-2 rounded-2xl bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tx Hash</span>
                  <span className="flex items-center gap-1 font-mono text-xs text-primary">
                    {txHash.slice(0, 10)}...{txHash.slice(-6)}
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Network</span>
                  <span className="flex items-center gap-1 text-xs text-foreground">
                    <img src={arbitrumLogo} alt="" className="h-3 w-3 rounded-sm" />
                    Arbitrum
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Gas paid</span>
                  <span className="text-xs text-foreground">~0.000003 ETH</span>
                </div>
              </div>

              <div className="mt-6 flex w-full gap-3">
                <Button
                  variant="secondary"
                  onClick={() => navigate("/portfolio")}
                  className="flex-1 rounded-xl"
                >
                  Portfolio
                </Button>
                <Button
                  onClick={() => navigate("/camera")}
                  className="flex-1 gap-2 rounded-xl"
                >
                  <Camera className="h-4 w-4" />
                  Snap Again
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConfirmPage;
