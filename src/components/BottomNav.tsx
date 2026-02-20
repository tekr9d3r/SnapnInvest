import { Camera, Home, PieChart, Wallet, Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ModeToggle } from "@/components/ModeToggle";
import { useAppMode } from "@/contexts/AppModeContext";
import { useWallet } from "@/contexts/WalletContext";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/camera", label: "Snap", icon: Camera },
  { path: "/portfolio", label: "Portfolio", icon: PieChart },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useAppMode();
  const { isAuthenticated, shortAddress, connect, isConnecting } = useWallet();

  // Hide nav on camera/result/confirm pages
  if (["/camera", "/result", "/confirm"].includes(location.pathname)) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md flex-col items-center gap-1 pb-2 pt-2">
        {/* Mode toggle */}
        <ModeToggle />

        {/* Wallet indicator for onchain mode */}
        {mode === "onchain" && isAuthenticated && (
          <span className="text-[10px] font-mono text-muted-foreground">{shortAddress}</span>
        )}
        {mode === "onchain" && !isAuthenticated && (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="flex items-center gap-1 text-[10px] font-semibold text-primary"
          >
            {isConnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wallet className="h-3 w-3" />}
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        )}

        {/* Tabs */}
        <div className="flex w-full items-center justify-around">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className="relative flex flex-col items-center gap-1 px-6 py-2 transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon
                  className={`h-5 w-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
