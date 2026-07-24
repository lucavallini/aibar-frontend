import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaMultas } from './lista-multas';

describe('ListaMultas', () => {
  let component: ListaMultas;
  let fixture: ComponentFixture<ListaMultas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaMultas],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaMultas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
