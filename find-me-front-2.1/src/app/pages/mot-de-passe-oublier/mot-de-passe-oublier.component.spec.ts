import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MotDePasseOublierComponent } from './mot-de-passe-oublier.component';



describe('MotDePasseOublierComponent', () => {
  let component: MotDePasseOublierComponent;
  let fixture: ComponentFixture<MotDePasseOublierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MotDePasseOublierComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MotDePasseOublierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
