import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { toast } from "@/hooks/use-toast";
import { getBalance, shortenAddress } from "@/lib/wallet";
import { BrowserProvider } from "ethers";

interface WalletContextValue {
  address: string | null;
  shortAddress: string;
  balance: string;
  isConnecting: boolean;
  isAuthenticated: boolean;
  userId: string | null;
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
  connect: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authedAddress, setAuthedAddress] = useState<string | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Check existing Supabase session on mount
  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        const walletAddr = session.user.user_metadata?.wallet_address;
        if (walletAddr) {
          setAuthedAddress(walletAddr);
          getBalance(walletAddr).then(b => isMounted && setBalance(b));
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setAuthedAddress(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        const walletAddr = session.user.user_metadata?.wallet_address;
        if (walletAddr) {
          setAuthedAddress(walletAddr);
          getBalance(walletAddr).then(b => isMounted && setBalance(b));
        }
      }
      setSessionChecked(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // When Privy authenticates and we have a wallet, run Supabase auth flow
  useEffect(() => {
    if (!sessionChecked || !ready || !authenticated || isAuthenticated || isConnecting) return;

    const wallet = wallets.find(w => w.walletClientType !== "privy");
    if (wallet?.address) {
      authenticateWallet(wallet.address, wallet);
    }
  }, [sessionChecked, ready, authenticated, wallets, isAuthenticated, isConnecting]);

  // Refresh balance
  useEffect(() => {
    const addr = authedAddress || (authenticated && wallets[0]?.address) || null;
    if (addr) {
      getBalance(addr).then(setBalance);
    }
  }, [authedAddress, wallets, authenticated]);

  const authenticateWallet = useCallback(async (addr: string, wallet: any) => {
    setIsConnecting(true);
    try {
      const message = `Sign in to Snap'n'Invest\n\nWallet: ${addr}\nTimestamp: ${Date.now()}`;

      let signature: string;
      try {
        const provider = await wallet.getEthereumProvider();
        const ethersProvider = new BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        signature = await signer.signMessage(message);
      } catch (sigErr) {
        console.error("Signature rejected:", sigErr);
        toast({ title: "Signature rejected", description: "You need to sign the message to authenticate.", variant: "destructive" });
        logout();
        setIsConnecting(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/wallet-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ address: addr, signature, message }),
      });

      const data = await response.json();

      if (!response.ok || !data?.access_token) {
        console.error("Wallet auth failed:", data);
        toast({ title: "Authentication failed", description: data?.error || "Could not authenticate wallet.", variant: "destructive" });
        logout();
        setIsConnecting(false);
        return;
      }

      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      setAuthedAddress(addr.toLowerCase());
      const bal = await getBalance(addr);
      setBalance(bal);

      toast({ title: "Wallet connected!", description: `Connected as ${shortenAddress(addr)}` });
    } catch (err) {
      console.error("Wallet auth error:", err);
      toast({ title: "Connection failed", description: String(err), variant: "destructive" });
      logout();
    } finally {
      setIsConnecting(false);
    }
  }, [logout]);

  const connect = useCallback(() => {
    login();
  }, [login]);

  const handleDisconnect = useCallback(() => {
    logout();
    supabase.auth.signOut();
    setAuthedAddress(null);
    setBalance("0");
    setIsAuthenticated(false);
    setUserId(null);
    toast({ title: "Wallet disconnected" });
  }, [logout]);

  const displayAddress = authedAddress || (authenticated && wallets[0]?.address?.toLowerCase()) || null;

  return (
    <WalletContext.Provider
      value={{
        address: displayAddress,
        shortAddress: displayAddress ? shortenAddress(displayAddress) : "",
        balance,
        isConnecting,
        isAuthenticated,
        userId,
        connect,
        disconnect: handleDisconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
