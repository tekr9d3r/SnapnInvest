import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
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
import ReadmePage from "./pages/ReadmePage";

const queryClient = new QueryClient();

const privyAppId = "cmlvmgiov00w30bjxom0snwdw";

const App = () => (
  <PrivyProvider
    appId={privyAppId}
    config={{
      appearance: {
        theme: "dark",
        accentColor: "#00dc82",
      },
      loginMethods: ["wallet", "twitter", "google", "email"],
      embeddedWallets: {
        ethereum: {
          createOnLogin: "off",
        },
      },
      supportedChains: [
        {
          id: 46630,
          name: "Robinhood Chain Testnet",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: {
            default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
          },
          blockExplorers: {
            default: { name: "Explorer", url: "https://explorer.testnet.chain.robinhood.com" },
          },
          testnet: true,
        },
      ],
      defaultChain: {
        id: 46630,
        name: "Robinhood Chain Testnet",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: {
          default: { http: ["https://rpc.testnet.chain.robinhood.com"] },
        },
        testnet: true,
      },
    }}
  >
    <QueryClientProvider client={queryClient}>
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
              <Route path="/readme" element={<ReadmePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <TopBar />
            <BottomNav />
            <Analytics />
          </WalletProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </PrivyProvider>
);

export default App;
