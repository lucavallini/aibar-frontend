import { Empresa } from '../models/empresa.model';

export function obtenerNombreEmpresa(
  empresas: Empresa[] | null | undefined,
  id: string | null | undefined,
  fallback = '-',
): string {
  if (!id) return fallback;
  return empresas?.find((e) => e.id === id)?.nombre ?? fallback;
}

export function obtenerNombrePorId(
  mapa: Record<string, string> | null | undefined,
  id: string | null | undefined,
  fallback = 'Desconocido',
): string {
  if (!id) return fallback;
  return mapa?.[id] ?? fallback;
}
