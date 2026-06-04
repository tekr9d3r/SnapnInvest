import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Mail } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

interface Challenge {
  id: string;
  name: string;
  prize: string;
}

interface Props {
  challenge: Challenge;
  onClose: () => void;
  onSuccess: () => void;
}

export function EmailGateModal({ challenge, onClose, onSuccess }: Props) {
  const { address } = useWallet();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/challenge-enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: address, challengeId: challenge.id, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to join challenge");
        return;
      }
      toast.success("You're in! Good luck hunting 🎯");
      onSuccess();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-gray-900">{challenge.name}</span>
            </div>
            <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <p className="text-sm text-gray-500 mb-1">
              Prize: <span className="font-semibold text-gray-800">{challenge.prize}</span>
            </p>
            <p className="text-sm text-gray-500 mb-5">
              Enter your email so we can notify you if you win and deliver your prize.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Joining..." : "Join Challenge"}
              </button>
            </form>

            <p className="mt-3 text-center text-[11px] text-gray-400">
              Email used only for prize delivery. No spam.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
