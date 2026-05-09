import puertoVallarta from "@assets/generated_images/puerto_vallarta_luxury_resort.png";
import tulum from "@assets/generated_images/tulum_ruins_romantic_sunset.png";
import beachWedding from "@assets/generated_images/beach_wedding_ceremony_setup.png";
import cruiseShip from "@assets/generated_images/luxury_cruise_ship_sunset.png";
import cdmxHotel from "@assets/generated_images/mexico_city_boutique_hotel.png";
import beachProposal from "@assets/generated_images/beach_proposal_romantic_setup.png";
import santoriniYacht from "@assets/generated_images/santorini_yacht_mediterranean.png";
import anniversaryDinner from "@assets/generated_images/romantic_anniversary_dinner_terrace.png";
import vipTransfer from "@assets/generated_images/vip_airport_transfer_cancun.png";
import privateChef from "@assets/generated_images/private_chef_gourmet_cooking.png";
import hotelsCollage from "@assets/generated_images/luxury_mexican_hotels_collage.png";
import mykonosVsPV from "@assets/generated_images/mykonos_vs_puerto_vallarta.png";
import prideParade from "@assets/generated_images/pride_parade_celebration.png";
import soloTraveler from "@assets/generated_images/solo_traveler_european_cafe.png";
import beachClub from "@assets/generated_images/beach_club_pool_party.png";
import cruiseDinner from "@assets/generated_images/cruise_formal_dinner_night.png";
import musicFestival from "@assets/generated_images/european_music_festival.png";
import travelEssentials from "@assets/generated_images/travel_essentials_flat_lay.png";
import wellnessRetreat from "@assets/generated_images/wellness_yoga_retreat_jungle.png";
import oaxacanFood from "@assets/generated_images/oaxacan_cuisine_mezcal.png";
import travelInsurance from "@assets/generated_images/travel_insurance_concept.png";
import ecoLodge from "@assets/generated_images/eco-lodge_sustainable_travel.png";

export const blogImages: Record<string, string> = {
  "puerto-vallarta-luxury-gay-travel": puertoVallarta,
  "luna-de-miel-lgbt-tulum-riviera-maya": tulum,
  "bodas-igualitarias-mexico": beachWedding,
  "cruceros-lujo-lgbt-2026": cruiseShip,
  "hoteles-boutique-cdmx-parejas-lgbt": cdmxHotel,
  "propuesta-romantica-playa-del-carmen": beachProposal,
  "yate-privado-mykonos-santorini-lgbt": santoriniYacht,
  "paquetes-aniversario-lgbt-vip": anniversaryDinner,
  "transfers-vip-riviera-maya": vipTransfer,
  "experiencias-culinarias-privadas-lgbt": privateChef,
  "top-12-hoteles-gay-friendly-mexico": hotelsCollage,
  "mykonos-vs-puerto-vallarta": mykonosVsPV,
  "guia-seguridad-viajeros-trans": soloTraveler,
  "guia-prides-vip-tel-aviv-madrid-nyc": prideParade,
  "destinos-lgbt-viajeros-solo-40-plus": soloTraveler,
  "seguro-viaje-parejas-lgbt": travelInsurance,
  "beach-clubs-gay-mexico": beachClub,
  "etiqueta-cruceros-gay": cruiseDinner,
  "mejores-festivales-queer-europa": musicFestival,
  "checklist-viaje-vip-lgbt": travelEssentials,
  "retiros-wellness-lgbt-mexico": wellnessRetreat,
  "gastronomia-queer-cdmx-oaxaca": oaxacanFood,
  "fotografos-bodas-lgbt-mexico": beachWedding,
  "turismo-responsable-queer-mexico": ecoLodge,
  "viajes-corporativos-queer-cdmx": cdmxHotel,
  "viajes-lgbt-mascotas-pet-friendly": puertoVallarta,
  "tours-culturales-queer-oaxaca-merida": oaxacanFood,
  "escapadas-48-horas-cdmx": cdmxHotel,
  "bar-crawl-zona-romantica": beachClub,
  "agenda-enero-junio-2026": prideParade,
};

export function getBlogImage(slug: string): string | undefined {
  return blogImages[slug];
}
