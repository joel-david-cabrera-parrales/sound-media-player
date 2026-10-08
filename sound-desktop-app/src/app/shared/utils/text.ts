/**
 * Normaliza texto para comparaciones de búsqueda:
 * minúsculas, sin tildes/diacríticos y sin espacios sobrantes.
 * El texto mostrado conserva siempre su forma original.
 */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
