export function predictDaysRemaining(
  currentQty: number,
  dispenseHistory: number[],
  dispenseCount: number
): { daysLeft: number; rate: string; confidence: string } | null {
  if (!dispenseHistory || dispenseHistory.length < 2) return null;

  // Calculate average daily consumption rate
  const oldest = dispenseHistory[0];
  const newest = dispenseHistory[dispenseHistory.length - 1];
  const daysCovered = (newest - oldest) / (1000 * 60 * 60 * 24);

  if (daysCovered < 1) return null; // Too recent to predict

  const rate = dispenseCount / daysCovered; // units per day

  if (rate <= 0) return null;

  const daysLeft = Math.round(currentQty / rate);

  return {
    daysLeft,
    rate: rate.toFixed(2),
    confidence:
      dispenseHistory.length >= 5
        ? "high"
        : dispenseHistory.length >= 2
        ? "medium"
        : "low",
  };
}

export function formatDate(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatSimpleDate(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
}
