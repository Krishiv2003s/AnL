import { useEffect, useRef } from "react";

interface AdSidebarProps {
  adSlot: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdSidebar({ adSlot, className = "" }: AdSidebarProps) {
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
    <div className={`ad-sidebar ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXX" // Replace with your AdSense Publisher ID
        data-ad-slot={adSlot}
        data-ad-format="vertical"
        data-full-width-responsive="true"
      />
    </div>
  );
}

// Placeholder component for development/preview
export function AdSidebarPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`bg-muted/50 border border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center text-muted-foreground text-sm min-h-[250px] ${className}`}
    >
      <div className="text-center p-4">
        <p className="font-medium">Advertisement</p>
        <p className="text-xs mt-1">Google AdSense</p>
        <p className="text-xs mt-2 opacity-70">Sidebar Ad Unit</p>
      </div>
    </div>
  );
}
