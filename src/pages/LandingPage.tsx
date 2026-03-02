import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Users, Coins, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import robinhoodLogo from "@/assets/robinhood-logo.png";

interface HoldingImage {
  id: string;
  captured_image_url: string | null;
  ticker: string;
}

function TokenizationMarquee() {
  const [images, setImages] = useState<HoldingImage[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("holdings")
        .select("id, captured_image_url, ticker")
        .not("captured_image_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data && data.length > 0) setImages(data);
    };
    fetch();
  }, []);

  if (images.length === 0) return null;

  // Duplicate for seamless loop
  const strip = [...images, ...images];

  return (
    <div className="relative w-full overflow-hidden py-8">
      {/* Fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

      <div className="flex w-max animate-marquee gap-4">
        {strip.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-transform hover:scale-105"
          >
            <img
              src={item.captured_image_url!}
              alt={item.ticker}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent px-2 py-1.5">
              <span className="text-[10px] font-bold text-primary">${item.ticker}</span>
            </div>
            {/* Pulse dot */}
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
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

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("beta_signups").insert({ email: trimmed });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already signed up!", description: "This email is already on the waitlist." });
        setSubmitted(true);
      } else {
        toast({ title: "Something went wrong", description: "Please try again later.", variant: "destructive" });
      }
      return;
    }
    setSubmitted(true);
    toast({ title: "You're on the list! 🎉", description: "We'll reach out when it's your turn." });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="font-display text-base font-bold text-foreground">
            Snap<span className="text-primary">'n</span>Invest
          </span>
          <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed gap-1.5">
            Launch App
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Coming Soon
            </span>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center px-6 pt-28 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-2xl"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="text-xs font-semibold text-muted-foreground">Beta Access Opening Soon</span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            See it. Snap it.
            <br />
            <span className="text-gradient">Own it.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
            The first app that turns everyday product discovery into real investment. 
            Point your camera, recognize the brand, and buy tokenized stocks — instantly.
          </p>
        </motion.div>

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {valueProps.map((prop) => (
            <div
              key={prop.title}
              className="rounded-2xl border border-border bg-card/60 p-6 text-center backdrop-blur-sm"
            >
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <prop.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-sm font-bold text-foreground">{prop.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{prop.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Live feed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 w-full max-w-4xl"
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

        {/* Email signup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-12 w-full max-w-md text-center"
        >
          <h2 className="font-display text-2xl font-bold text-foreground">
            Get Early Access
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join the waitlist to be among the first to try Snap'n Invest.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 p-6">
              <p className="text-sm font-semibold text-primary">You're on the list! 🎉</p>
              <p className="mt-1 text-xs text-muted-foreground">We'll be in touch soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-card border-border"
              />
              <Button type="submit" disabled={loading} className="h-12 shrink-0 gap-2 rounded-xl px-6">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Join
              </Button>
            </form>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <img src={robinhoodLogo} alt="Robinhood" className="h-4 w-4 rounded-sm object-contain" />
          <span className="text-xs text-muted-foreground">Built on Robinhood Chain</span>
        </div>
      </footer>
    </div>
  );
}
