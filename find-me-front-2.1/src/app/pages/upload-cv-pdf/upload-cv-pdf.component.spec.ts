import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadCvPdfComponent } from './upload-cv-pdf.component';

describe('UploadCvPdfComponent', () => {
  let component: UploadCvPdfComponent;
  let fixture: ComponentFixture<UploadCvPdfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadCvPdfComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UploadCvPdfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
