import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { MapaFlota } from './mapa-flota';
import { environment } from '../../../../environments/environment';
import { Flota, Unidad } from '../../../core/models/telemetria.model';

function unidadEnMapa(patente: string, extra: Partial<any> = {}): Unidad {
  return {
    categoria: 'en_mapa',
    patente,
    camion_id: 'cam-1',
    marca: 'SCANIA',
    modelo: 'R450',
    tipo: 'chasis',
    empresa_id: 'emp-1',
    empresa_nombre: 'AIBAR',
    estado: 'viajando',
    viaje: null,
    descripcion_gps: null,
    chofer_gps: null,
    posicion: {
      latitud: -33.7,
      longitud: -61.9,
      velocidad_kph: 0,
      rumbo_grados: 90,
      reportado_en: '2026-08-25T11:00:00-03:00',
      minutos_desde_reporte: 2,
    },
    telemetria: { contacto_encendido: true, senal_trabajo: null, temperatura: null },
    ...extra,
  } as Unidad;
}

const FLOTA: Flota = {
  generado_en: '2026-08-25T11:00:00-03:00',
  resumen: { en_mapa: 1, sin_gps: 0, dadas_de_baja: 0, no_registradas: 0, en_viaje: 0 },
  unidades: [unidadEnMapa('AE195MX')],
};

describe('MapaFlota', () => {
  let fixture: ComponentFixture<MapaFlota>;
  let component: MapaFlota;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaFlota],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaFlota);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify({ ignoreCancelled: true }));

  function responderFlota(flota: Flota = FLOTA) {
    const pedidos = http.match((r) => r.url === `${environment.apiUrl}/telemetria/flota`);
    pedidos.forEach((p) => p.flush(flota));
    http
      .match((r) => r.url.includes('/empresas'))
      .forEach((p) =>
        p.flush({ items: [], total: 0, pagina: 1, tamano_pagina: 200, total_paginas: 1 }),
      );
    return pedidos;
  }

  it('se crea y consulta la flota al iniciar', () => {
    expect(responderFlota().length).toBeGreaterThan(0);
    expect(component.unidades().length).toBe(1);
  });

  it('el filtro de solo en viaje viaja al backend, no se resuelve en el cliente', () => {
    responderFlota();

    component.alternarSoloEnViaje();

    const pedido = http.expectOne((r) => r.url === `${environment.apiUrl}/telemetria/flota`);
    expect(pedido.request.params.get('solo_en_viaje')).toBe('true');
    pedido.flush(FLOTA);
  });

  it('marca como sin señal a las unidades que no reportan hace rato', () => {
    const vieja = unidadEnMapa('AE195MX', {
      posicion: { ...(FLOTA.unidades[0] as any).posicion, minutos_desde_reporte: 45 },
    });

    expect(component.claseUnidad(vieja)).toBe('estado-sin-senal');
    expect(component.reporteViejo(vieja)).toBe(true);
    responderFlota();
  });

  it('un camión dado de baja no se pinta como unidad ajena', () => {
    const baja = { ...unidadEnMapa('AI283WR'), categoria: 'dada_de_baja' } as Unidad;

    expect(component.claseUnidad(baja)).toBe('estado-dada-de-baja');
    responderFlota();
  });

  it('toda clase de estado lleva el prefijo que la aísla de los badges globales', () => {
    const enMovimiento = {
      ...unidadEnMapa('AE195MX'),
      viaje: { id: 'v', estado: 'en_curso' },
      posicion: { ...(FLOTA.unidades[0] as any).posicion, velocidad_kph: 80 },
    } as Unidad;
    const detenida = {
      ...enMovimiento,
      posicion: { ...(FLOTA.unidades[0] as any).posicion },
    } as Unidad;
    const ajena = { ...unidadEnMapa('AE538LR'), categoria: 'no_registrada' } as Unidad;
    const baja = { ...unidadEnMapa('AI283WR'), categoria: 'dada_de_baja' } as Unidad;

    for (const unidad of [unidadEnMapa('AE195MX'), enMovimiento, detenida, ajena, baja]) {
      expect(component.claseUnidad(unidad)).toMatch(/^estado-/);
    }
    expect(component.claseUnidad(enMovimiento)).toBe('estado-viajando');
    expect(component.claseUnidad(detenida)).toBe('estado-detenida');

    responderFlota();
  });

  it('en modo histórico se buscan viajes por chofer, patente y fechas', () => {
    responderFlota();

    component.cambiarModo('historico');
    // Al entrar trae los choferes para el selector.
    http.match((r) => r.url.includes('/choferes')).forEach((p) => p.flush({ items: [] }));

    component.histChoferId.set('cho-1');
    component.histPatente.set('AE195MX');
    component.histDesde.set('2026-08-01');
    component.histHasta.set('2026-08-31');
    component.buscarHistorico();

    const pedido = http.expectOne((r) => r.url === `${environment.apiUrl}/telemetria/viajes`);
    expect(pedido.request.params.get('chofer_id')).toBe('cho-1');
    expect(pedido.request.params.get('patente')).toBe('AE195MX');
    expect(pedido.request.params.get('fecha_desde')).toBe('2026-08-01');
    expect(pedido.request.params.get('fecha_hasta')).toBe('2026-08-31');
    pedido.flush([
      { id: 'via-9', origen: 'A', destino: 'B', patente: 'AE195MX', chofer_nombre: 'JUAN PEREZ' },
    ]);

    expect(component.histViajes().length).toBe(1);
    // La patente y el chofer vienen resueltos del backend, el mapa no cruza ids.
    expect(component.histViajes()[0].patente).toBe('AE195MX');
    expect(component.histViajes()[0].chofer_nombre).toBe('JUAN PEREZ');
  });

  it('elegir un viaje del histórico dibuja su recorrido', () => {
    responderFlota();
    component.cambiarModo('historico');
    http.match((r) => r.url.includes('/choferes')).forEach((p) => p.flush({ items: [] }));

    component.elegirViaje({ id: 'via-9' } as never);

    const pedido = http.expectOne(`${environment.apiUrl}/telemetria/viajes/via-9/recorrido`);
    pedido.flush({
      viaje_id: 'via-9',
      patente: 'AE195MX',
      distancia_km: 0,
      velocidad_maxima_kph: 0,
      puntos: [],
      detenciones: [],
      recortado: false,
      en_camino: false,
      sin_datos_por_antiguedad: true,
    });

    expect(component.recorrido()?.sin_datos_por_antiguedad).toBe(true);
  });

  it('explica por qué un viaje no tiene recorrido', () => {
    const base = {
      viaje_id: 'via-9',
      patente: 'AE195MX',
      distancia_km: 0,
      velocidad_maxima_kph: 0,
      puntos: [],
      detenciones: [],
      recortado: false,
      en_camino: false,
    };

    const viejo = { ...base, sin_datos_por_antiguedad: true };
    expect(component.motivoSinRecorrido(viejo as never)).toContain('seis meses');

    const reciente = { ...base, sin_datos_por_antiguedad: false };
    const motivo = component.motivoSinRecorrido(reciente as never) ?? '';
    expect(motivo).toContain('sin equipo de rastreo');
    expect(motivo).toContain('fechas');

    const conTraza = { ...base, puntos: [{}], sin_datos_por_antiguedad: false };
    expect(component.motivoSinRecorrido(conTraza as never)).toBeNull();

    responderFlota();
  });

  it('volver a Ahora limpia lo del histórico y recarga la flota', () => {
    responderFlota();
    component.cambiarModo('historico');
    http.match((r) => r.url.includes('/choferes')).forEach((p) => p.flush({ items: [] }));
    component.histViajes.set([{ id: 'via-9' } as never]);

    component.cambiarModo('ahora');

    expect(component.histViajes()).toEqual([]);
    expect(component.recorrido()).toBeNull();
    responderFlota();
  });

  it('al cargar el mapa no se pide ningún recorrido', () => {
    responderFlota();
    http.expectNone((r) => r.url.includes('/recorrido'));
  });

  it('seleccionar una unidad con viaje abre su recorrido sin que haya que pedirlo', () => {
    responderFlota();
    const conViaje = {
      ...unidadEnMapa('AE195MX'),
      viaje: {
        id: 'via-1',
        origen: 'ROSARIO',
        destino: 'BAHIA BLANCA',
        cliente: null,
        carga: null,
        tarifa: null,
        fecha_inicio: '2026-08-24T19:00:00-03:00',
        estado: 'en_curso',
        chofer_id: null,
        chofer_nombre: null,
      },
    } as Unidad;

    component.seleccionar(conViaje);

    const pedido = http.expectOne(`${environment.apiUrl}/telemetria/viajes/via-1/recorrido`);
    pedido.flush({
      viaje_id: 'via-1',
      patente: 'AE195MX',
      distancia_km: 615.1,
      velocidad_maxima_kph: 88,
      puntos: [
        {
          latitud: -33.1,
          longitud: -59.3,
          velocidad_kph: 62,
          limite_kph: 80,
          momento: '2026-08-24T20:30:00-03:00',
        },
      ],
      detenciones: [],
      recortado: true,
      en_camino: true,
    });

    expect(component.recorrido()?.en_camino).toBe(true);

    component.ocultarRecorrido();
    expect(component.recorrido()).toBeNull();
  });

  it('distingue una unidad no registrada de una del sistema', () => {
    const ajena = { ...unidadEnMapa('AE538LR'), categoria: 'no_registrada' } as Unidad;

    expect(component.claseUnidad(ajena)).toBe('estado-no-registrada');
    responderFlota();
  });
});
