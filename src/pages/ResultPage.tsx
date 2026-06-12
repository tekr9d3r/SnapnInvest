import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, X, Camera } from "lucide-react";
import { StockLogo } from "@/components/StockLogo";
import { Button } from "@/components/ui/button";
import { Stock } from "@/lib/types";
import { toast } from "sonner";
import { findStockBySymbol } from "@/lib/stocks";
import { compressImage } from "@/lib/imageUtils";

const ResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const image = (location.state as { image?: string })?.image;

  const [scanning, setScanning] = useState(true);
  const [matchedStock, setMatchedStock] = useState<Stock | null>(null);

  useEffect(() => {
    if (!image) {
      navigate("/camera");
      return;
    }

    const identifyBrand = async () => {
      try {
        // Compress before sending to stay well under Vercel's 4.5MB body limit
        const compressed = await compressImage(image, 1024, 0.7);

        // Step 1: AI identifies the brand
        const brandRes = await fetch("/api/identify-brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: compressed }),
        });
        const data = await brandRes.json();

        if (!brandRes.ok || data?.error) {
          console.error("Identify error:", data?.error);
          toast.error(data?.error || "Failed to analyze image. Please try again.");
          setMatchedStock(null);
          setScanning(false);
          return;
        }

        if (!data?.ticker) {
          setMatchedStock(null);
          setScanning(false);
          return;
        }

        // Step 2: Look up real stock data
        const stockRes = await fetch("/api/stock-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: data.ticker }),
        });
        const stockData = await stockRes.json();

        if (!stockRes.ok || stockData?.error) {
          console.error("Stock lookup error:", stockData?.error);
          toast.error("Could not find stock data. Please try again.");
          setMatchedStock(null);
          setScanning(false);
          return;
        }

        const dexStock = findStockBySymbol(stockData.ticker);
        if (!dexStock) {
          toast.error("This stock isn't on MockSwap yet — try another brand.");
          setMatchedStock(null);
          setScanning(false);
          return;
        }

        const stock: Stock = {
          ticker: stockData.ticker,
          name: data.name || stockData.name,
          logo: "",
          contractAddress: dexStock.tokenAddress,
          currentPrice: stockData.currentPrice,
          logoUrl: stockData.logoUrl,
          poolAddress: dexStock.poolAddress,
          tokenAddress: dexStock.tokenAddress,
        };

        setMatchedStock(stock);
      } catch (err) {
        console.error("Identify error:", err);
        toast.error("Something went wrong. Please try again.");
        setMatchedStock(null);
      } finally {
        setScanning(false);
      }
    };

    identifyBrand();
  }, [image, navigate]);

  const handleBuy = (amount: number) => {
    if (!matchedStock) return;
    navigate("/confirm", {
      state: { stock: matchedStock, amount, image },
    });
  };

  if (!image) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-background pt-14">

      {/* Image preview */}
      <div className="relative mx-4 overflow-hidden rounded-2xl">
        <img src={image} alt="Captured" className="aspect-video w-full object-cover" />
        {scanning && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <Scan className="h-10 w-10 text-primary" />
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Results */}
      <div className="flex flex-1 flex-col px-6 pt-6">
        <AnimatePresence mode="wait">
          {scanning ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="text-lg font-semibold text-foreground">Analyzing image...</p>
              <p className="mt-1 text-sm text-muted-foreground">AI is identifying the brand</p>
            </motion.div>
          ) : matchedStock ? (
            <motion.div
              key="matched"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-3">
                <StockLogo ticker={matchedStock.ticker} logoUrl={matchedStock.logoUrl} size="lg" />
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    {matchedStock.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {matchedStock.ticker} · ${matchedStock.currentPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <p className="mt-6 text-sm font-medium text-muted-foreground">
                Quick buy tokenized stock
              </p>

              <div className="mt-3 flex gap-3">
                {[1, 10, 100].map((amount) => (
                  <Button
                    key={amount}
                    onClick={() => handleBuy(amount)}
                    variant={amount === 10 ? "default" : "secondary"}
                    className="h-14 w-24 rounded-2xl text-lg font-bold"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="no-match"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <span className="text-3xl">🤷</span>
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">
                No match found
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                We couldn't match this to a publicly traded stock. Try pointing at a product from a public company.
              </p>
              <Button
                onClick={() => navigate("/camera")}
                className="mt-6 gap-2 rounded-xl"
              >
                <Camera className="h-4 w-4" />
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResultPage;
