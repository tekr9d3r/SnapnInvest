import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ArrowRight, Sparkles, Users, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StockLogo } from "@/components/StockLogo";
import robinhoodLogo from "@/assets/robinhood-logo.png";
import { SnapHunt } from "@/components/SnapHunt";

interface HoldingItem {
  id: string;
  captured_image_url: string | null;
  ticker: string;
  logo_url: string | null;
  amount_invested: number | null;
  shares: number | null;
  name: string | null;
}

function TokenizationMarquee() {
  const [items, setItems] = useState<HoldingItem[]>([]);

  useEffect(() => {
    fetch("/api/holdings?limit=20")
      .then((r) => r.json())
      .then((data: HoldingItem[]) => {
        const withImages = data.filter((d) => d.captured_image_url);
        if (withImages.length > 0) setItems(withImages);
      })
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  const strip = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden py-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent" />
      <div className="flex w-max animate-marquee gap-4">
        {strip.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="relative h-64 w-52 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
          >
            <img
              src={item.captured_image_url!}
              alt={item.ticker}
              className="h-36 w-full object-cover"
              loading="lazy"
            />
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <div className="flex flex-col gap-1 px-3 py-2.5">
              <div className="flex items-center gap-1.5">
                <StockLogo ticker={item.ticker} logoUrl={item.logo_url || undefined} size="sm" className="h-4 w-4" />
                <span className="text-xs font-bold text-foreground">${item.ticker}</span>
                {item.name && <span className="truncate text-[10px] text-muted-foreground">{item.name}</span>}
              </div>
              {item.amount_invested != null && (
                <span className="text-[10px] text-muted-foreground">
                  ${Number(item.amount_invested).toFixed(2)} invested
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const valueProps = [
  {
    icon: Sparkles,
    title: "Gamify Investing",
    description: "Snap photos of products you love and instantly invest in the companies behind them.",
  },
  {
    icon: Users,
    title: "Collaborate with Brands",
    description: "A new way for consumers and brands to build value together, powered by ownership.",
  },
  {
    icon: Coins,
    title: "Tokenized Stocks",
    description: "Only possible with tokenized equities — fractional, instant, and on-chain.",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background pb-24 pt-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mt-10 flex flex-col items-center px-6 text-center"
      >
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5">
          <img src={robinhoodLogo} alt="Robinhood" className="h-4 w-4 rounded-sm object-contain" />
          <span className="text-xs font-semibold text-foreground">Built on Robinhood Chain</span>
        </div>

        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
          See it. Snap it.
          <br />
          <span className="text-gradient">Own it.</span>
        </h1>

        <p className="mx-auto mt-4 max-w-sm text-base text-muted-foreground">
          Point your camera at any product, let AI recognize the brand, and buy tokenized stocks — instantly, on-chain.
        </p>

        <Button
          size="lg"
          onClick={() => navigate("/camera")}
          className="mt-6 group h-14 gap-3 rounded-2xl px-8 text-lg font-semibold animate-pulse-glow"
        >
          <Camera className="h-5 w-5" />
          Open Camera
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </motion.div>

      {/* Active Snap Hunt */}
      <SnapHunt />

      {/* Live tokenizations marquee */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-10 w-full max-w-md"
      >
        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live Tokenizations
          </span>
        </div>
        <TokenizationMarquee />
      </motion.div>

      {/* Value props */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mt-8 grid w-full max-w-md grid-cols-1 gap-3 px-6 sm:grid-cols-3"
      >
        {valueProps.map((prop) => (
          <div
            key={prop.title}
            className="rounded-2xl border border-border bg-card/60 p-5 text-center"
          >
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <prop.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-display text-sm font-bold text-foreground">{prop.title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{prop.description}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Index;
