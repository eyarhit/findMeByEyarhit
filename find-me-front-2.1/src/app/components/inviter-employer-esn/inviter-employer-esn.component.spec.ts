import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviterEmployerESNComponent } from './inviter-employer-esn.component';

describe('InviterEmployerESNComponent', () => {
  let component: InviterEmployerESNComponent;
  let fixture: ComponentFixture<InviterEmployerESNComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviterEmployerESNComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InviterEmployerESNComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
