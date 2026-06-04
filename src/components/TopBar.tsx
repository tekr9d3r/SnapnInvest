import { useLocation } from "react-router-dom";
import { ConnectKitButton } from "connectkit";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";
import robinhoodLogo from "@/assets/robinhood-logo.png";

const ROBINHOOD_CHAIN = {
  chainId: "0xB636",
  chainName: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.testnet.chain.robinhood.com"],
  blockExplorerUrls: ["https://explorer.testnet.chain.robinhood.com"],
};

async function addRobinhoodChain() {
  if (!window.ethereum) {
    toast.error("No wallet detected. Please install MetaMask or another wallet.");
    return;
  }
  try {
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [ROBINHOOD_CHAIN],
    });
    toast.success("Robinhood Chain Testnet added to your wallet!");
  } catch (err: any) {
    if (err?.code === 4001) return; // user rejected
    toast.error("Failed to add chain: " + (err?.message ?? "unknown error"));
  }
}

export function TopBar() {
  const location = useLocation();
  const { isWrongChain, switchToRobinhood } = useWallet();

  if (["/landing", "/camera", "/result", "/confirm"].includes(location.pathname)) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
          <span className="font-display text-[19px] font-bold tracking-tight text-gray-900">
            Snap<span className="text-green-500">'n</span>Invest
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={addRobinhoodChain}
              className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
            >
              <img src={robinhoodLogo} alt="" className="h-3 w-3 rounded-sm" />
              Add Chain
            </button>
            <ConnectKitButton />
          </div>
        </div>
      </header>

      {/* Wrong-chain banner — only shown if auto-switch was rejected */}
      {isWrongChain && (
        <div className="fixed top-[53px] left-0 right-0 z-40 flex items-center justify-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2">
          <span className="text-xs text-amber-700">
            Wrong network — switch to Robinhood Chain Testnet to buy stocks
          </span>
          <Button
            size="sm"
            onClick={switchToRobinhood}
            className="h-6 gap-1.5 rounded-full px-3 text-[11px] font-semibold"
          >
            <img src={robinhoodLogo} alt="" className="h-3 w-3 rounded-sm" />
            Switch Network
          </Button>
        </div>
      )}
    </>
  );
}
