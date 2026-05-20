import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertifDiplomeComponent } from './certif-diplome.component';

describe('CertifDiplomeComponent', () => {
  let component: CertifDiplomeComponent;
  let fixture: ComponentFixture<CertifDiplomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CertifDiplomeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CertifDiplomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
