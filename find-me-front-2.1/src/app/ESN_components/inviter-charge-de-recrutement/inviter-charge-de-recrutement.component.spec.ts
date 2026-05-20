import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviterChargeDeRecrutementComponent } from './inviter-charge-de-recrutement.component';

describe('InviterChargeDeRecrutementComponent', () => {
  let component: InviterChargeDeRecrutementComponent;
  let fixture: ComponentFixture<InviterChargeDeRecrutementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviterChargeDeRecrutementComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InviterChargeDeRecrutementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
