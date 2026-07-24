import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaChoferes } from './lista-choferes';

describe('ListaChoferes', () => {
  let component: ListaChoferes;
  let fixture: ComponentFixture<ListaChoferes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaChoferes],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaChoferes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
