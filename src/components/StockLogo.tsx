import tslaLogo from "@/assets/stocks/tsla.png";
import amznLogo from "@/assets/stocks/amzn.png";
import pltrLogo from "@/assets/stocks/pltr.png";
import nflxLogo from "@/assets/stocks/nflx.png";
import amdLogo from "@/assets/stocks/amd.png";

const LOGOS: Record<string, string> = {
  TSLA: tslaLogo,
  AMZN: amznLogo,
  PLTR: pltrLogo,
  NFLX: nflxLogo,
  AMD: amdLogo,
};

interface StockLogoProps {
  ticker: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export const StockLogo = ({ ticker, size = "md", className = "" }: StockLogoProps) => {
  const src = LOGOS[ticker];
  if (!src) {
    return (
      <div className={`${sizeMap[size]} flex items-center justify-center rounded-xl bg-secondary text-xs font-bold text-muted-foreground ${className}`}>
        {ticker}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={`${ticker} logo`}
      className={`${sizeMap[size]} rounded-xl object-contain bg-white p-1 ${className}`}
    />
  );
};
