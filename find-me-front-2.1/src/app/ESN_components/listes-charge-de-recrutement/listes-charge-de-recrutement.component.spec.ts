import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListesChargeDeRecrutementComponent } from './listes-charge-de-recrutement.component';

describe('ListesChargeDeRecrutementComponent', () => {
  let component: ListesChargeDeRecrutementComponent;
  let fixture: ComponentFixture<ListesChargeDeRecrutementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListesChargeDeRecrutementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ListesChargeDeRecrutementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
