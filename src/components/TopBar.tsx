import { useLocation } from "react-router-dom";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";

export function TopBar() {
  const location = useLocation();
  const { address, shortAddress, isConnecting, connect, disconnect } = useWallet();

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
          <Button variant="outline" size="sm" onClick={connect} disabled={isConnecting}>
            <Wallet className="h-4 w-4 mr-1" />
            {isConnecting ? "Connecting…" : "Connect"}
          </Button>
        )}
      </div>
    </header>
  );
}
