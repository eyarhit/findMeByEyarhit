import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardESNComponent } from './dashboard-esn.component';

describe('DashboardESNComponent', () => {
  let component: DashboardESNComponent;
  let fixture: ComponentFixture<DashboardESNComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardESNComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DashboardESNComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
