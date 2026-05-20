import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SauvegardeCvComponent } from './sauvegarde-cv.component';

describe('SauvegardeCvComponent', () => {
  let component: SauvegardeCvComponent;
  let fixture: ComponentFixture<SauvegardeCvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SauvegardeCvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SauvegardeCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
