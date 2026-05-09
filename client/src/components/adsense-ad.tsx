import { useEffect, useRef } from "react";

interface AdSenseAdProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  layout?: string;
  layoutKey?: string;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || "";

export function AdSenseAd({ 
  slot, 
  format = "auto", 
  layout,
  layoutKey,
  className = "",
  style 
}: AdSenseAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current) return;
    
    try {
      if (typeof window !== "undefined" && adRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, []);

  if (!ADSENSE_CLIENT_ID) return null;

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={style || { display: "block" }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
      {...(layout && { "data-ad-layout": layout })}
      {...(layoutKey && { "data-ad-layout-key": layoutKey })}
    />
  );
}

const ADSENSE_SLOTS = {
  inArticle: import.meta.env.VITE_ADSENSE_SLOT_IN_ARTICLE || "",
  afterContent: import.meta.env.VITE_ADSENSE_SLOT_AFTER_CONTENT || "",
  sidebar: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR || "",
};

export function InArticleAd({ className = "" }: { className?: string }) {
  if (!ADSENSE_SLOTS.inArticle) return null;
  
  return (
    <div className={`my-8 ${className}`} data-testid="ad-in-article">
      <div className="text-center text-xs text-muted-foreground mb-2">Publicidad</div>
      <AdSenseAd 
        slot={ADSENSE_SLOTS.inArticle}
        layout="in-article"
        format="fluid"
      />
    </div>
  );
}

export function AfterContentAd({ className = "" }: { className?: string }) {
  if (!ADSENSE_SLOTS.afterContent) return null;
  
  return (
    <div className={`mt-12 py-8 border-t ${className}`} data-testid="ad-after-content">
      <div className="text-center text-xs text-muted-foreground mb-4">Te puede interesar</div>
      <AdSenseAd 
        slot={ADSENSE_SLOTS.afterContent}
        format="auto"
        style={{ display: "block", textAlign: "center" }}
      />
    </div>
  );
}

export function SidebarAd({ className = "" }: { className?: string }) {
  if (!ADSENSE_SLOTS.sidebar) return null;
  
  return (
    <div className={`sticky top-4 z-50 ${className}`} data-testid="ad-sidebar">
      <div className="text-center text-xs text-muted-foreground mb-2">Patrocinado</div>
      <AdSenseAd 
        slot={ADSENSE_SLOTS.sidebar}
        format="vertical"
        style={{ display: "block", minHeight: "250px" }}
      />
    </div>
  );
}
