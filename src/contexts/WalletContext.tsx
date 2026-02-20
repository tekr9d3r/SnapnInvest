import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { connectWallet as connectMetaMask, getBalance, shortenAddress, ROBINHOOD_CHAIN } from "@/lib/wallet";
import { useAppMode } from "./AppModeContext";
import { toast } from "@/hooks/use-toast";

interface WalletContextValue {
  address: string | null;
  shortAddress: string;
  balance: string;
  isConnecting: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  shortAddress: "",
  balance: "0",
  isConnecting: false,
  isAuthenticated: false,
  userId: null,
  connect: async () => {},
  disconnect: () => {},
});

async function switchToRobinhoodChain(): Promise<boolean> {
  if (!window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ROBINHOOD_CHAIN.chainId }],
    });
    return true;
  } catch (switchError: any) {
    // Chain not added yet — add it
    if (switchError?.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: ROBINHOOD_CHAIN.chainId,
            chainName: ROBINHOOD_CHAIN.chainName,
            nativeCurrency: ROBINHOOD_CHAIN.nativeCurrency,
            rpcUrls: ROBINHOOD_CHAIN.rpcUrls,
            blockExplorerUrls: ROBINHOOD_CHAIN.blockExplorerUrls,
          }],
        });
        return true;
      } catch {
        return false;
      }
    }
    // User rejected
    return false;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { mode } = useAppMode();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check existing session on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        const walletAddr = session.user.user_metadata?.wallet_address;
        if (walletAddr) {
          setAddress(walletAddr);
          getBalance(walletAddr).then(setBalance);
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setIsAuthenticated(true);
        setUserId(session.user.id);
        const walletAddr = session.user.user_metadata?.wallet_address;
        if (walletAddr) {
          setAddress(walletAddr);
          getBalance(walletAddr).then(setBalance);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for account changes in MetaMask
  useEffect(() => {
    if (!window.ethereum) return;
    const handler = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      }
    };
    window.ethereum.on("accountsChanged", handler);
    return () => window.ethereum?.removeListener("accountsChanged", handler);
  }, []);

  // Refresh balance when address changes
  useEffect(() => {
    if (address) {
      getBalance(address).then(setBalance);
    }
  }, [address]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      toast({ title: "MetaMask not found", description: "Please install MetaMask to continue.", variant: "destructive" });
      window.open("https://metamask.io/download/", "_blank");
      return;
    }

    setIsConnecting(true);
    try {
      // Step 1: Connect wallet
      const addr = await connectMetaMask();
      if (!addr) {
        toast({ title: "Connection cancelled", description: "Wallet connection was rejected.", variant: "destructive" });
        setIsConnecting(false);
        return;
      }

      // Step 2: Switch to Robinhood Chain
      const switched = await switchToRobinhoodChain();
      if (!switched) {
        toast({ title: "Wrong network", description: "Please switch to Robinhood Chain to continue.", variant: "destructive" });
        setIsConnecting(false);
        return;
      }

      // Step 3: Request signature for auth
      const message = `Sign in to Snap'n'Buy\n\nWallet: ${addr}\nTimestamp: ${Date.now()}`;
      let signature: string;
      try {
        signature = await window.ethereum.request({
          method: "personal_sign",
          params: [message, addr],
        }) as string;
      } catch (sigErr) {
        console.error("User rejected signature:", sigErr);
        toast({ title: "Signature rejected", description: "You need to sign the message to authenticate.", variant: "destructive" });
        setIsConnecting(false);
        return;
      }

      // Step 4: Authenticate via edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      console.log("Calling wallet-auth edge function...");
      const response = await fetch(`${supabaseUrl}/functions/v1/wallet-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
        },
        body: JSON.stringify({ address: addr, signature, message }),
      });

      const data = await response.json();
      console.log("wallet-auth response:", response.status, data);

      if (!response.ok || !data?.access_token) {
        console.error("Wallet auth failed:", data);
        toast({ title: "Authentication failed", description: data?.error || "Could not authenticate wallet.", variant: "destructive" });
        setIsConnecting(false);
        return;
      }

      // Step 5: Set session
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      setAddress(addr.toLowerCase());
      const bal = await getBalance(addr);
      setBalance(bal);

      toast({ title: "Wallet connected!", description: `Connected as ${shortenAddress(addr)}` });
    } catch (err) {
      console.error("Wallet connection failed:", err);
      toast({ title: "Connection failed", description: String(err), variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    supabase.auth.signOut();
    setAddress(null);
    setBalance("0");
    setIsAuthenticated(false);
    setUserId(null);
    toast({ title: "Wallet disconnected" });
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        shortAddress: address ? shortenAddress(address) : "",
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
