import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (consent === null) {
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setShowBanner(false);
    loadAmazonWidget();
  };

  const handleReject = () => {
    localStorage.setItem("cookie-consent", "false");
    setShowBanner(false);
  };

  const loadAmazonWidget = () => {
    const script = document.createElement("script");
    script.src = "//z-na.amazon-adsystem.com/widgets/onejs?MarketPlace=US";
    script.async = true;
    document.body.appendChild(script);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <Card className="mx-auto max-w-2xl p-4 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Usamos cookies</p>
              <p className="text-xs text-muted-foreground">
                Para mejorar tu experiencia y mostrar productos de afiliados (Amazon). 
                Puedes aceptar o rechazar en cualquier momento.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReject}
              data-testid="button-cookie-reject"
            >
              Rechazar
            </Button>
            <Button 
              size="sm" 
              onClick={handleAccept}
              data-testid="button-cookie-accept"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
