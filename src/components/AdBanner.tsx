import { useEffect, useRef } from "react";

interface AdBannerProps {
  adSlot: string;
  adFormat?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdBanner({ adSlot, adFormat = "auto", className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;

    try {
      if (typeof window !== "undefined" && window.adsbygoogle) {
        window.adsbygoogle.push({});
        isLoaded.current = true;
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  return (
    <div className={`ad-container ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXX" // Replace with your AdSense Publisher ID
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Placeholder component for development/preview
export function AdBannerPlaceholder({ className = "", vertical = false }: { className?: string; vertical?: boolean }) {
  return (
    <div
      className={`bg-muted/30 border border-dashed border-muted-foreground/20 rounded-xl flex items-center justify-center text-muted-foreground/60 text-sm overflow-hidden ${className} ${vertical ? 'w-full h-full min-h-[400px]' : ''}`}
    >
      <div className={`text-center p-4 ${vertical ? 'rotate-0 md:rotate-90' : ''}`}>
        <p className="font-semibold uppercase tracking-wider text-[10px] opacity-50 mb-1">Advertisement</p>
        <p className="text-xs font-mono">Google AdSense</p>
      </div>
    </div>
  );
}

export function SidebarAd({ side = "left" }: { side?: "left" | "right" }) {
  return (
    <aside className={`fixed top-24 bottom-12 hidden xl:flex flex-col gap-4 w-40 z-10 ${side === "left" ? "left-4" : "right-4"}`}>
      <AdBannerPlaceholder vertical className="flex-1" />
    </aside>
  );
}
