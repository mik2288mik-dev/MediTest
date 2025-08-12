export type Point = { lat: number; lng: number };
export function bin1km(lat: number, lng: number) {
  const scale = 0.009; // ~1km in degrees lat
  const bx = Math.round(lng / scale);
  const by = Math.round(lat / scale);
  return `${by}:${bx}`;
}