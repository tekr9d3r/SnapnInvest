import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from "@/lib/wagmi";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import Index from "./pages/Index";
import CameraPage from "./pages/CameraPage";
import ResultPage from "./pages/ResultPage";
import ConfirmPage from "./pages/ConfirmPage";
import PortfolioPage from "./pages/PortfolioPage";
import FeedPage from "./pages/FeedPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={darkTheme({ accentColor: '#00dc82', accentColorForeground: 'black', borderRadius: 'large' })}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <WalletProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/camera" element={<CameraPage />} />
                <Route path="/result" element={<ResultPage />} />
                <Route path="/confirm" element={<ConfirmPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <TopBar />
              <BottomNav />
            </WalletProvider>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
