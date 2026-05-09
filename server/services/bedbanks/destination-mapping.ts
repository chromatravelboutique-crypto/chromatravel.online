export interface DestinationMapping {
  canonical: string;
  displayName: string;
  country: string;
  tbo?: string;
  hotelbeds?: string;
  ratehawk?: string;
}

const DESTINATION_MAPPINGS: DestinationMapping[] = [
  { canonical: "paris", displayName: "Paris", country: "France", tbo: "115936", hotelbeds: "PAR", ratehawk: "paris" },
  { canonical: "rome", displayName: "Rome", country: "Italy", tbo: "115937", hotelbeds: "ROM", ratehawk: "rome" },
  { canonical: "barcelona", displayName: "Barcelona", country: "Spain", tbo: "115938", hotelbeds: "BCN", ratehawk: "barcelona" },
  { canonical: "london", displayName: "London", country: "UK", tbo: "115939", hotelbeds: "LON", ratehawk: "london" },
  { canonical: "dubai", displayName: "Dubai", country: "UAE", tbo: "115940", hotelbeds: "DXB", ratehawk: "dubai" },
  { canonical: "tokyo", displayName: "Tokyo", country: "Japan", tbo: "115941", hotelbeds: "TYO", ratehawk: "tokyo" },
  { canonical: "new-york", displayName: "New York", country: "USA", tbo: "115942", hotelbeds: "NYC", ratehawk: "new-york" },
  { canonical: "amsterdam", displayName: "Amsterdam", country: "Netherlands", tbo: "115943", hotelbeds: "AMS", ratehawk: "amsterdam" },
  { canonical: "bangkok", displayName: "Bangkok", country: "Thailand", tbo: "115944", hotelbeds: "BKK", ratehawk: "bangkok" },
  { canonical: "bali", displayName: "Bali", country: "Indonesia", tbo: "115945", hotelbeds: "DPS", ratehawk: "bali" },
  { canonical: "cancun", displayName: "Cancun", country: "Mexico", tbo: "115946", hotelbeds: "CUN", ratehawk: "cancun" },
  { canonical: "puerto-vallarta", displayName: "Puerto Vallarta", country: "Mexico", tbo: "115947", hotelbeds: "PVR", ratehawk: "puerto-vallarta" },
  { canonical: "mexico-city", displayName: "Mexico City", country: "Mexico", tbo: "115948", hotelbeds: "MEX", ratehawk: "mexico-city" },
  { canonical: "mykonos", displayName: "Mykonos", country: "Greece", tbo: "115949", hotelbeds: "JMK", ratehawk: "mykonos" },
  { canonical: "santorini", displayName: "Santorini", country: "Greece", tbo: "115950", hotelbeds: "JTR", ratehawk: "santorini" },
  { canonical: "lisbon", displayName: "Lisbon", country: "Portugal", tbo: "115951", hotelbeds: "LIS", ratehawk: "lisbon" },
  { canonical: "vienna", displayName: "Vienna", country: "Austria", tbo: "115952", hotelbeds: "VIE", ratehawk: "vienna" },
  { canonical: "prague", displayName: "Prague", country: "Czech Republic", tbo: "115953", hotelbeds: "PRG", ratehawk: "prague" },
  { canonical: "singapore", displayName: "Singapore", country: "Singapore", tbo: "115954", hotelbeds: "SIN", ratehawk: "singapore" },
  { canonical: "sydney", displayName: "Sydney", country: "Australia", tbo: "115955", hotelbeds: "SYD", ratehawk: "sydney" },
  { canonical: "maldives", displayName: "Maldives", country: "Maldives", tbo: "115956", hotelbeds: "MLE", ratehawk: "maldives" },
  { canonical: "marrakech", displayName: "Marrakech", country: "Morocco", tbo: "115957", hotelbeds: "RAK", ratehawk: "marrakech" },
  { canonical: "phuket", displayName: "Phuket", country: "Thailand", tbo: "115958", hotelbeds: "HKT", ratehawk: "phuket" },
];

export function findDestinationMapping(query: string): DestinationMapping | null {
  const normalized = query.toLowerCase().trim();
  
  const exact = DESTINATION_MAPPINGS.find(
    (m) =>
      m.canonical === normalized ||
      m.displayName.toLowerCase() === normalized ||
      m.tbo === normalized ||
      m.hotelbeds?.toLowerCase() === normalized ||
      m.ratehawk === normalized
  );
  
  if (exact) return exact;

  const partial = DESTINATION_MAPPINGS.find(
    (m) =>
      m.displayName.toLowerCase().includes(normalized) ||
      normalized.includes(m.canonical)
  );
  
  return partial || null;
}

export function getProviderCode(
  mapping: DestinationMapping | null,
  provider: "tbo" | "hotelbeds" | "ratehawk"
): string | null {
  if (!mapping) return null;
  return mapping[provider] || null;
}

export function getAllDestinations(): DestinationMapping[] {
  return DESTINATION_MAPPINGS;
}

export function addDestinationMapping(mapping: DestinationMapping): void {
  const existing = DESTINATION_MAPPINGS.findIndex(
    (m) => m.canonical === mapping.canonical
  );
  if (existing >= 0) {
    DESTINATION_MAPPINGS[existing] = mapping;
  } else {
    DESTINATION_MAPPINGS.push(mapping);
  }
}
