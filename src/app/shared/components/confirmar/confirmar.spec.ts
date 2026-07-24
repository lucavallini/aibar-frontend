import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Confirmar } from './confirmar';

describe('Confirmar', () => {
  let component: Confirmar;
  let fixture: ComponentFixture<Confirmar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Confirmar],
    }).compileComponents();

    fixture = TestBed.createComponent(Confirmar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
