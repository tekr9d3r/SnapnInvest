import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { WalletProvider } from "@/contexts/WalletContext";
import { BottomNav } from "@/components/BottomNav";
import { TopBar } from "@/components/TopBar";
import { wagmiConfig } from "@/lib/wagmi";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import CameraPage from "./pages/CameraPage";
import ResultPage from "./pages/ResultPage";
import ConfirmPage from "./pages/ConfirmPage";
import PortfolioPage from "./pages/PortfolioPage";
import FeedPage from "./pages/FeedPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import NotFound from "./pages/NotFound";
import ReadmePage from "./pages/ReadmePage";

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <ConnectKitProvider
        theme="midnight"
        customTheme={{
          "--ck-accent-color": "#00dc82",
          "--ck-accent-text-color": "#000000",
        }}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <WalletProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/camera" element={<CameraPage />} />
                <Route path="/result" element={<ResultPage />} />
                <Route path="/confirm" element={<ConfirmPage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/p/:address" element={<ProfilePage />} />
                <Route path="/readme" element={<ReadmePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <TopBar />
              <BottomNav />
              <Analytics />
            </WalletProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ConnectKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
