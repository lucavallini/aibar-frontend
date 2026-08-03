import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ListaMultas } from './lista-multas';

describe('ListaMultas', () => {
  let component: ListaMultas;
  let fixture: ComponentFixture<ListaMultas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaMultas],
      providers: [provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaMultas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
