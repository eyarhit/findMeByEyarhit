import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMissionComponent } from './show-mission.component';

describe('ShowMissionComponent', () => {
  let component: ShowMissionComponent;
  let fixture: ComponentFixture<ShowMissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowMissionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ShowMissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
