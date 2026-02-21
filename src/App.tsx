import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from "@/lib/wagmi";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import Index from "./pages/Index";
import CameraPage from "./pages/CameraPage";
import ResultPage from "./pages/ResultPage";
import ConfirmPage from "./pages/ConfirmPage";
import PortfolioPage from "./pages/PortfolioPage";
import OnchainPortfolioPage from "./pages/OnchainPortfolioPage";
import FeedPage from "./pages/FeedPage";
import NotFound from "./pages/NotFound";
import { useAppMode } from "@/contexts/AppModeContext";

const queryClient = new QueryClient();

function PortfolioRouter() {
  const { mode } = useAppMode();
  return mode === "onchain" ? <OnchainPortfolioPage /> : <PortfolioPage />;
}

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={darkTheme({ accentColor: '#00dc82', accentColorForeground: 'black', borderRadius: 'large' })}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppModeProvider>
              <WalletProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/camera" element={<CameraPage />} />
                  <Route path="/result" element={<ResultPage />} />
                  <Route path="/confirm" element={<ConfirmPage />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/portfolio" element={<PortfolioRouter />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <TopBar />
                <BottomNav />
              </WalletProvider>
            </AppModeProvider>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
