import { Camera, Home, PieChart, Rss, Trophy, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/camera", label: "Snap", icon: Camera },
  { path: "/feed", label: "Feed", icon: Rss },
  { path: "/leaderboard", label: "Ranks", icon: Trophy },
  { path: "/profile", label: "Me", icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (["/landing", "/camera", "/result", "/confirm"].includes(location.pathname)) return null;
  // Also active for profile sub-routes
  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-md items-center justify-around py-2">
        {tabs.map((tab) => {
          const tabActive = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-1 px-6 py-2 transition-colors"
            >
              {tabActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon
                className={`h-5 w-5 transition-colors ${
                  tabActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-xs font-medium transition-colors ${
                  tabActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
