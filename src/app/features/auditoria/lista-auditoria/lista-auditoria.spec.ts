import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaAuditoria } from './lista-auditoria';

describe('ListaAuditoria', () => {
  let component: ListaAuditoria;
  let fixture: ComponentFixture<ListaAuditoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaAuditoria],
    }).compileComponents();

    fixture = TestBed.createComponent(ListaAuditoria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
