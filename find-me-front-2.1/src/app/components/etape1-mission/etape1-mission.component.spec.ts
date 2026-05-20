import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Etape1MissionComponent } from './etape1-mission.component';

describe('Etape1MissionComponent', () => {
  let component: Etape1MissionComponent;
  let fixture: ComponentFixture<Etape1MissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Etape1MissionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Etape1MissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
