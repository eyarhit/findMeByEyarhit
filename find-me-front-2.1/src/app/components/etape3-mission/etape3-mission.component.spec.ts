import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Etape3MissionComponent } from './etape3-mission.component';

describe('Etape3MissionComponent', () => {
  let component: Etape3MissionComponent;
  let fixture: ComponentFixture<Etape3MissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Etape3MissionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Etape3MissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
