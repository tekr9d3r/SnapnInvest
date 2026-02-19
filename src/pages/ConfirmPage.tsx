import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Wallet, Camera, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Stock } from "@/lib/types";
import { connectWallet, shortenAddress, generateTxHash, getBalance } from "@/lib/wallet";
import { addHolding } from "@/lib/portfolio";

type Phase = "wallet" | "confirm" | "processing" | "success";

const ConfirmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stock, amount } = (location.state as { stock: Stock; amount: number; image: string }) || {};

  const [phase, setPhase] = useState<Phase>("wallet");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");
  const [txHash, setTxHash] = useState("");

  if (!stock || !amount) {
    navigate("/");
    return null;
  }

  const shares = amount / stock.currentPrice;
  const ethEquivalent = (amount * 0.00045).toFixed(6);

  const handleConnect = async () => {
    const addr = await connectWallet();
    if (addr) {
      setWalletAddress(addr);
      const bal = await getBalance(addr);
      setBalance(bal);
      setPhase("confirm");
    }
  };

  const handleConfirm = async () => {
    setPhase("processing");
    // Simulate transaction
    await new Promise((r) => setTimeout(r, 2500));
    const hash = generateTxHash();
    setTxHash(hash);
    addHolding({
      ticker: stock.ticker,
      name: stock.name,
      logo: stock.logo,
      amountInvested: amount,
      shares,
      priceAtPurchase: stock.currentPrice,
    });
    setPhase("success");
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        {phase !== "processing" && phase !== "success" ? (
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-10" />
        )}
        <span className="font-display text-sm font-semibold">
          {phase === "success" ? "🎉 Done!" : "Confirm Purchase"}
        </span>
        <div className="w-10" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <AnimatePresence mode="wait">
          {/* Wallet Connect */}
          {phase === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex w-full max-w-sm flex-col items-center text-center"
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-secondary">
                <Wallet className="h-9 w-9 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Connect Wallet
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Connect MetaMask to purchase on Robinhood Chain Testnet
              </p>
              <Button onClick={handleConnect} className="mt-8 h-14 w-full gap-2 rounded-2xl text-base font-semibold">
                <Wallet className="h-5 w-5" />
                Connect MetaMask
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Chain ID: 46630 · Robinhood Testnet
              </p>
            </motion.div>
          )}

          {/* Confirm */}
          {phase === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex w-full max-w-sm flex-col"
            >
              {/* Wallet info */}
              <div className="mb-6 rounded-2xl bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Wallet</span>
                  <span className="text-xs font-mono text-foreground">
                    {walletAddress ? shortenAddress(walletAddress) : ""}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Balance</span>
                  <span className="text-xs font-mono text-foreground">{balance} ETH</span>
                </div>
              </div>

              {/* Order summary */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{stock.logo}</span>
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
                    <span className="text-muted-foreground">Est. ETH</span>
                    <span className="font-mono text-foreground">{ethEquivalent}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                className="mt-6 h-14 w-full gap-2 rounded-2xl text-base font-semibold"
              >
                Confirm Purchase
              </Button>
            </motion.div>
          )}

          {/* Processing */}
          {phase === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              >
                <Loader2 className="h-12 w-12 text-primary" />
              </motion.div>
              <p className="mt-4 font-display text-lg font-semibold text-foreground">
                Processing Transaction...
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Simulating on Robinhood Testnet
              </p>
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

              <div className="mt-6 w-full rounded-2xl bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tx Hash</span>
                  <span className="flex items-center gap-1 font-mono text-xs text-primary">
                    {txHash.slice(0, 10)}...{txHash.slice(-6)}
                    <ExternalLink className="h-3 w-3" />
                  </span>
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
