import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CodingameStepComponent } from './codingame-step.component';

describe('CodingameStepComponent', () => {
  let component: CodingameStepComponent;
  let fixture: ComponentFixture<CodingameStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CodingameStepComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CodingameStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
