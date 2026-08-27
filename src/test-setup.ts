/**
 * jsdom habilita localStorage solo cuando el documento tiene un origen real; bajo el
 * runner de Angular queda indefinido y cualquier servicio que lo use falla al construirse.
 * Se completa acá para que los tests corran contra la misma API que el navegador.
 */
function almacenamientoEnMemoria(): Storage {
  const datos = new Map<string, string>();
  return {
    get length() {
      return datos.size;
    },
    key: (i: number) => [...datos.keys()][i] ?? null,
    getItem: (k: string) => datos.get(k) ?? null,
    setItem: (k: string, v: string) => void datos.set(k, String(v)),
    removeItem: (k: string) => void datos.delete(k),
    clear: () => datos.clear(),
  } as Storage;
}

for (const nombre of ['localStorage', 'sessionStorage'] as const) {
  if (!globalThis[nombre]) {
    Object.defineProperty(globalThis, nombre, { value: almacenamientoEnMemoria(), writable: true });
  }
}
