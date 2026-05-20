import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CometenceProfessionnelPopupComponent } from './cometence-professionnel-popup.component';

describe('CometenceProfessionnelPopupComponent', () => {
  let component: CometenceProfessionnelPopupComponent;
  let fixture: ComponentFixture<CometenceProfessionnelPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CometenceProfessionnelPopupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CometenceProfessionnelPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
