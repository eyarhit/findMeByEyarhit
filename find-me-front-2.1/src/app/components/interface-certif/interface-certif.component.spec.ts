import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterfaceCertifComponent } from './interface-certif.component';

describe('InterfaceCertifComponent', () => {
  let component: InterfaceCertifComponent;
  let fixture: ComponentFixture<InterfaceCertifComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterfaceCertifComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InterfaceCertifComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
