import { Wallet, Loader2 } from "lucide-react";
import { useLocation } from "react-router-dom";
import { ModeToggle } from "@/components/ModeToggle";
import { useAppMode } from "@/contexts/AppModeContext";
import { useWallet } from "@/contexts/WalletContext";

export function TopBar() {
  const location = useLocation();
  const { mode } = useAppMode();
  const { isAuthenticated, shortAddress, connect, isConnecting } = useWallet();

  if (["/camera", "/result", "/confirm"].includes(location.pathname)) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
        <ModeToggle />

        {mode === "onchain" && (
          <>
            {isAuthenticated ? (
              <span className="text-xs font-mono text-muted-foreground">{shortAddress}</span>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
              >
                {isConnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wallet className="h-3 w-3" />}
                {isConnecting ? "Connecting..." : "Connect"}
              </button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
