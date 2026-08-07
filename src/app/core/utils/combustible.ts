export function litros100(kmPorLitro: number | null | undefined): number | null {
  if (!kmPorLitro || kmPorLitro <= 0) return null;
  return Number((100 / kmPorLitro).toFixed(2));
}