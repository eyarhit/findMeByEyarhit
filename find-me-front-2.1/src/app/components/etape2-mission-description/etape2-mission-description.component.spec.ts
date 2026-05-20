import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Etape2MissionDescriptionComponent } from './etape2-mission-description.component';

describe('Etape2MissionDescriptionComponent', () => {
  let component: Etape2MissionDescriptionComponent;
  let fixture: ComponentFixture<Etape2MissionDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Etape2MissionDescriptionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Etape2MissionDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
