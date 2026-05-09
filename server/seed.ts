import { db } from "./db";
import { hotels, rooms, rates, destinations, providers } from "@shared/schema";
import { sql } from "drizzle-orm";

function getDatabase() {
  if (!db) {
    throw new Error("Database not available");
  }
  return db;
}

const seedDestinations = [
  {
    name: "Barcelona",
    country: "España",
    description: "Barcelona es la capital gay de Europa y uno de los destinos más acogedores para la comunidad LGBT+ en el mundo. Con su vibrante barrio del Eixample (conocido como 'Gayxample'), playas nudistas como Mar Bella, y una vida nocturna incomparable.",
    shortDescription: "Capital gay de Europa con el vibrante Gayxample",
    image: "/assets/barcelona_destination_aerial.png",
    lgbtFriendlyScore: 9,
    featured: true,
    slug: "barcelona"
  },
  {
    name: "Puerto Vallarta",
    country: "México",
    description: "Puerto Vallarta es el destino LGBT+ más popular de México, con la famosa Zona Romántica llena de bares, restaurantes y hoteles gay-friendly. Playas hermosas y una comunidad acogedora.",
    shortDescription: "El paraíso gay de México con la famosa Zona Romántica",
    image: "/assets/puerto_vallarta_destination.png",
    lgbtFriendlyScore: 9,
    featured: true,
    slug: "puerto-vallarta"
  },
  {
    name: "Ámsterdam",
    country: "Países Bajos",
    description: "Ámsterdam fue el primer país en legalizar el matrimonio igualitario. Con canales románticos, una cultura abierta y festivales Pride icónicos, es un destino imperdible.",
    shortDescription: "Pionera en derechos LGBT+ con canales románticos",
    image: "/assets/amsterdam_canal_sunset.png",
    lgbtFriendlyScore: 10,
    featured: true,
    slug: "amsterdam"
  },
  {
    name: "Mykonos",
    country: "Grecia",
    description: "Mykonos es la isla griega más famosa para viajeros LGBT+. Playas exclusivas, fiestas épicas y un ambiente cosmopolita hacen de este destino un favorito mundial.",
    shortDescription: "Isla griega con las mejores fiestas de verano",
    image: "/assets/mykonos_greece_destination.png",
    lgbtFriendlyScore: 9,
    featured: true,
    slug: "mykonos"
  },
  {
    name: "Berlín",
    country: "Alemania",
    description: "Berlín tiene una de las escenas LGBT+ más diversas y alternativas del mundo. Desde clubes underground hasta el famoso barrio de Schöneberg, hay algo para todos.",
    shortDescription: "Capital alternativa con escena underground vibrante",
    image: "/assets/berlin_destination.png",
    lgbtFriendlyScore: 9,
    featured: false,
    slug: "berlin"
  },
  {
    name: "San Francisco",
    country: "Estados Unidos",
    description: "Cuna del movimiento LGBT+ moderno, San Francisco y su icónico barrio Castro siguen siendo un símbolo de orgullo y libertad para la comunidad.",
    shortDescription: "Cuna del movimiento LGBT+ moderno con el Castro",
    image: "/assets/san_francisco_destination.png",
    lgbtFriendlyScore: 10,
    featured: false,
    slug: "san-francisco"
  }
];

const seedHotels = [
  {
    name: "Hotel Boutique Arcoíris",
    description: "Ubicado en el corazón del barrio gay de Barcelona, el Hotel Boutique Arcoíris ofrece una experiencia única para viajeros LGBT+. Nuestro equipo acogedor y ambiente inclusivo garantizan una estancia inolvidable.\n\nDisfruta de habitaciones elegantemente decoradas con vistas a la ciudad, un rooftop bar exclusivo y acceso directo a las mejores playas y vida nocturna de Barcelona.",
    shortDescription: "Hotel boutique LGBT-friendly en el corazón de Barcelona",
    address: "Calle de l'Eixample 123",
    city: "Barcelona",
    country: "España",
    latitude: "41.3851",
    longitude: "2.1734",
    starRating: 4,
    lgbtFriendlyLevel: 5,
    lgbtCertified: true,
    amenities: ["wifi", "breakfast", "pool", "gym", "bar", "restaurant", "spa", "parking"],
    images: ["/assets/luxury_boutique_hotel_dusk.png", "/assets/luxury_hotel_room_interior.png"],
    thumbnail: "/assets/luxury_boutique_hotel_dusk.png",
    policies: { checkIn: "15:00", checkOut: "11:00", cancellation: "Free cancellation up to 48 hours before check-in" },
    minPrice: "150.00",
    currency: "EUR",
    active: true
  },
  {
    name: "Casa Romántica Puerto Vallarta",
    description: "Casa Romántica es un hotel boutique exclusivo para adultos ubicado en la Zona Romántica de Puerto Vallarta. Con vistas espectaculares al océano y servicio personalizado, es el escape perfecto para parejas LGBT+.",
    shortDescription: "Hotel boutique en la Zona Romántica con vistas al mar",
    address: "Calle Olas Altas 450",
    city: "Puerto Vallarta",
    country: "México",
    latitude: "20.5965",
    longitude: "-105.2303",
    starRating: 4,
    lgbtFriendlyLevel: 5,
    lgbtCertified: true,
    amenities: ["wifi", "breakfast", "pool", "bar", "restaurant", "beach", "spa"],
    images: ["/assets/luxury_boutique_hotel_dusk.png"],
    thumbnail: "/assets/luxury_boutique_hotel_dusk.png",
    policies: { checkIn: "15:00", checkOut: "12:00", cancellation: "Free cancellation up to 72 hours before check-in" },
    minPrice: "180.00",
    currency: "USD",
    active: true
  },
  {
    name: "Canal House Amsterdam",
    description: "Situado en una casa del siglo XVII junto a los canales, Canal House combina la elegancia histórica con comodidades modernas. Un oasis de tranquilidad en el corazón de la capital más gay-friendly del mundo.",
    shortDescription: "Hotel histórico junto a los icónicos canales",
    address: "Keizersgracht 148",
    city: "Ámsterdam",
    country: "Países Bajos",
    latitude: "52.3702",
    longitude: "4.8952",
    starRating: 5,
    lgbtFriendlyLevel: 5,
    lgbtCertified: true,
    amenities: ["wifi", "breakfast", "bar", "garden", "concierge", "bike-rental"],
    images: ["/assets/amsterdam_canal_sunset.png"],
    thumbnail: "/assets/amsterdam_canal_sunset.png",
    policies: { checkIn: "14:00", checkOut: "11:00", cancellation: "Free cancellation up to 24 hours before check-in" },
    minPrice: "250.00",
    currency: "EUR",
    active: true
  },
  {
    name: "Mykonos Blu Resort",
    description: "El resort más exclusivo de Mykonos, con bungalows privados con piscina y acceso directo a la playa de Psarou. Servicio impecable y ambiente cosmopolita para viajeros exigentes.",
    shortDescription: "Resort de lujo con bungalows privados frente al mar",
    address: "Psarou Beach",
    city: "Mykonos",
    country: "Grecia",
    latitude: "37.4220",
    longitude: "25.3390",
    starRating: 5,
    lgbtFriendlyLevel: 5,
    lgbtCertified: true,
    amenities: ["wifi", "breakfast", "pool", "spa", "beach", "restaurant", "bar", "gym"],
    images: ["/assets/mykonos_greece_destination.png"],
    thumbnail: "/assets/mykonos_greece_destination.png",
    policies: { checkIn: "15:00", checkOut: "12:00", cancellation: "Non-refundable" },
    minPrice: "450.00",
    currency: "EUR",
    active: true
  }
];

const seedRooms = [
  {
    name: "Habitación Deluxe",
    description: "Amplia habitación con cama king size, vistas a la ciudad y baño de mármol con ducha de lluvia.",
    maxOccupancy: 2,
    bedType: "King",
    size: 35,
    amenities: ["wifi", "minibar", "safe", "tv", "coffee-maker", "balcony"],
    images: ["/assets/luxury_hotel_room_interior.png"]
  },
  {
    name: "Suite Junior",
    description: "Suite elegante con área de estar separada, bañera de hidromasaje y terraza privada.",
    maxOccupancy: 2,
    bedType: "King",
    size: 50,
    amenities: ["wifi", "minibar", "safe", "tv", "coffee-maker", "jacuzzi", "terrace"],
    images: ["/assets/luxury_hotel_room_interior.png"]
  },
  {
    name: "Habitación Estándar",
    description: "Cómoda habitación con todas las amenidades esenciales para una estancia placentera.",
    maxOccupancy: 2,
    bedType: "Queen",
    size: 25,
    amenities: ["wifi", "safe", "tv", "coffee-maker"],
    images: ["/assets/luxury_hotel_room_interior.png"]
  }
];

const seedProviders = [
  {
    name: "Mock Provider",
    type: "direct",
    apiUrl: null,
    authType: "none",
    active: true,
    priority: 1,
    lastSync: new Date()
  },
  {
    name: "Hotelbeds",
    type: "bedbank",
    apiUrl: "https://api.hotelbeds.com/hotel-api/1.0",
    authType: "apikey",
    active: false,
    priority: 2,
    lastSync: null
  },
  {
    name: "Amadeus",
    type: "gds",
    apiUrl: "https://api.amadeus.com/v3/shopping",
    authType: "oauth2",
    active: false,
    priority: 3,
    lastSync: null
  }
];

async function seed() {
  console.log("Starting database seed...");

  try {
    const existingHotels = await getDatabase().select().from(hotels).limit(1);
    if (existingHotels.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding destinations...");
    const insertedDestinations = await getDatabase().insert(destinations).values(seedDestinations).returning();
    console.log(`Inserted ${insertedDestinations.length} destinations`);

    console.log("Seeding providers...");
    const insertedProviders = await getDatabase().insert(providers).values(seedProviders).returning();
    console.log(`Inserted ${insertedProviders.length} providers`);

    console.log("Seeding hotels...");
    const insertedHotels = await getDatabase().insert(hotels).values(seedHotels).returning();
    console.log(`Inserted ${insertedHotels.length} hotels`);

    console.log("Seeding rooms for each hotel...");
    let totalRooms = 0;
    let totalRates = 0;

    for (const hotel of insertedHotels) {
      const hotelRooms = seedRooms.map(room => ({
        ...room,
        hotelId: hotel.id
      }));
      
      const insertedRooms = await getDatabase().insert(rooms).values(hotelRooms).returning();
      totalRooms += insertedRooms.length;

      for (const room of insertedRooms) {
        const roomRates = [
          {
            roomId: room.id,
            hotelId: hotel.id,
            name: "Tarifa Flexible",
            description: "Cancelación gratuita hasta 48 horas antes",
            price: (parseFloat(hotel.minPrice || "150") * 1.1).toFixed(2),
            originalPrice: null,
            currency: hotel.currency || "USD",
            mealPlan: "Solo alojamiento",
            cancellationPolicy: "flexible",
            refundable: true,
            availableFrom: new Date(),
            availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          },
          {
            roomId: room.id,
            hotelId: hotel.id,
            name: "Tarifa con Desayuno",
            description: "Incluye desayuno buffet para 2 personas",
            price: (parseFloat(hotel.minPrice || "150") * 1.25).toFixed(2),
            originalPrice: (parseFloat(hotel.minPrice || "150") * 1.4).toFixed(2),
            currency: hotel.currency || "USD",
            mealPlan: "Desayuno incluido",
            cancellationPolicy: "flexible",
            refundable: true,
            availableFrom: new Date(),
            availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          },
          {
            roomId: room.id,
            hotelId: hotel.id,
            name: "Tarifa No Reembolsable",
            description: "Mejor precio garantizado sin cancelación",
            price: hotel.minPrice || "150",
            originalPrice: (parseFloat(hotel.minPrice || "150") * 1.2).toFixed(2),
            currency: hotel.currency || "USD",
            mealPlan: "Solo alojamiento",
            cancellationPolicy: "non-refundable",
            refundable: false,
            availableFrom: new Date(),
            availableTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          }
        ];

        const insertedRates = await getDatabase().insert(rates).values(roomRates).returning();
        totalRates += insertedRates.length;
      }
    }

    console.log(`Inserted ${totalRooms} rooms`);
    console.log(`Inserted ${totalRates} rates`);

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("Seed script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });
