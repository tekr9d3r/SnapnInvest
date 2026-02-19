import { useState } from "react";

interface StockLogoProps {
  ticker: string;
  logoUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export const StockLogo = ({ ticker, logoUrl, size = "md", className = "" }: StockLogoProps) => {
  const [imgError, setImgError] = useState(false);
  const src = logoUrl || `https://assets.parqet.com/logos/symbol/${ticker}`;

  if (imgError) {
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
      onError={() => setImgError(true)}
    />
  );
};
