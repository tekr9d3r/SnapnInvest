import { useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function TopBar() {
  const location = useLocation();

  if (["/camera", "/result", "/confirm"].includes(location.pathname)) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
        <span className="font-display text-sm font-bold text-foreground">
          Snap<span className="text-primary">'n</span>Buy
        </span>
        <ConnectButton
          chainStatus="icon"
          accountStatus="avatar"
          showBalance={false}
        />
      </div>
    </header>
  );
}
