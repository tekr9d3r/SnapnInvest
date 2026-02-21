import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAppMode } from "./AppModeContext";
import { toast } from "@/hooks/use-toast";
import { getBalance, shortenAddress } from "@/lib/wallet";

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
  const { mode } = useAppMode();
  const { address: wagmiAddress, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authedAddress, setAuthedAddress] = useState<string | null>(null);

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
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // When wagmi connects and we're not yet authenticated, run auth flow
  useEffect(() => {
    if (isConnected && wagmiAddress && !isAuthenticated && !isConnecting) {
      authenticateWallet(wagmiAddress);
    }
  }, [isConnected, wagmiAddress, isAuthenticated, isConnecting]);

  // Refresh balance
  useEffect(() => {
    const addr = authedAddress || (isConnected ? wagmiAddress : null);
    if (addr) {
      getBalance(addr).then(setBalance);
    }
  }, [authedAddress, wagmiAddress, isConnected]);

  const authenticateWallet = useCallback(async (addr: string) => {
    setIsConnecting(true);
    try {
      // Sign message for verification
      const message = `Sign in to Snap'n'Buy\n\nWallet: ${addr}\nTimestamp: ${Date.now()}`;

      let signature: string;
      try {
        signature = await signMessageAsync({ message, account: addr as `0x${string}` });
      } catch (sigErr) {
        console.error("Signature rejected:", sigErr);
        toast({ title: "Signature rejected", description: "You need to sign the message to authenticate.", variant: "destructive" });
        wagmiDisconnect();
        setIsConnecting(false);
        return;
      }

      // Call backend
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
        wagmiDisconnect();
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
      wagmiDisconnect();
    } finally {
      setIsConnecting(false);
    }
  }, [signMessageAsync, wagmiDisconnect]);

  const connect = useCallback(() => {
    if (openConnectModal) {
      openConnectModal();
    }
  }, [openConnectModal]);

  const disconnect = useCallback(() => {
    wagmiDisconnect();
    supabase.auth.signOut();
    setAuthedAddress(null);
    setBalance("0");
    setIsAuthenticated(false);
    setUserId(null);
    toast({ title: "Wallet disconnected" });
  }, [wagmiDisconnect]);

  const displayAddress = authedAddress || (isConnected ? wagmiAddress?.toLowerCase() ?? null : null);

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
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export const useWallet = () => useContext(WalletContext);
