import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Camera, ArrowLeft, Loader2, ExternalLink, Link, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockLogo } from "@/components/StockLogo";
import { Stock } from "@/lib/types";
import { addHolding } from "@/lib/portfolio";
import { compressImage } from "@/lib/imageUtils";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletClient } from "wagmi";
import {
  fetchEthPrice,
  dollarToEthWei,
  quoteEthForTokens,
  applySlippage,
  executeSwap,
} from "@/lib/dex";
import { formatUnits } from "ethers";
import { toast } from "sonner";
import robinhoodLogo from "@/assets/robinhood-logo.png";
import arbitrumLogo from "@/assets/arbitrum-logo.png";

type Phase = "confirm" | "swapping" | "confirming" | "success";


const ConfirmPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { stock, amount, image } = (location.state as { stock: Stock; amount: number; image: string }) || {};
  const { isAuthenticated, userId, address } = useWallet();
  const { data: walletClient } = useWalletClient();

  const [phase, setPhase] = useState<Phase>("confirm");
  const [txHash, setTxHash] = useState("");
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [ethAmountWei, setEthAmountWei] = useState<bigint | null>(null);
  const [expectedTokens, setExpectedTokens] = useState<string | null>(null);
  const [tokensReceived, setTokensReceived] = useState<string | null>(null);

  if (!stock || !amount) {
    navigate("/");
    return null;
  }

  const shares = amount / stock.currentPrice;

  // Fetch ETH price + quote on mount
  useEffect(() => {
    if (!stock.poolAddress) return;
    let cancelled = false;

    const load = async () => {
      try {
        const price = await fetchEthPrice();
        if (cancelled) return;
        setEthPrice(price);

        const wei = dollarToEthWei(amount, price);
        setEthAmountWei(wei);

        const quote = await quoteEthForTokens(stock.poolAddress!, wei);
        if (cancelled) return;
        setExpectedTokens(parseFloat(formatUnits(quote, 18)).toFixed(6));
      } catch {
        // quote failure is non-blocking; swap still works
      }
    };

    load();
    return () => { cancelled = true; };
  }, [stock.poolAddress, amount]);

  const handleConfirm = async () => {
    if (!stock.poolAddress || !stock.tokenAddress) {
      toast.error("Pool address missing — this stock can't be traded yet.");
      return;
    }

    if (!walletClient) {
      toast.error("No wallet found. Please connect first.");
      return;
    }

    let finalEthWei = ethAmountWei;
    let finalEthPrice = ethPrice;

    if (!finalEthWei || !finalEthPrice) {
      try {
        finalEthPrice = await fetchEthPrice();
        finalEthWei = dollarToEthWei(amount, finalEthPrice);
        setEthPrice(finalEthPrice);
        setEthAmountWei(finalEthWei);
      } catch {
        toast.error("Could not fetch ETH price. Please try again.");
        return;
      }
    }

    setPhase("swapping");

    try {
      const quote = await quoteEthForTokens(stock.poolAddress, finalEthWei);
      const minOut = applySlippage(quote, 200n); // 2% slippage

      setPhase("confirming");

      const recipient = address || walletClient.account.address;

      const { hash, tokensReceived: received } = await executeSwap(
        stock.poolAddress,
        finalEthWei,
        minOut,
        recipient,
        walletClient
      );

      setTxHash(hash);
      setTokensReceived(received);

      // Persist holding
      if (isAuthenticated && userId) {
        let capturedImageUrl: string | undefined;
        if (image) {
          try {
            const compressed = await compressImage(image, 800, 0.6);
            const uploadRes = await fetch("/api/upload-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: compressed, userId, ticker: stock.ticker }),
            });
            if (uploadRes.ok) {
              const { url } = await uploadRes.json();
              capturedImageUrl = url;
            }
          } catch (err) {
            console.error("Image upload failed:", err);
          }
        }

        await fetch("/api/holdings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            ticker: stock.ticker,
            name: stock.name,
            logo_url: stock.logoUrl || null,
            amount_invested: amount,
            shares,
            price_at_purchase: stock.currentPrice,
            captured_image_url: capturedImageUrl || null,
            tx_hash: hash,
          }),
        });
      } else {
        let compressedImage: string | undefined;
        if (image) {
          try { compressedImage = await compressImage(image, 800, 0.6); } catch { /* ok */ }
        }
        addHolding(
          {
            ticker: stock.ticker,
            name: stock.name,
            logo: stock.logo,
            logoUrl: stock.logoUrl,
            amountInvested: amount,
            shares,
            priceAtPurchase: stock.currentPrice,
            txHash: hash,
            tokensReceived: received,
            tokenAddress: stock.tokenAddress,
            poolAddress: stock.poolAddress,
          },
          compressedImage
        );
      }

      setPhase("success");
    } catch (err: any) {
      setPhase("confirm");
      const msg = err?.reason || err?.message || "Transaction failed";
      if (msg.includes("insufficient")) {
        toast.error("Insufficient ETH balance for this swap.");
      } else if (msg.includes("slippage") || msg.includes("INSUFFICIENT_OUTPUT")) {
        toast.error("Slippage too high — price moved. Try again.");
      } else if (msg.includes("user rejected")) {
        toast.error("Transaction rejected.");
      } else {
        toast.error(`Swap failed: ${msg.slice(0, 80)}`);
      }
    }
  };

  const ethDisplay = ethPrice && ethAmountWei
    ? `${parseFloat(formatUnits(ethAmountWei, 18)).toFixed(5)} ETH`
    : null;

  const isProcessing = phase === "swapping" || phase === "confirming";

  return (
    <div className="fixed inset-0 flex flex-col bg-background pt-14">
      {phase === "confirm" && (
        <div className="flex items-center px-2 pt-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

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
                  {ethDisplay && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You spend</span>
                      <span className="text-foreground">{ethDisplay}</span>
                    </div>
                  )}
                  {expectedTokens && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">You receive ≈</span>
                      <span className="text-foreground">{expectedTokens} {stock.ticker} tokens</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price per share</span>
                    <span className="text-foreground">${stock.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Network</span>
                    <span className="flex items-center gap-1 text-foreground">
                      <img src={robinhoodLogo} alt="" className="h-3.5 w-3.5 rounded-sm" />
                      Robinhood Chain
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Slippage</span>
                    <span className="text-foreground">2%</span>
                  </div>
                </div>
              </div>

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
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Real on-chain swap via MockSwap DEX
              </p>
            </motion.div>
          )}

          {/* Processing */}
          {isProcessing && (
            <motion.div
              key={phase}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="relative mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                >
                  <Loader2 className="h-14 w-14 text-primary" />
                </motion.div>
                {phase === "swapping" && (
                  <Cpu className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-primary" />
                )}
                {phase === "confirming" && (
                  <Link className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-primary" />
                )}
              </div>
              <p className="font-display text-lg font-semibold text-foreground">
                {phase === "swapping" ? "Executing swap..." : "Waiting for confirmation..."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {phase === "swapping"
                  ? "Broadcasting transaction on Robinhood Chain"
                  : "Block confirmation · ~2s finality"}
              </p>
              <div className="mt-4 flex gap-2">
                {(["swapping", "confirming"] as Phase[]).map((p) => (
                  <div
                    key={p}
                    className={`h-1.5 w-8 rounded-full transition-colors ${
                      phase === "confirming" || p === "swapping" ? "bg-primary" : "bg-secondary"
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
                {tokensReceived
                  ? `Received ${tokensReceived} ${stock.ticker} tokens`
                  : `Bought ${shares.toFixed(6)} ${stock.ticker} for $${amount}`}
              </p>

              <div className="mt-6 w-full space-y-2 rounded-2xl bg-secondary p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Tx Hash</span>
                  <a
                    href={`https://explorer.testnet.chain.robinhood.com/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 font-mono text-xs text-primary"
                  >
                    {txHash.slice(0, 10)}...{txHash.slice(-6)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Network</span>
                  <span className="flex items-center gap-1 text-xs text-foreground">
                    <img src={robinhoodLogo} alt="" className="h-3 w-3 rounded-sm" />
                    Robinhood Chain
                  </span>
                </div>
                {ethDisplay && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">ETH spent</span>
                    <span className="text-xs text-foreground">{ethDisplay}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex w-full gap-3">
                <Button
                  variant="secondary"
                  onClick={() => navigate(address ? `/p/${address}` : "/portfolio")}
                  className="flex-1 rounded-xl"
                >
                  My Profile
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
