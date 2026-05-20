import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterFeelancerComponent } from './register-freelancer.component';

describe('RegisterFeelancerComponent', () => {
  let component: RegisterFeelancerComponent;
  let fixture: ComponentFixture<RegisterFeelancerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RegisterFeelancerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegisterFeelancerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
