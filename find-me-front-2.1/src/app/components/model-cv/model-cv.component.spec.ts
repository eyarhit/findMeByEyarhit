import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelCvComponent } from './model-cv.component';

describe('ModelCvComponent', () => {
  let component: ModelCvComponent;
  let fixture: ComponentFixture<ModelCvComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelCvComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModelCvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
