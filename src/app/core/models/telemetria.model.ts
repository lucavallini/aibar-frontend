export interface Posicion {
  latitud: number;
  longitud: number;
  velocidad_kph: number;
  rumbo_grados: number;
  reportado_en: string;
  minutos_desde_reporte: number;
}

export interface Telemetria {
  contacto_encendido: boolean;
  senal_trabajo: boolean | null;
  temperatura: number | null;
}

export interface ViajeEnCurso {
  id: string;
  origen: string;
  destino: string;
  cliente: string | null;
  carga: string | null;
  tarifa: number | null;
  fecha_inicio: string;
  estado: string;
  chofer_id: string | null;
  chofer_nombre: string | null;
}

interface UnidadBase {
  patente: string;
}

interface UnidadRegistrada extends UnidadBase {
  camion_id: string;
  marca: string | null;
  modelo: string | null;
  tipo: string | null;
  empresa_id: string | null;
  empresa_nombre: string | null;
  estado: string;
  viaje: ViajeEnCurso | null;
}

interface UnidadUbicada extends UnidadBase {
  posicion: Posicion;
  telemetria: Telemetria;
  descripcion_gps: string | null;
  chofer_gps: string | null;
}

export interface UnidadEnMapa extends UnidadRegistrada, UnidadUbicada {
  categoria: 'en_mapa';
}

export interface UnidadSinGps extends UnidadRegistrada {
  categoria: 'sin_gps';
  motivo: string;
}

export interface UnidadDadaDeBaja extends UnidadRegistrada, UnidadUbicada {
  categoria: 'dada_de_baja';
  motivo: string;
}

export interface UnidadNoRegistrada extends UnidadUbicada {
  categoria: 'no_registrada';
  motivo: string;
}

/** Unión discriminada por `categoria`, espejo de la que devuelve el backend. */
export type Unidad = UnidadEnMapa | UnidadSinGps | UnidadDadaDeBaja | UnidadNoRegistrada;

export type UnidadConPosicion = UnidadEnMapa | UnidadDadaDeBaja | UnidadNoRegistrada;

export function tienePosicion(unidad: Unidad): unidad is UnidadConPosicion {
  return unidad.categoria !== 'sin_gps';
}

export interface ResumenFlota {
  en_mapa: number;
  sin_gps: number;
  dadas_de_baja: number;
  no_registradas: number;
  en_viaje: number;
}

export interface Flota {
  generado_en: string;
  resumen: ResumenFlota;
  unidades: Unidad[];
}

export interface FiltrosFlota {
  busqueda?: string;
  empresa_id?: string;
  solo_en_viaje?: boolean;
  solo_ubicadas?: boolean;
}

export interface PuntoRecorrido {
  latitud: number;
  longitud: number;
  velocidad_kph: number;
  limite_kph: number | null;
  momento: string;
}

export interface DetencionRecorrido {
  latitud: number;
  longitud: number;
  inicio: string;
  fin: string | null;
  duracion: string | null;
}

export interface Recorrido {
  viaje_id: string;
  patente: string;
  distancia_km: number;
  velocidad_maxima_kph: number;
  puntos: PuntoRecorrido[];
  detenciones: DetencionRecorrido[];
  /** El proveedor devuelve días completos; true cuando se recortó al rango del viaje. */
  recortado: boolean;
  /** True si la unidad sigue rodando: el último punto es dónde va, no dónde llegó. */
  en_camino: boolean;
}
