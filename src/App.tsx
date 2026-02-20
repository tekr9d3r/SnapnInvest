import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { WalletProvider } from "@/contexts/WalletContext";
import { BottomNav } from "@/components/BottomNav";
import Index from "./pages/Index";
import CameraPage from "./pages/CameraPage";
import ResultPage from "./pages/ResultPage";
import ConfirmPage from "./pages/ConfirmPage";
import PortfolioPage from "./pages/PortfolioPage";
import OnchainPortfolioPage from "./pages/OnchainPortfolioPage";
import NotFound from "./pages/NotFound";
import { useAppMode } from "@/contexts/AppModeContext";

const queryClient = new QueryClient();

function PortfolioRouter() {
  const { mode } = useAppMode();
  return mode === "onchain" ? <OnchainPortfolioPage /> : <PortfolioPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
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
              <Route path="/portfolio" element={<PortfolioRouter />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </WalletProvider>
        </AppModeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
