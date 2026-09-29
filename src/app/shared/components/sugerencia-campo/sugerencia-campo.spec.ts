import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { SugerenciaCampoComponent } from './sugerencia-campo';
import { environment } from '../../../../environments/environment';

const URL = `${environment.apiUrl}/normalizacion/sugerir`;

describe('SugerenciaCampo', () => {
  let fixture: ComponentFixture<SugerenciaCampoComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SugerenciaCampoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(SugerenciaCampoComponent);
    fixture.componentRef.setInput('campo', 'lugar');
    fixture.componentRef.setInput('texto', '');
    http = TestBed.inject(HttpTestingController);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    http.verify({ ignoreCancelled: true });
  });

  function escribir(texto: string) {
    fixture.componentRef.setInput('texto', texto);
    fixture.detectChanges();
  }

  function texto(): string {
    return fixture.nativeElement.textContent ?? '';
  }

  it('muestra la forma correcta y la emite al aceptarla', () => {
    const aceptados: string[] = [];
    fixture.componentInstance.aceptada.subscribe((v) => aceptados.push(v));

    escribir('VT');
    vi.advanceTimersByTime(400);
    http.expectOne(URL).flush({
      campo: 'lugar',
      texto: 'VT',
      sugerido: 'VENADO TUERTO',
      cambios: [{ original: 'VT', sugerido: 'VENADO TUERTO', motivo: 'conocido' }],
    });
    fixture.detectChanges();

    expect(texto()).toContain('VENADO TUERTO');
    fixture.nativeElement.querySelector('button').click();
    expect(aceptados).toEqual(['VENADO TUERTO']);
  });

  it('no muestra nada cuando el valor ya está bien', () => {
    escribir('RUFINO');
    vi.advanceTimersByTime(400);
    http.expectOne(URL).flush({ campo: 'lugar', texto: 'RUFINO', sugerido: null, cambios: [] });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sugerencia')).toBeNull();
  });

  it('mientras el empleado sigue tipeando no consulta', () => {
    escribir('V');
    vi.advanceTimersByTime(200);
    escribir('VT');
    vi.advanceTimersByTime(200);
    escribir('VT ');

    http.expectNone(URL);

    vi.advanceTimersByTime(400);
    const pedidos = http.match(URL);
    expect(pedidos.length).toBe(1);
    expect(pedidos[0].request.body.texto).toBe('VT ');
    pedidos[0].flush({ campo: 'lugar', texto: 'VT', sugerido: null, cambios: [] });
  });

  it('si el servicio falla el formulario sigue andando', () => {
    escribir('VT');
    vi.advanceTimersByTime(400);
    http.expectOne(URL).error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sugerencia')).toBeNull();
  });
});
