import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ListaChoferesComponent } from './lista-choferes';
import { environment } from '../../../../environments/environment';

const RESPUESTA = {
  items: [
    {
      id: 'cho-1',
      nombre_completo: 'JUAN PEREZ',
      estado: 'disponible',
      activo: true,
      kms_periodo: 6742,
      viajes_periodo: 13,
      promedio_kms_viaje: 518.62,
    },
  ],
  total: 1,
  pagina: 1,
  tamano_pagina: 20,
  total_paginas: 1,
  periodo: { desde: '2026-08-15', hasta: null, total_kms: 228782, total_viajes: 351 },
};

describe('ListaChoferes', () => {
  let component: ListaChoferesComponent;
  let fixture: ComponentFixture<ListaChoferesComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaChoferesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaChoferesComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify({ ignoreCancelled: true });
  });

  /** Responde la carga de choferes y la de empresas, y devuelve los pedidos de choferes. */
  function responder(datos = RESPUESTA) {
    const pedidos = http.match((r) => r.url === `${environment.apiUrl}/choferes/`);
    pedidos.forEach((p) => p.flush(datos));
    http
      .match((r) => r.url.includes('/empresas'))
      .forEach((p) =>
        p.flush({ items: [], total: 0, pagina: 1, tamano_pagina: 1000, total_paginas: 1 }),
      );
    return pedidos;
  }

  it('should create', () => {
    responder();
    expect(component).toBeTruthy();
  });

  it('pide las estadísticas del período al cargar', () => {
    const pedidos = responder();

    expect(pedidos.length).toBeGreaterThan(0);
    expect(pedidos[0].request.params.get('incluir_estadisticas')).toBe('true');
    expect(component.periodo()?.total_kms).toBe(228782);
    expect(component.choferes()[0].kms_periodo).toBe(6742);
  });

  it('el período viaja al backend, no se calcula en el cliente', () => {
    responder();

    component.cambiarFiltroDias(60);
    vi.advanceTimersByTime(0);

    const pedido = http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`);
    expect(pedido.request.params.get('dias')).toBe('60');
    pedido.flush(RESPUESTA);
  });

  it('el rango de fechas también se resuelve en el backend', () => {
    responder();

    component.cambiarFiltroFechaDesde('2026-01-10');
    vi.advanceTimersByTime(1000);
    let pedido = http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`);
    expect(pedido.request.params.get('fecha_desde')).toBe('2026-01-10');
    pedido.flush(RESPUESTA);

    component.cambiarFiltroFechaHasta('2026-02-20');
    vi.advanceTimersByTime(1000);
    pedido = http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`);
    expect(pedido.request.params.get('fecha_hasta')).toBe('2026-02-20');
    pedido.flush(RESPUESTA);
  });

  it('mientras el usuario sigue eligiendo la fecha no se consulta nada', () => {
    responder();

    // Pasar de agosto a octubre toca septiembre por el camino: no debe consultarse.
    component.cambiarFiltroFechaDesde('2026-08-01');
    vi.advanceTimersByTime(200);
    component.cambiarFiltroFechaDesde('2026-09-01');
    vi.advanceTimersByTime(200);
    component.cambiarFiltroFechaDesde('2026-10-01');

    http.expectNone((r) => r.url === `${environment.apiUrl}/choferes/`);

    vi.advanceTimersByTime(1000);
    const pedidos = http.match((r) => r.url === `${environment.apiUrl}/choferes/`);
    expect(pedidos.length).toBe(1);
    expect(pedidos[0].request.params.get('fecha_desde')).toBe('2026-10-01');
    pedidos[0].flush(RESPUESTA);
  });

  it('tipear el año no dispara consultas con fechas absurdas', () => {
    responder();

    // Así escribe el navegador mientras tipeás "2026" en el año.
    for (const parcial of ['0002-10-01', '0020-10-01', '0202-10-01']) {
      component.cambiarFiltroFechaDesde(parcial);
      vi.advanceTimersByTime(1000);
      http.expectNone((r) => r.url === `${environment.apiUrl}/choferes/`);
    }

    component.cambiarFiltroFechaDesde('2026-10-01');
    vi.advanceTimersByTime(1000);

    const pedido = http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`);
    expect(pedido.request.params.get('fecha_desde')).toBe('2026-10-01');
    pedido.flush(RESPUESTA);
  });

  it('un rango invertido avisa en pantalla y no consulta', () => {
    responder();

    component.cambiarFiltroFechaDesde('2026-10-01');
    vi.advanceTimersByTime(1000);
    http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`).flush(RESPUESTA);

    component.cambiarFiltroFechaHasta('2026-08-01');
    vi.advanceTimersByTime(1000);

    expect(component.avisoPeriodo()).toContain('anterior a la fecha desde');
    http.expectNone((r) => r.url === `${environment.apiUrl}/choferes/`);

    // Al corregirlo, el aviso se va y recién ahí se consulta.
    component.cambiarFiltroFechaHasta('2026-12-01');
    vi.advanceTimersByTime(1000);

    expect(component.avisoPeriodo()).toBeNull();
    http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`).flush(RESPUESTA);
  });

  it('los botones de período no esperan: un click, una consulta', () => {
    responder();

    component.cambiarFiltroDias(60);
    vi.advanceTimersByTime(0);

    http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`).flush(RESPUESTA);
  });

  it('cambiar el período vuelve a la primera página', () => {
    responder();
    component.pagina.set(3);

    component.cambiarFiltroDias(15);
    vi.advanceTimersByTime(0);

    expect(component.pagina()).toBe(1);
    http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`).flush(RESPUESTA);
  });

  it('limpiar el período borra los tres filtros de una', () => {
    responder();
    component.cambiarFiltroDias(30);
    vi.advanceTimersByTime(0);
    http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`).flush(RESPUESTA);
    component.cambiarFiltroFechaDesde('2026-01-10');
    vi.advanceTimersByTime(1000);
    http.expectOne((r) => r.url === `${environment.apiUrl}/choferes/`).flush(RESPUESTA);
    expect(component.hayFiltrosPeriodo()).toBe(true);

    component.limpiarFiltrosPeriodo();

    expect(component.hayFiltrosPeriodo()).toBe(false);
    expect(component.filtroDias()).toBeNull();
    expect(component.filtroFechaDesde()).toBe('');
    expect(component.filtroFechaHasta()).toBe('');
    vi.advanceTimersByTime(1000);
    // Sin filtros vuelve a la consulta inicial, que ApiCache ya tiene guardada:
    // por eso acá no se espera un pedido HTTP nuevo.
  });
});
