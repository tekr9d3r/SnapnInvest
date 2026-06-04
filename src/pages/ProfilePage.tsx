import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Trophy, Zap, BarChart2, CheckCircle2, Circle, ExternalLink, Copy, Mail, Pencil } from "lucide-react";
import { StockLogo } from "@/components/StockLogo";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Holding {
  id: string;
  ticker: string;
  name: string | null;
  logo_url: string | null;
  amount_invested: number | null;
  captured_image_url: string | null;
  tx_hash: string | null;
  created_at: string;
}

interface Challenge {
  id: string;
  name: string;
  tickers: string[];
  prize: string;
  ends_at: string;
}

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 2)}***@${domain}`;
}

export default function ProfilePage() {
  const { address: connectedAddress } = useWallet();
  const { address: paramAddress } = useParams<{ address: string }>();
  const navigate = useNavigate();

  const address = paramAddress || connectedAddress;
  const isOwnProfile = !paramAddress || paramAddress.toLowerCase() === connectedAddress?.toLowerCase();

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Email state
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!address) { setLoading(false); return; }

    Promise.all([
      fetch(`/api/holdings?userId=${encodeURIComponent(address)}`).then((r) => r.json()),
      fetch(`/api/challenge?userId=${encodeURIComponent(address)}`).then((r) => r.json()),
      isOwnProfile
        ? fetch(`/api/profile?userId=${encodeURIComponent(address)}`).then((r) => r.json())
        : Promise.resolve(null),
    ])
      .then(([h, c, p]) => {
        setHoldings(Array.isArray(h) ? h : []);
        setChallenge(c.challenge ?? null);
        setProgress(c.progress ?? []);
        if (p?.email) setSavedEmail(p.email);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  const handleSaveEmail = async () => {
    if (!address || !emailInput) return;
    setSavingEmail(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: address, email: emailInput }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error ?? "Failed to save email");
        return;
      }
      setSavedEmail(emailInput);
      setEditingEmail(false);
      setEmailInput("");
      toast.success("Email saved");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingEmail(false);
    }
  };

  if (!address) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6">
        <p className="text-sm text-gray-400">Connect your wallet to view your profile</p>
      </div>
    );
  }

  const totalInvested = holdings.reduce((s, h) => s + (h.amount_invested || 0), 0);
  const uniqueStocks = new Set(holdings.map((h) => h.ticker)).size;
  const snapsWithPhotos = holdings.filter((h) => h.captured_image_url);
  const challengeComplete = challenge && progress.length >= challenge.tickers.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-16">
      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" className="max-h-full max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <div className="mx-auto max-w-md px-4">
        {/* Identity */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-2xl font-bold text-green-700">
            {address.slice(2, 4).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{shortenAddress(address)}</span>
              {isOwnProfile && (
                <span className="text-[10px] font-semibold text-green-600 border border-green-200 rounded-full px-2 py-0.5 bg-green-50">You</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-xs text-gray-400 truncate">{address}</span>
              <button onClick={() => { navigator.clipboard.writeText(address); toast.success("Copied!"); }}>
                <Copy className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mt-4 grid grid-cols-3 gap-2">
          {[
            { icon: Camera, label: "Snaps", value: holdings.length },
            { icon: BarChart2, label: "Stocks", value: uniqueStocks },
            { icon: Zap, label: "Invested", value: `$${totalInvested.toFixed(0)}` },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center rounded-2xl border border-gray-100 bg-white shadow-sm p-3">
              <s.icon className="mb-1 h-4 w-4 text-green-600" />
              <span className="text-xl font-bold text-gray-900">{s.value}</span>
              <span className="text-[10px] text-gray-400">{s.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Email section — own profile only */}
        {isOwnProfile && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
            className="mt-3 rounded-2xl border border-gray-100 bg-white shadow-sm px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                {savedEmail && !editingEmail ? (
                  <span className="text-sm text-gray-700 font-medium">{maskEmail(savedEmail)}</span>
                ) : !editingEmail ? (
                  <span className="text-sm text-gray-400">Add email to participate in challenges</span>
                ) : null}
              </div>
              {!editingEmail && (
                <button
                  onClick={() => { setEditingEmail(true); setEmailInput(savedEmail ?? ""); }}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  <Pencil className="h-3 w-3" />
                  {savedEmail ? "Edit" : "Add"}
                </button>
              )}
            </div>

            {editingEmail && (
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
                />
                <button
                  onClick={handleSaveEmail}
                  disabled={savingEmail || !emailInput}
                  className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {savingEmail ? "..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingEmail(false)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Active challenge progress */}
        {challenge && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="mt-3 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between bg-green-50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-green-600" />
                <span className="text-sm font-bold text-gray-900">{challenge.name}</span>
              </div>
              {challengeComplete
                ? <span className="text-[10px] font-semibold text-green-600 bg-green-100 border border-green-200 rounded-full px-2 py-0.5">In Raffle 🎉</span>
                : <span className="text-[10px] text-gray-400">{progress.length}/{challenge.tickers.length} found</span>}
            </div>
            <div className="divide-y divide-gray-50">
              {challenge.tickers.map((ticker) => {
                const done = progress.includes(ticker);
                return (
                  <div key={ticker} className="flex items-center gap-3 px-4 py-2">
                    {done ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <Circle className="h-4 w-4 text-gray-200 shrink-0" />}
                    <StockLogo ticker={ticker} size="sm" className="h-5 w-5" />
                    <span className={`text-sm font-semibold ${done ? "text-gray-900" : "text-gray-400"}`}>${ticker}</span>
                    {!done && <span className="ml-auto text-[10px] text-gray-300">Snap it →</span>}
                  </div>
                );
              })}
            </div>
            <div className="px-4 pb-3 pt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-green-500 transition-all duration-700"
                  style={{ width: `${(progress.length / challenge.tickers.length) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">Prize: <span className="text-green-600 font-semibold">{challenge.prize}</span></p>
            </div>
          </motion.div>
        )}

        {/* Snapped photos grid */}
        {snapsWithPhotos.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6">
            <h2 className="mb-3 text-base font-bold text-gray-900">Snaps</h2>
            <div className="grid grid-cols-2 gap-2">
              {snapsWithPhotos.map((h) => (
                <div key={h.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm cursor-zoom-in"
                  onClick={() => setLightbox(h.captured_image_url!)}>
                  <img src={h.captured_image_url!} alt={h.ticker} className="h-32 w-full object-cover" />
                  <div className="flex items-center justify-between px-2.5 py-2">
                    <div className="flex items-center gap-1.5">
                      <StockLogo ticker={h.ticker} size="sm" className="h-4 w-4" />
                      <span className="text-xs font-bold text-gray-900">${h.ticker}</span>
                    </div>
                    {h.tx_hash && (
                      <a href={`https://explorer.testnet.chain.robinhood.com/tx/${h.tx_hash}`}
                        target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                        className="text-[10px] text-green-600 hover:underline flex items-center gap-0.5">
                        tx <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <p className="px-2.5 pb-2 text-[10px] text-gray-400">
                    {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!loading && holdings.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <p className="text-sm text-gray-400">No snaps yet</p>
            {isOwnProfile && (
              <button onClick={() => navigate("/camera")} className="mt-4 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
                <Camera className="h-4 w-4" /> Start Snapping
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
