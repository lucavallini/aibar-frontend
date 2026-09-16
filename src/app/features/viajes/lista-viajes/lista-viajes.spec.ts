import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { ListaViajes } from './lista-viajes';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';
import { Viaje } from '../../../core/models/viaje.model';

const VIAJE = {
  id: 'via-1',
  origen: 'ROSARIO',
  destino: 'BAHIA BLANCA',
  estado: 'finalizado',
  viaje_vuelta: null,
} as unknown as Viaje;

describe('ListaViajes', () => {
  let component: ListaViajes;
  let fixture: ComponentFixture<ListaViajes>;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaViajes],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaViajes);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture.detectChanges();
    await fixture.whenStable();
    drenar();
  });

  /** Responde las cargas de listas que la pantalla dispara sola, para no repetirlo en cada test. */
  function drenar() {
    http
      .match(() => true)
      .forEach((p) =>
        p.flush({ items: [], total: 0, pagina: 1, tamano_pagina: 20, total_paginas: 1 }),
      );
  }

  afterEach(() => {
    drenar();
    http.verify({ ignoreCancelled: true });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /** El rol sale del JWT y no cambia durante la sesión, así que se fija antes de montar. */
  function conRol(rol: string): ListaViajes {
    vi.spyOn(auth, 'getRol').mockReturnValue(rol);
    const propio = TestBed.createComponent(ListaViajes);
    propio.detectChanges();
    drenar();
    return propio.componentInstance;
  }

  it('solo el administrador puede eliminar', () => {
    expect(conRol('administrador').puedeEliminar()).toBe(true);
    expect(conRol('empleado').puedeEliminar()).toBe(false);
    // "aibar" es el cliente en solo lectura: esAdmin() le da true, pero borrar no puede.
    expect(conRol('aibar').puedeEliminar()).toBe(false);
  });

  it('el borrado pega un DELETE y recarga la lista', () => {
    component.abrirEliminar(VIAJE);
    component.confirmarEliminar();

    const pedido = http.expectOne(`${environment.apiUrl}/viajes/via-1`);
    expect(pedido.request.method).toBe('DELETE');
    pedido.flush({ eliminados: 1, cargas_combustible_eliminadas: 1, multas_desvinculadas: 0 });

    expect(component.viajeAEliminar()).toBeNull();
  });

  it('no borra nada hasta que se confirma', () => {
    component.abrirEliminar(VIAJE);

    http.expectNone((r) => r.method === 'DELETE');

    component.cerrarEliminar();
    expect(component.viajeAEliminar()).toBeNull();
    http.expectNone((r) => r.method === 'DELETE');
  });

  it('el aviso dice que la vuelta se va con la ida', () => {
    expect(component.mensajeEliminar(VIAJE)).toContain('el viaje ROSARIO');

    const conVuelta = { ...VIAJE, viaje_vuelta: { id: 'via-2' } } as unknown as Viaje;
    expect(component.mensajeEliminar(conVuelta)).toContain('el viaje y su vuelta');
    expect(component.mensajeEliminar(conVuelta)).toContain('no se puede deshacer');
  });

  it('un doble click no dispara dos borrados', () => {
    component.abrirEliminar(VIAJE);
    component.confirmarEliminar();
    component.confirmarEliminar();

    const pedidos = http.match((r) => r.method === 'DELETE');
    expect(pedidos.length).toBe(1);
    pedidos[0].flush({ eliminados: 1, cargas_combustible_eliminadas: 0, multas_desvinculadas: 0 });
  });
});
