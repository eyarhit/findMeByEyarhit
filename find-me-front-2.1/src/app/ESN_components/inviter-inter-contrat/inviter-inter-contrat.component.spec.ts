import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InviterInterContratComponent } from './inviter-inter-contrat.component';

describe('InviterInterContratComponent', () => {
  let component: InviterInterContratComponent;
  let fixture: ComponentFixture<InviterInterContratComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InviterInterContratComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InviterInterContratComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
