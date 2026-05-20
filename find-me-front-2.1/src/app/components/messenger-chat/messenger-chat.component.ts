import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, MessageService } from '../../services/message.service';

@Component({
  selector: 'app-messenger-chat',
  templateUrl: './messenger-chat.component.html',
  styleUrls: ['./messenger-chat.component.scss']
})
export class MessengerChatComponent implements OnInit {
  @Input() companyName: string = '';
  @Input() companyLogo: string = '';
  @Input() jobOwnerId!: number; // ID du recruteur
  @Input() show: boolean = false;
  @Output() closeChat = new EventEmitter<void>();


  currentUserId!: number;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  minimized: boolean = false;

  constructor(private authService: AuthService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId()!;
    console.log(this.jobOwnerId,this.currentUserId)
    console.log('Mon ID utilisateur courant :', this.currentUserId);


    if (!this.currentUserId || !this.jobOwnerId) {
      console.error('IDs manquants : senderId ou receiverId');
      return;
    }

    this.messageService.connect(this.currentUserId);

    this.messageService.getConversation(this.currentUserId, this.jobOwnerId)
      .subscribe((msgs) => {
        this.messages = msgs.map(m => ({
          ...m,
          timestamp: m.timestamp ?? new Date().toISOString()
        }));
      });

    this.messageService.messages$.subscribe((msg) => {
      const lastMsg = msg[msg.length - 1];
      if (!lastMsg) return;

      const { senderId, receiverId } = lastMsg;

      const isBetween = (senderId === this.currentUserId && receiverId === this.jobOwnerId) ||
                        (senderId === this.jobOwnerId && receiverId === this.currentUserId);

      if (isBetween) {
        this.messages.push(lastMsg);
      }
    });
  }

sendMessage(): void {
  const content = this.newMessage.trim();
  if (!content || !this.jobOwnerId || !this.currentUserId) {
    console.warn('Message vide ou ID(s) manquant(s)');
    return;
  }

  const message: ChatMessage = {
    senderId: this.currentUserId,
    receiverId: this.jobOwnerId,
    content: content,
    timestamp: new Date().toISOString()
  };

  this.messageService.sendMessage(message);
  this.newMessage = '';
}


  toggleMinimize(): void {
    this.minimized = !this.minimized;
  }

close(): void {
  this.show = false;
  this.closeChat.emit(); // <- informe le parent
}

}
