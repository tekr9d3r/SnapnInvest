import { Camera, Home, Rss, Trophy, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const sideTabs = [
  [
    { path: "/", label: "Home", icon: Home },
    { path: "/feed", label: "Feed", icon: Rss },
  ],
  [
    { path: "/leaderboard", label: "Ranks", icon: Trophy },
    { path: "/profile", label: "Me", icon: User },
  ],
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (["/landing", "/camera", "/result", "/confirm"].includes(location.pathname)) return null;

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const isSnapping = location.pathname === "/camera";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/90 backdrop-blur-xl shadow-sm overflow-visible">
      <div className="mx-auto flex max-w-md items-end justify-around pb-2 pt-1">

        {/* Left tabs */}
        {sideTabs[0].map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-1 px-5 py-1 transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-xs font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Center Snap button — elevated hero CTA */}
        <button
          onClick={() => navigate("/camera")}
          className="relative -mt-7 flex flex-col items-center gap-1 px-2"
        >
          <div className={`relative flex h-[58px] w-[58px] items-center justify-center rounded-full shadow-lg transition-transform active:scale-95
            ${isSnapping ? "bg-green-600" : "bg-green-500"}
            shadow-green-300/60 ring-4 ring-white`}
          >
            {/* Slow pulse ring */}
            <span className="absolute inset-0 rounded-full bg-green-400 opacity-0 animate-ping" style={{ animationDuration: "2.5s" }} />
            <Camera className="relative h-6 w-6 text-white" strokeWidth={2.2} />
          </div>
          <span className={`text-[11px] font-bold transition-colors ${isSnapping ? "text-green-600" : "text-green-500"}`}>
            Snap
          </span>
        </button>

        {/* Right tabs */}
        {sideTabs[1].map((tab) => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center gap-1 px-5 py-1 transition-colors"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 h-0.5 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <tab.icon className={`h-5 w-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-xs font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

      </div>
    </nav>
  );
}
