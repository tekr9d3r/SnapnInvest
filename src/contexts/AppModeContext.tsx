import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AppMode = "demo" | "onchain";

interface AppModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextValue>({
  mode: "demo",
  setMode: () => {},
});

const STORAGE_KEY = "snapnbuy_mode";

export function AppModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "onchain" ? "onchain" : "demo";
  });

  const setMode = (m: AppMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export const useAppMode = () => useContext(AppModeContext);
