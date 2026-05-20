import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessengerChatComponent } from './messenger-chat.component';

describe('MessengerChatComponent', () => {
  let component: MessengerChatComponent;
  let fixture: ComponentFixture<MessengerChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessengerChatComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MessengerChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
