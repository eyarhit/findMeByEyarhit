import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvInformationPersonnellesComponent } from './cv-information-personnelles.component';

describe('CvInformationPersonnellesComponent', () => {
  let component: CvInformationPersonnellesComponent;
  let fixture: ComponentFixture<CvInformationPersonnellesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CvInformationPersonnellesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CvInformationPersonnellesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
