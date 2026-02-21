import { useNavigate } from "react-router-dom";
import { Camera, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LiveMintTicker } from "@/components/LiveMintTicker";

import robinhoodLogo from "@/assets/robinhood-logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 pb-24 pt-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mt-10 text-center"
      >
        <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Snap a photo.
          <br />
          <span className="text-gradient">Buy the stock.</span>
        </h2>
        <div className="mt-4 flex items-center justify-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5">
          <img src={robinhoodLogo} alt="Robinhood" className="h-5 w-5 rounded-sm object-contain" />
          <span className="text-xs font-semibold text-foreground">Built on Robinhood Chain</span>
        </div>
        <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground">
          Point your camera at any product, let AI recognize the brand, and buy tokenized stocks on <span className="font-semibold text-foreground">Robinhood Chain</span>.
        </p>
      </motion.div>

      {/* Live mint ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full flex justify-center"
      >
        <LiveMintTicker />
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        <Button
          size="lg"
          onClick={() => navigate("/camera")}
          className="group h-14 gap-3 rounded-2xl px-8 text-lg font-semibold animate-pulse-glow"
        >
          <Camera className="h-5 w-5" />
          Open Camera
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>
    </div>
  );
};

export default Index;
