import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock, Trophy, Users, Zap, Star } from "lucide-react";
import { StockLogo } from "@/components/StockLogo";
import { useWallet } from "@/contexts/WalletContext";
import { formatDistanceToNow } from "date-fns";
import { EmailGateModal } from "@/components/EmailGateModal";

interface Challenge {
  id: string;
  name: string;
  description: string;
  tickers: string[];
  prize: string;
  challenge_type: string;
  starts_at: string;
  ends_at: string;
  progress: string[];
  completedCount: number;
  enrolled: boolean;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Zap }> = {
  weekly: { label: "Weekly", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: Zap },
  board: { label: "30-Day", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Trophy },
  grand: { label: "Grand Challenge", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: Star },
};

function ChallengeCard({
  challenge,
  onEnroll,
}: {
  challenge: Challenge;
  onEnroll: (c: Challenge) => void;
}) {
  const config = TYPE_CONFIG[challenge.challenge_type] ?? TYPE_CONFIG.weekly;
  const Icon = config.icon;
  const completed = challenge.progress.length >= challenge.tickers.length;
  const timeLeft = formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: false });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${config.bg} ${config.color}`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
          <span className="font-semibold text-sm text-gray-900">{challenge.name}</span>
        </div>
        {completed ? (
          <span className="text-[11px] font-semibold text-green-600">🎉 In the draw</span>
        ) : null}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-4 py-2 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {challenge.completedCount} completed
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeLeft} left
        </span>
        <span className="ml-auto font-medium text-gray-500">
          Prize: <span className="text-gray-700">{challenge.prize}</span>
        </span>
      </div>

      {/* Ticker pills */}
      <div className="px-4 py-2 flex flex-wrap gap-2">
        {challenge.tickers.map((ticker) => {
          const done = challenge.progress.includes(ticker);
          return (
            <div
              key={ticker}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-colors
                ${done
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
            >
              {done ? (
                <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
              ) : (
                <Circle className="h-3 w-3 text-gray-300 shrink-0" />
              )}
              <StockLogo ticker={ticker} size="sm" className="h-3.5 w-3.5" />
              <span>{ticker}</span>
            </div>
          );
        })}
      </div>

      {/* Progress bar + action */}
      <div className="px-4 pb-4 pt-2">
        <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
          <span>{challenge.progress.length} / {challenge.tickers.length} found</span>
          {challenge.enrolled && !completed && (
            <span className="text-green-600 font-medium">Enrolled</span>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <motion.div
            className="h-full rounded-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${(challenge.progress.length / challenge.tickers.length) * 100}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>

        {!challenge.enrolled && !completed && (
          <button
            onClick={() => onEnroll(challenge)}
            className="mt-3 w-full rounded-xl bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
          >
            Join & Track Progress
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function ChallengeCards() {
  const { address } = useWallet();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollTarget, setEnrollTarget] = useState<Challenge | null>(null);

  const load = () => {
    const url = address
      ? `/api/challenges?userId=${encodeURIComponent(address)}`
      : "/api/challenges";

    fetch(url)
      .then((r) => r.json())
      .then((data) => setChallenges(data.challenges ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [address]);

  if (loading) return null;
  if (challenges.length === 0) return null;

  return (
    <>
      <div className="w-full max-w-md px-4 space-y-3">
        {challenges.map((c) => (
          <ChallengeCard
            key={c.id}
            challenge={c}
            onEnroll={setEnrollTarget}
          />
        ))}
      </div>

      {enrollTarget && (
        <EmailGateModal
          challenge={enrollTarget}
          onClose={() => setEnrollTarget(null)}
          onSuccess={() => {
            setEnrollTarget(null);
            load();
          }}
        />
      )}
    </>
  );
}
