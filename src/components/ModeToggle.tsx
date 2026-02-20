import { motion } from "framer-motion";
import { useAppMode, AppMode } from "@/contexts/AppModeContext";

const modes: { value: AppMode; label: string }[] = [
  { value: "demo", label: "Demo" },
  { value: "onchain", label: "Onchain" },
];

export function ModeToggle() {
  const { mode, setMode } = useAppMode();

  return (
    <div className="flex items-center rounded-full bg-secondary p-0.5">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          className="relative px-4 py-1.5 text-xs font-semibold transition-colors"
        >
          {mode === m.value && (
            <motion.div
              layoutId="mode-pill"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span
            className={`relative z-10 ${
              mode === m.value ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {m.label}
          </span>
        </button>
      ))}
    </div>
  );
}
