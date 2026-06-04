import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { StockLogo } from "@/components/StockLogo";
import { ChallengeCards } from "@/components/ChallengeCards";

interface HoldingItem {
  id: string;
  captured_image_url: string | null;
  ticker: string;
  logo_url: string | null;
  amount_invested: number | null;
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
    <div className="relative w-full overflow-hidden py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-gray-50 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-gray-50 to-transparent" />
      <div className="flex w-max animate-marquee gap-3">
        {strip.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="relative h-52 w-44 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <img
              src={item.captured_image_url!}
              alt={item.ticker}
              className="h-32 w-full object-cover"
              loading="lazy"
            />
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <div className="flex flex-col gap-0.5 px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                <StockLogo ticker={item.ticker} logoUrl={item.logo_url || undefined} size="sm" className="h-4 w-4" />
                <span className="text-xs font-bold text-gray-900">${item.ticker}</span>
              </div>
              {item.amount_invested != null && (
                <span className="text-[10px] text-gray-400">
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

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 pb-24 pt-16">
      {/* Compact hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-6 flex flex-col items-center px-6 text-center"
      >
        <p className="text-sm text-gray-400 mb-3">See it. Snap it. Own it.</p>
        <button
          onClick={() => navigate("/camera")}
          className="flex items-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Camera className="h-4 w-4" />
          Snap a Brand
        </button>
      </motion.div>

      {/* Active Challenges */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 w-full max-w-md px-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-gray-900">Active Challenges</span>
          </div>
          <span className="text-xs text-gray-400">3 running</span>
        </div>
      </motion.div>

      <ChallengeCards />

      {/* Live community snaps */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-10 w-full max-w-md"
      >
        <div className="mb-3 flex items-center justify-center gap-2 px-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Live Community Snaps
          </span>
        </div>
        <TokenizationMarquee />
      </motion.div>
    </div>
  );
};

export default Index;
