import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Users, Coins, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import robinhoodLogo from "@/assets/robinhood-logo.png";

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
    const fetchItems = async () => {
      try {
        const { data } = await supabase
          .from("holdings")
          .select("id, captured_image_url, ticker, logo_url, amount_invested, shares, name")
          .not("captured_image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(20);
        if (data && data.length > 0) setItems(data);
      } catch (err) {
        console.error("Failed to fetch holdings:", err);
      }
    };
    fetchItems();
  }, []);

  if (items.length === 0) return null;

  const strip = [...items, ...items];

  return (
    <div className="relative w-full overflow-hidden py-8">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

      <div className="flex w-max animate-marquee gap-4">
        {strip.map((item, i) => (
          <div
            key={`${item.id}-${i}`}
            className="group relative h-72 w-56 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-transform hover:scale-105"
          >
            <img
              src={item.captured_image_url!}
              alt={item.ticker}
              className="h-40 w-full object-cover"
              loading="lazy"
            />
            {/* Pulse dot */}
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {/* Info overlay */}
            <div className="flex flex-col gap-1 px-2.5 py-2">
              <div className="flex items-center gap-1.5">
                {item.logo_url && (
                  <img src={item.logo_url} alt="" className="h-4 w-4 rounded-sm object-contain" />
                )}
                <span className="text-xs font-bold text-foreground">${item.ticker}</span>
              </div>
              {item.amount_invested != null && (
                <span className="text-[10px] text-muted-foreground">
                  ${item.amount_invested.toFixed(2)} invested
                </span>
              )}
              {item.shares != null && (
                <span className="text-[10px] text-muted-foreground">
                  {item.shares} shares
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

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mountTime] = useState(() => Date.now());
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Bot detection: honeypot filled or submitted too fast
    if (honeypot || Date.now() - mountTime < 2000) {
      setSubmitted(true);
      toast({ title: "You're on the list! 🎉", description: "We'll reach out when it's your turn." });
      return;
    }

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await (supabase as any).from("beta_signups").insert({ email: trimmed });
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

          {/* Email signup - between headline and description */}
          <div className="mx-auto mt-8 w-full max-w-md">
            <h2 className="font-display text-xl font-bold text-foreground">
              Get Early Access
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Join the waitlist to be among the first to try Snap'n Invest.
            </p>

            {submitted ? (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-6">
                <p className="text-sm font-semibold text-primary">You're on the list! 🎉</p>
                <p className="mt-1 text-xs text-muted-foreground">We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: 'absolute', left: '-9999px' }}
                />
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
          </div>

          <p className="mx-auto mt-8 max-w-lg text-lg text-muted-foreground">
            The first app that turns everyday product discovery into real investment. 
            Point your camera, recognize the brand, and buy tokenized stocks — instantly.
          </p>
        </motion.div>

        {/* Live feed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-12 w-full max-w-4xl"
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

        {/* Value Props */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
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

      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <img src={robinhoodLogo} alt="Robinhood" className="h-4 w-4 rounded-sm object-contain" />
            <span className="text-xs text-muted-foreground">Built on Robinhood Chain</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/tekr9d3r/SnapnInvest" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </a>
            <a href="https://x.com/tekr0x" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
