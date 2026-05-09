import { useQuery } from "@tanstack/react-query";
import { SiWhatsapp } from "react-icons/si";
import type { Brand } from "@shared/schema";

const DEFAULT_WHATSAPP = {
  chroma: {
    number: "524434044104",
    message: "Hola, me interesa conocer más sobre sus paquetes de viaje LGBT-friendly",
  },
  fenix: {
    number: "524435049568",
    message: "Hola, me interesa conocer más sobre sus paquetes de viaje premium",
  },
};

export function WhatsAppButton() {
  const { data: brand } = useQuery<Brand>({
    queryKey: ["/api/brand"],
  });

  const whatsappNumber = brand?.whatsappNumber || 
    (brand?.code === "fenix" ? DEFAULT_WHATSAPP.fenix.number : DEFAULT_WHATSAPP.chroma.number);
  
  const whatsappMessage = brand?.whatsappMessage || 
    (brand?.code === "fenix" ? DEFAULT_WHATSAPP.fenix.message : DEFAULT_WHATSAPP.chroma.message);

  const encodedMessage = encodeURIComponent(whatsappMessage);

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${encodedMessage}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
      aria-label="Contáctanos por WhatsApp"
      data-testid="button-whatsapp-float"
    >
      <SiWhatsapp className="h-7 w-7" />
    </a>
  );
}
