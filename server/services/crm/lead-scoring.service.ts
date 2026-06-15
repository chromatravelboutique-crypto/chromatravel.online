export function scoreLeadData(data: {
  phone?: string | null;
  destination?: string | null;
  travelDates?: string | null;
  message?: string | null;
  source?: string | null;
}): { points: number; category: "HOT" | "WARM" | "COLD" } {
  let points = 0;
  if (data.phone) points += 25;
  if (data.destination) points += 20;
  if (data.travelDates) points += 20;
  if (data.message && data.message.length > 10) points += 15;
  if (data.source === "whatsapp" || data.source === "referral") points += 10;
  if (data.source === "widget-cotizador" || data.source === "exit-intent") points += 5;
  points += 10;
  let category: "HOT" | "WARM" | "COLD" = "COLD";
  if (points >= 70) category = "HOT";
  else if (points >= 40) category = "WARM";
  return { points, category };
}
