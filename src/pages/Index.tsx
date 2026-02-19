import { useNavigate } from "react-router-dom";
import { Camera, Scan, ShoppingCart, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Camera, label: "Snap", desc: "Take a photo of any product" },
  { icon: Scan, label: "Recognize", desc: "AI identifies the brand" },
  { icon: ShoppingCart, label: "Buy", desc: "Purchase tokenized stock" },
];

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
        className="mt-12 text-center"
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

      {/* How it works */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-16 w-full max-w-sm"
      >
        <h3 className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          How it works
        </h3>
        <div className="flex items-start justify-between gap-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex flex-1 flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">{step.label}</span>
              <span className="mt-1 text-xs text-muted-foreground">{step.desc}</span>
              {i < steps.length - 1 && (
                <div className="absolute" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Supported stocks */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mt-12 flex items-center gap-4 text-2xl"
      >
        {["⚡", "📦", "🔮", "🎬", "💻"].map((emoji, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 + i * 0.1 }}
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary"
          >
            {emoji}
          </motion.span>
        ))}
      </motion.div>
      <p className="mt-3 text-xs text-muted-foreground">
        TSLA · AMZN · PLTR · NFLX · AMD
      </p>
    </div>
  );
};

export default Index;
