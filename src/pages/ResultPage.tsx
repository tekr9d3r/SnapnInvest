import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, X, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORTED_STOCKS, BRAND_KEYWORDS, Stock } from "@/lib/types";

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
    // Simulate AI recognition (mock — picks a random stock with ~70% chance, no match ~30%)
    const timer = setTimeout(() => {
      const rand = Math.random();
      if (rand < 0.7) {
        const stock = SUPPORTED_STOCKS[Math.floor(Math.random() * SUPPORTED_STOCKS.length)];
        setMatchedStock(stock);
      } else {
        setMatchedStock(null);
      }
      setScanning(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [image, navigate]);

  const handleBuy = (amount: number) => {
    if (!matchedStock) return;
    navigate("/confirm", {
      state: { stock: matchedStock, amount, image },
    });
  };

  if (!image) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/camera")}>
          <X className="h-6 w-6" />
        </Button>
        <span className="font-display text-sm font-semibold">
          Snap<span className="text-primary">'n</span>Buy
        </span>
        <div className="w-10" />
      </div>

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
                <span className="text-4xl">{matchedStock.logo}</span>
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
                We couldn't match this to a supported stock. Try pointing at a Tesla, Amazon, Palantir, Netflix, or AMD product.
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
