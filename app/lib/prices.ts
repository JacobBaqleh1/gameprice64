export function parsePrice(s?: string): number | null {
  if (!s) return null;
  // Remove commas and currency symbols - keep dot
  const cleaned = s.replace(/[^\d.]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function calculateAverage(nums: number[]): number {
  if (!nums.length) return 0;
  const sum = nums.reduce((a, b) => a + b, 0);
  return sum / nums.length;
}
