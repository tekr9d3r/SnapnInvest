import { useNavigate } from "react-router-dom";
import { Camera, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import robinhoodLogo from "@/assets/robinhood-logo.png";
import arbitrumLogo from "@/assets/arbitrum-logo.png";




const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 pb-24 pt-16">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-2"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary glow-primary">
            <Camera className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Snap<span className="text-primary">'n</span>Buy
          </h1>
        </div>
      </motion.div>


      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-10 text-center"
      >
        <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          Snap a photo.
          <br />
          <span className="text-gradient">Own the stock.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground">
          Point your camera at any product, let AI recognize the brand, and invest in tokenized stocks instantly.
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-10"
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



      {/* Works with any stock */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-12 rounded-full bg-secondary px-5 py-2"
      >
        <span className="text-xs font-semibold text-muted-foreground">
          Works with any publicly traded stock 📈
        </span>
      </motion.div>

      {/* Powered by */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-auto flex items-center gap-3 pb-2"
      >
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
          <img src={robinhoodLogo} alt="Robinhood" className="h-4 w-4 rounded-sm object-contain" />
          <span className="text-[10px] font-semibold text-muted-foreground">Robinhood</span>
        </div>
        <span className="text-[10px] text-muted-foreground">×</span>
        <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
          <img src={arbitrumLogo} alt="Arbitrum" className="h-4 w-4 rounded-sm object-contain" />
          <span className="text-[10px] font-semibold text-muted-foreground">Arbitrum</span>
        </div>
      </motion.div>

    </div>
  );
};

export default Index;
