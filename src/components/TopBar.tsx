import { useLocation } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, ExternalLink } from "lucide-react";
import { useCallback } from "react";

const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

export function TopBar() {
  const location = useLocation();
  const { address, shortAddress, isConnecting, connect, disconnect } = useWallet();

  const handleConnect = useCallback(() => {
    if (isInIframe) {
      window.open(window.location.href.replace(/id-preview--[^.]+\.lovable\.app/, "snap-buy-vision.lovable.app"), "_blank");
      return;
    }
    connect();
  }, [connect]);

  if (["/camera", "/result", "/confirm"].includes(location.pathname)) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
        <span className="font-display text-sm font-bold text-foreground">
          Snap<span className="text-primary">'n</span>Invest
        </span>
        {address ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{shortAddress}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={disconnect}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={handleConnect} disabled={isConnecting}>
            {isInIframe ? <ExternalLink className="h-4 w-4 mr-1" /> : <Wallet className="h-4 w-4 mr-1" />}
            {isConnecting ? "Connecting…" : isInIframe ? "Open to Connect" : "Connect"}
          </Button>
        )}
      </div>
    </header>
  );
}
