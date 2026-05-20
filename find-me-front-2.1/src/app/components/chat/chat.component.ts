import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatMessage, MessageService } from '../../services/message.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  userId = 1;
  receiverId = 3;
  messageContent = '';
  messages: ChatMessage[] = [];
  showEmojiPicker = false;
  isOpen = false;

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    this.messageService.connect(this.userId);
    this.messageService.messages$.subscribe(msgs => {
      this.messages = msgs;
      this.scrollToBottom();
    });
  }

  sendMessage(): void {
    const content = this.messageContent.trim();
    if (!content) return;

    const msg: ChatMessage = {
      senderId: this.userId,
      receiverId: this.receiverId,
      content: content,
      timestamp: new Date().toISOString()
    };

    this.messageService.sendMessage(msg);
    this.messages.push(msg);
    this.messageContent = '';
    this.showEmojiPicker = false;
    this.scrollToBottom();
  }

  toggleEmojiPicker(): void {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any): void {
    this.messageContent += event.emoji.native;
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const container = document.getElementById('chat-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }, 100);
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  getInitials(id: number): string {
    return 'U' + id;
  }

  getFormattedDate(timestamp: string | undefined): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Aujourd’hui';
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';

    return date.toLocaleDateString();
  }

  groupMessagesByDate(msgs: ChatMessage[]) {
    const grouped: { [key: string]: ChatMessage[] } = {};
    msgs.forEach(msg => {
      const date = this.getFormattedDate(msg.timestamp);
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(msg);
    });
    return Object.entries(grouped).map(([date, messages]) => ({ date, messages }));
  }

  ngOnDestroy(): void {
    this.messageService.disconnect();
  }
}
