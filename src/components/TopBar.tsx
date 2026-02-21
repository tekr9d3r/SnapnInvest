import { useLocation } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ModeToggle } from "@/components/ModeToggle";
import { useAppMode } from "@/contexts/AppModeContext";

export function TopBar() {
  const location = useLocation();
  const { mode } = useAppMode();

  if (["/camera", "/result", "/confirm"].includes(location.pathname)) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2.5">
        <ModeToggle />

        {mode === "onchain" && (
          <ConnectButton
            chainStatus="icon"
            accountStatus="avatar"
            showBalance={false}
          />
        )}
      </div>
    </header>
  );
}
