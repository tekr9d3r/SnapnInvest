import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { connectWallet as connectMetaMask, getBalance, shortenAddress } from "@/lib/wallet";
import { useAppMode } from "./AppModeContext";

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
    setIsConnecting(true);
    try {
      const addr = await connectMetaMask();
      if (!addr) {
        setIsConnecting(false);
        return;
      }

      // Request signature for auth
      const message = `Sign in to Snap'n'Buy\n\nWallet: ${addr}\nTimestamp: ${Date.now()}`;
      let signature: string;
      try {
        signature = await window.ethereum!.request({
          method: "personal_sign",
          params: [message, addr],
        }) as string;
      } catch (sigErr) {
        console.error("User rejected signature:", sigErr);
        setIsConnecting(false);
        return;
      }

      // Call wallet-auth edge function using fetch for better error handling
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
        setIsConnecting(false);
        return;
      }

      // Set session in Supabase client
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      setAddress(addr.toLowerCase());
      const bal = await getBalance(addr);
      setBalance(bal);
    } catch (err) {
      console.error("Wallet connection failed:", err);
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
