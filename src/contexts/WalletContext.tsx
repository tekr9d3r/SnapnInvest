import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAccount, useBalance, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { useModal } from "connectkit";
import { shortenAddress } from "@/lib/wallet";
import { ROBINHOOD_CHAIN_ID } from "@/lib/dex";

interface WalletContextValue {
  address: string | null;
  shortAddress: string;
  balance: string;
  isConnecting: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  isWrongChain: boolean;
  switchToRobinhood: () => void;
  connect: () => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  shortAddress: "",
  balance: "0",
  isConnecting: false,
  isAuthenticated: false,
  userId: null,
  isWrongChain: false,
  switchToRobinhood: () => {},
  connect: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, isConnecting } = useAccount();
  const { data: balanceData } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const { setOpen } = useModal();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [switchFailed, setSwitchFailed] = useState(false);

  const isWrongChain = isConnected && chainId !== ROBINHOOD_CHAIN_ID;

  // Auto-switch when wallet connects or chain changes
  useEffect(() => {
    if (!isConnected || chainId === ROBINHOOD_CHAIN_ID) {
      setSwitchFailed(false);
      return;
    }
    switchChain(
      { chainId: ROBINHOOD_CHAIN_ID },
      { onError: () => setSwitchFailed(true) }
    );
  }, [isConnected, chainId]);

  const switchToRobinhood = () => {
    setSwitchFailed(false);
    switchChain(
      { chainId: ROBINHOOD_CHAIN_ID },
      { onError: () => setSwitchFailed(true) }
    );
  };

  const balanceStr = balanceData
    ? parseFloat(balanceData.formatted).toFixed(4)
    : "0";

  const addr = address?.toLowerCase() ?? null;

  return (
    <WalletContext.Provider
      value={{
        address: addr,
        shortAddress: addr ? shortenAddress(addr) : "",
        balance: balanceStr,
        isConnecting,
        isAuthenticated: isConnected && !isWrongChain,
        userId: addr,
        isWrongChain: isWrongChain && switchFailed,
        switchToRobinhood,
        connect: () => setOpen(true),
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
